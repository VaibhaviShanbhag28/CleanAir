# CleanAir — Two-Role Resolution Workflow: Product & Architecture Design

**Version:** 1.1 · **Date:** 2 July 2026
**Scope:** Extend the existing CleanAir app (React 18 + Vite + TS + Tailwind + Radix + Zustand + Firebase Auth · FastAPI + Firestore/in-memory + Cloudinary + OpenRouter AI) with role-based signup, Aadhaar verification, a municipality work workflow, and a complaint timeline.

**Ground rule:** nothing existing is rebuilt. The current `reports` model, routers, auth, AI analysis, karma, notifications, and pages are **extended in place**. Every section below names the existing module it builds on.

---

## 1. Roles & Onboarding

Keep Firebase Google sign-in exactly as-is (`lib/firebase.ts`, `useAuth.ts`). Role selection is a **post-auth onboarding wizard**, shown once when `users/{uid}` has no `role` field. The `UserRole` type already exists in `types/index.ts` (`citizen | authority | field_worker | admin`) — we use `citizen` and `authority` (displayed as "Municipality Official").

### Flow

```
Google Sign-In (existing, unchanged)
   └─► /onboarding  (only if profile incomplete)
        Step 1  "Continue as"        → Citizen | Municipality Official   (two large cards)
        Step 2  Aadhaar Verification → Aadhaar number + Full name
        Step 3  (officials only)     → Municipality, Department, Designation, Employee ID
        └─► role-based redirect: citizen → /dashboard (existing) · official → /muni
```

**Step 1 card design:** two side-by-side cards (stacked on mobile), each with a lucide icon (User / Landmark), one-line description, hover lift, 2px accent ring on selection. One "Continue" button. No unnecessary complexity.

### Aadhaar verification (placeholder, but honest)

Real Aadhaar numbers use the **Verhoeff checksum** — validating it requires no API and rejects made-up numbers, so the demo feels real:

1. Must be 12 digits, must not start with 0 or 1.
2. Verhoeff checksum must pass (~30 lines of deterministic Python).
3. Name match: normalized comparison of entered "Full name" (case/space-insensitive, ≥ 0.85 `difflib.SequenceMatcher` ratio). In production this becomes the UIDAI/DigiLocker eKYC name response — the interface doesn't change.

### Aadhaar storage — never store the raw number

```
users/{uid}:
  aadhaarHash:   SHA-256(aadhaar + AADHAAR_SALT)   # server-side salt in backend/.env
  aadhaarLast4:  "1234"                            # display as "XXXX-XXXX-1234"
  verifiedName:  "Rajesh Kumar"
  verifiedAt:    timestamp
```

The hash enables one-Aadhaar-one-account enforcement without ever holding the number, and survives a future switch to real eKYC unchanged.

### Role in the token (critical for RBAC)

After onboarding, the backend sets a **Firebase custom claim** `{"role": "citizen" | "authority"}` via the Admin SDK (already initialized in `database.py`). Every ID token then carries the role — the backend authorizes from the verified token, never from a client-supplied field.

---

## 2. Report Lifecycle — the state machine

Extends the existing `ReportStatus` in `models/schemas.py`. Current statuses map forward: `acknowledged → assigned`, `resolved → completed` (keep old values as aliases during migration so seeded data still works).

```
              ┌──────────► rejected (terminal, requires reason)
              │
pending ──► assigned ──► in_progress ──► pending_review ──► completed (terminal)
              │               │  ▲
              │               ▼  │
              │            on_hold (requires reason)
              └──────────► needs_info ──► (citizen responds) ──► assigned
```

### Transition guard table (backend-enforced)

| From | To | Who | Required payload |
|---|---|---|---|
| pending | assigned | official | — ("Accept" = self-assign) |
| pending / assigned | rejected | official | `reason` (min 20 chars) |
| assigned | in_progress | assigned official | — ("Start Working") |
| assigned / in_progress | needs_info | assigned official | `question` |
| needs_info | assigned | citizen (reply) | `response` |
| in_progress | on_hold | assigned official | `reason` |
| on_hold | in_progress | assigned official | — |
| in_progress | pending_review | assigned official | ≥1 after-image + completion description + officer attribution |
| pending_review | completed | official | — (self-approve in MVP; supervisor later) |
| pending_review | in_progress | official | `reason` (rework) |

Any other transition returns `409 Conflict`. One function owns all of this — `workflow.transition(report, to_status, actor, payload)` — it validates, mutates, appends the timeline event, recomputes progress %, and fans out notifications. The existing `/resolve` and `acknowledge_report()` logic in `database.py` folds into it; no endpoint mutates status any other way.

### Live progress percentage (derived, never typed)

```
pending 0% · assigned 15% · in_progress 30% · progress updates interpolate 30→85%
pending_review 90% · completed 100% · on_hold freezes · rejected shows badge not bar
```

---

## 3. Event-sourced timeline = audit log = work history

**One append-only collection powers the timeline UI, the audit requirement, and the work log.** Nothing on a report is ever overwritten; every change is an event.

```
report_events/{id}
  reportId       FK → reports
  seq            monotonic int per report
  type           created | assigned | status_changed | progress_update |
                 info_requested | info_provided | note_added |
                 completion_submitted | completed | rejected | reopened
  actorId        FK → users
  actorSnapshot  { name, role, designation?, department?, municipality? }
  payload        type-specific JSON (below)
  visibility     "public" | "internal"        # internal = officer notes
  createdAt      timestamp
```

`actorSnapshot` is denormalized **deliberately**: "Completed by Rajesh Kumar, Sanitation Inspector, Mangalore City Corporation" must stay permanently on the complaint even if the officer later changes department or leaves.

**Progress update payload** (the work-log submission):

```json
{
  "statusLabel": "Garbage removed, area being sanitized",
  "description": "...",
  "images": ["https://res.cloudinary.com/..."],
  "materialsUsed": "2 trucks, 4 workers, disinfectant",
  "estimatedCompletion": "2026-07-05",
  "progressPercent": 65
}
```

**Completion payload:** `{ afterImages: [...], completionDescription, officer: {name, designation, department, municipality} }` — the permanent proof-of-completion.

Citizens see `visibility == "public"` events; officials see all. The audit-history requirement is satisfied for free — the event log **is** the audit log.

---

## 4. Database Schema

Firestore collections extending the existing `_store` in `services/database.py` (`reports`, `users`, `notifications`, `karma`, … already exist). Each maps 1:1 to a Postgres table if migrated later; FK annotations are the relationships.

```
users  (extends existing)
  uid PK · email · displayName · photoURL
  role: citizen | authority | admin
  aadhaarHash UNIQUE · aadhaarLast4 · verifiedName · verifiedAt
  ward? (citizen) · municipalityId? FK · departmentId? FK · designation? · employeeId? (official)
  createdAt · updatedAt

municipalities                       # NEW
  id PK · name ("Bruhat Bengaluru Mahanagara Palike") · city · state · wards: string[]

departments                          # NEW
  id PK · municipalityId FK · name (Sanitation, Drainage, Roads, Solid Waste, Parks)

reports  (extends existing — keeps id format, location, aiAnalysis, upvotes)
  id PK · qrSlug UNIQUE (short random, QR target)
  userId FK → users · isAnonymous
  category: existing PollutionType + garbage | overflowing_bin | road_waste |
            drainage | debris | public_toilet | dead_animal
  description · images[] (Cloudinary) · aiAnalysis (existing AI service, unchanged)
  location { lat, lng, ward, address, district, municipalityId FK }
  status (state machine §2) · progressPercent (derived)
  assignedOfficerId? FK · assignedDepartmentId? FK · assignedAt?
  slaDueAt (createdAt + per-category SLA) · resolvedAt?
  completionProof? { afterImages[], description, officer{...}, completedAt }
  upvotes · createdAt · updatedAt

report_events                        # NEW — §3: timeline + audit + work log

notifications  (existing collection — add types)
  id PK · userId FK · reportId? FK
  type: report_accepted | work_started | progress_update | info_needed |
        completed | rejected | nearby_issue
  title · body · read · createdAt

audit_logs                           # NEW — non-report actions
  id PK · actorId FK · action · targetType · targetId · before · after · createdAt
```

**Indexes:** reports `(status, municipalityId)`, `(userId, createdAt desc)`, `(assignedOfficerId, status)`, `(location.ward, status)` · events `(reportId, seq)` · notifications `(userId, read, createdAt desc)`.

---

## 5. API Design

New routers `auth_router.py` + workflow endpoints added to the existing `reports.py`. Existing endpoints (list/create/get/upvote, AI, analytics, community, weather) stay as they are. All protected routes: `Authorization: Bearer <Firebase ID token>`.

```
AUTH / ONBOARDING (new)
POST  /api/auth/onboard            role + aadhaar + name (+ official fields) → verify, hash,
                                   store, set custom claim
GET   /api/auth/me                 profile incl. role
GET   /api/municipalities          list + departments (official signup dropdowns)

REPORTS — citizen (existing + new)
POST  /api/reports                 EXISTS (add category values + qrSlug + slaDueAt)
GET   /api/reports/mine            new convenience (= existing list filtered by token uid)
GET   /api/reports/nearby          EXISTS (map page uses it)
GET   /api/reports/{id}            EXISTS (strip internal notes for citizens)
GET   /api/reports/{id}/events     NEW — timeline, visibility-filtered
POST  /api/reports/{id}/respond    NEW — citizen answers needs_info
GET   /api/r/{qrSlug}              NEW — public read-only view (QR target, no auth)

REPORTS — official workflow (new; /resolve + dormant acknowledge logic fold in)
POST  /api/reports/{id}/accept              pending → assigned
POST  /api/reports/{id}/start               assigned → in_progress  ("Start Working")
POST  /api/reports/{id}/progress            work-log entry → progress_update event
POST  /api/reports/{id}/hold | /resume
POST  /api/reports/{id}/request-info        + question
POST  /api/reports/{id}/reject              + reason
POST  /api/reports/{id}/submit-completion   after-images + description + attribution
POST  /api/reports/{id}/approve             pending_review → completed
POST  /api/reports/{id}/notes               internal note (visibility=internal)
GET   /api/reports/{id}/certificate         completion certificate (HTML→print/PDF)

DASHBOARDS (extends existing analytics.py)
GET   /api/muni/stats              counts by status, avg resolution time, SLA compliance,
                                   complaints/month, area-wise
GET   /api/muni/leaderboard        top officers & municipalities (completed, avg time, rating)
GET   /api/notifications/{uid}     EXISTS — add PATCH /api/notifications/{id}/read

MEDIA
POST  /api/upload                  image → Cloudinary URL (reuse storage_service.py)
```

Transitions are **verbs, not a generic PATCH status** — each has distinct required payloads, keeps the guard table enforceable, and self-documents in `/api/docs`. (The current generic `PATCH /api/reports/{id}` gets restricted to non-status fields.)

Also fixed as part of this work: the `/upvote` response nesting bug (report currently returned under an `"upvotes"` key) and per-uid dedup on upvote/join/vote endpoints.

---

## 6. RBAC

```python
# backend/deps.py (new)
async def current_user(authorization: str = Header(...)) -> User:
    decoded = firebase_auth.verify_id_token(token)     # signature + expiry
    return await get_user(decoded["uid"])              # role from claims/DB

def require_role(*roles):
    async def dep(user = Depends(current_user)):
        if user.role not in roles: raise HTTPException(403)
        return user
    return dep
```

Rules: role read **only** from verified token/DB · citizens access only their own reports (+ public views) · officials only their municipality's reports · only the **assigned** officer runs work-state transitions · internal notes stripped server-side. The frontend `RequireRole` route wrapper is UX only — the API is the security boundary.

---

## 7. Folder Structure (extension of what exists)

```
backend/
  deps.py                           # NEW — auth dependencies (§6)
  routers/
    auth_router.py                  # NEW
    reports.py                      # EXTEND — workflow endpoints
    (ai_router, analytics, community, notifications, weather — unchanged)
  services/
    aadhaar.py                      # NEW — Verhoeff, hash, name-match
    workflow.py                     # NEW — state machine + event append + notify fan-out
    certificate.py                  # NEW — reuses the notice-generator pattern in ai_service.py
    (ai_service, database, storage_service, weather_service — extended, not replaced)
  models/
    schemas.py                      # EXTEND — statuses, event & transition payload models

frontend/src/
  pages/
    onboarding/  RoleSelect.tsx · AadhaarVerify.tsx · OfficialDetails.tsx     # NEW
    Dashboard.tsx                   # EXTEND — citizen dashboard (stat cards, activity feed)
    ReportPage.tsx                  # EXTEND — new categories
    citizen/  ComplaintDetail.tsx · Profile.tsx                               # NEW
    muni/     Dashboard.tsx · Queue.tsx · Workspace.tsx · WorkLogForm.tsx     # NEW
              · Analytics.tsx · Leaderboard.tsx     # evolve MunicipalPage.tsx into these
    public/   ReportPublic.tsx      # NEW — QR landing, no auth
    (MapPage, CommunityPage, KarmaPage, DiaryPage, AIToolsPage — unchanged)
  components/
    complaint/  StatusBadge · Timeline · TimelineEvent · ProgressBar
                · BeforeAfterSlider · CompletionCard · QRBadge               # NEW
    dashboard/  StatCard · EmptyState                                        # NEW
    (charts: recharts already installed)
  store/index.ts                    # EXTEND — authSlice(role) + reportSlice (Zustand)
  hooks/       useRole.ts · useReport.ts                                     # NEW
  lib/api.ts                        # EXTEND — typed workflow client
```

Routing: `/onboarding` · citizen `/dashboard/*` · official `/muni/*` · public `/r/:qrSlug`. `RequireRole` wrapper redirects mismatches.

---

## 8. Screens

**Citizen dashboard `/dashboard`** (evolve existing Dashboard.tsx): greeting + notification bell (unread badge) · 4 stat cards (Total, In Progress, Completed, Nearby-open) · "Report New Issue" primary CTA · **My Reports** list — image thumb, category chip, address, date, StatusBadge, thin progress bar · Nearby issues mini-map (Google Maps loader already wired) · Recent activity feed from events on own reports.

**Report detail (citizen):** hero image · status + animated progress bar · **vertical timeline** (§9) · on completion a **Resolved card**: officer name, designation, department, municipality, completion date, **before/after slider** · QR badge · "Contest this resolution" (48 h reopen window).

**Municipality dashboard `/muni`:** stat row — Pending / Assigned to me / In Progress / Waiting Review / Completed this month — with **SLA-overdue count in red** · tabbed queue table with search & filters (ID, area, status, officer, date, category) · row click → workspace.

**Report workspace `/muni/reports/:id`** — the core official screen, two columns:
- **Left:** images, description, location map, reporter (or "Anonymous"), existing AI analysis card, full timeline incl. internal notes.
- **Right (sticky action panel):** current status + context-aware buttons — Accept → **Start Working** → Add Progress / Hold / Request Info → **Submit Completion** — plus Reject (reason modal) and internal notes.

**Work-log form:** status label · description · image upload (Cloudinary) · materials (optional) · ETA (optional) · progress slider clamped to the allowed band · **attribution fields** (officer name / designation / department / municipality — prefilled from profile, snapshotted into the event).

**Completion form:** after-image(s) required · completion description required · attribution → permanent `completionProof` + certificate.

---

## 9. UI / UX System

**Aesthetic:** Linear/Stripe-class — restrained, crisp, generous whitespace, one accent.

- **Typography:** Inter (or Geist). Sizes 12/14/16/20/28/36, weights 400/500/600 only. `tabular-nums` for stat cards.
- **Color:** neutral background scale; accent **emerald-600**; status palette: pending amber · assigned blue · in_progress violet · pending_review cyan · completed emerald · on_hold slate · rejected red · needs_info orange. The same tokens color badges, timeline dots, and chart series.
- **Dark/light:** CSS variables + Tailwind `dark:` class strategy (globals.css already exists), toggle persisted in Zustand; charts read the tokens.
- **Shape & motion:** rounded-2xl cards, 1px borders, `shadow-sm→md` hover; 150–200 ms ease-out; timeline events fade-slide with stagger; progress bar animates width; stat-card count-up; skeletons everywhere, no spinners. `tailwindcss-animate` (installed) covers all of it; Framer Motion optional later.
- **Timeline component:** vertical line, status-colored dots with icons, event cards (actor + designation snapshot, "2h ago", payload); progress cards show image thumbnails (lightbox) + material/ETA chips; internal notes get an "Internal" tag + muted background (muni only).
- **Before/After slider:** two stacked images, draggable divider (~40 lines of pointer events), corner labels. Completed reports + public transparency view.
- **Mobile-first:** citizen flows at 390 px (bottom nav: Home · Reports · ➕ Report · Nearby · Profile); muni dashboard desktop-first, responsive to tablet.
- **Empty states:** illustration + one line + CTA ("No reports yet — spotted garbage nearby? Report it in 30 seconds.").

---

## 10. Feature Triage

**MVP (build now):** role onboarding + Aadhaar (Verhoeff) · state machine + guards · event timeline · work-log progress updates with attribution · proof-of-completion · citizen + muni dashboards · notifications on every transition (existing router) · search & filters · derived progress % · before/after slider · SLA due dates + overdue flags.

**v1.1 (fast follows, ≤ a day each):** QR per report (`qrcode` lib → `/r/{slug}`) · digital completion certificate (HTML template → print/PDF; same pattern as the BBMP notice generator already in `ai_service.py`) · muni performance stats + officer leaderboard (compute from events; reuse the karma leaderboard UI) · public transparency layer on the existing MapPage (resolved reports, before/after) · citizen satisfaction rating (1–5 after completion, feeds leaderboard).

**Later / defer:** real UIDAI eKYC · auto-assignment by workload · WhatsApp/SMS adapters on the notification fan-out · ML duplicate detection (MVP version: warn when an open same-category report exists within 100 m — one geo query) · multi-city admin console.

**Extra trust features (cheap, high-value):** duplicate nudge ("already reported nearby — upvote instead", also fixes duplicate noise) · 48 h reopen window → `pending_review` · shareable public report links (the QR page doubles as proof) · CSV export for municipal records · anonymous reporting (already in the data model) · karma integration: completed report = +25 karma to the reporting citizen (system already built).

---

## 11. Security & Storage

- Firebase ID token verified server-side on every request (Admin SDK already initialized).
- Role from custom claims only; all authorization server-side (§6).
- Aadhaar: salted SHA-256 + last-4 only, salt in `.env`. **Rotate the API keys currently committed in `backend/.env` and move them out of any repo history** (Cloudinary secret, Maps, OpenWeather, OpenRouter).
- Pydantic validation everywhere (pattern already established); uploads whitelist jpeg/png/webp ≤ 10 MB; Cloudinary strips EXIF GPS after the app reads it for location.
- Rate limits: report creation 10/day/user; dedup upvote/join/vote by uid (current endpoints allow repeat increments — fix here).
- `report_events` is append-only: no update/delete endpoint exists, ever.
- CORS locked to the frontend origin in production.

**File storage:** keep Cloudinary (already wired in `storage_service.py`). Folders `reports/{id}/original|progress|completed`; store URL + public ID; serve `f_auto,q_auto`; thumbnails via URL transforms — zero image-processing code.

**Scalability path:** in-memory → Firestore is already a flag flip. If relational analytics outgrow Firestore, the schema ports table-for-table to Postgres + SQLAlchemy; the event log becomes an `events` table with a unique `(report_id, seq)` index. API contracts don't change — which is exactly why all workflow logic lives in `workflow.py`, not in routers.

---

## 12. Build Order

1. **Auth & roles** — onboarding wizard, `aadhaar.py`, custom claims, `RequireRole` routing. *Everything depends on this.*
2. **Report model extension** — new statuses/categories/fields, `report_events` collection, seed-data update.
3. **State machine + timeline** — `workflow.py`, transition endpoints, Timeline UI. *The product's spine.*
4. **Muni workspace** — queue, workspace screen, work-log form, completion flow (evolves MunicipalPage.tsx).
5. **Citizen experience** — dashboard upgrade, detail + timeline, notification wiring, before/after slider.
6. **Polish & smart features** — analytics, leaderboard, QR, certificate, public page, dark-mode pass, empty states, animations.

Each phase ships something demo-able; phases 3+4 together are the "startup product" moment.
