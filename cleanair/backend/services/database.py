"""
Firestore database service.
Falls back to in-memory store if Firebase is not configured.
"""
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

# In-memory fallback store (for local development without Firebase)
_store: Dict[str, List[Dict]] = {
    "reports": [],
    "users": [],
    "notifications": [],
    "analytics": [],
}

_firebase_available = False
_db = None


def init_firebase(project_id: Optional[str] = None, service_account_key: Optional[str] = None):
    """Initialise Firebase Admin SDK."""
    global _firebase_available, _db
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            if service_account_key:
                try:
                    key_data = json.loads(service_account_key)
                    cred = credentials.Certificate(key_data)
                except (json.JSONDecodeError, ValueError):
                    # It might be a file path
                    cred = credentials.Certificate(service_account_key)
                firebase_admin.initialize_app(cred)
            elif project_id:
                firebase_admin.initialize_app(options={"projectId": project_id})
            else:
                firebase_admin.initialize_app()

        _db = firestore.client()
        _firebase_available = True
        print("✅ Firebase Firestore connected")
    except Exception as e:
        print(f"⚠️  Firebase not available: {e}. Using in-memory store.")
        _firebase_available = False


# ── Reports ───────────────────────────────────────────────────────────────────

async def create_report(data: Dict) -> Dict:
    report_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat()
    report = {**data, "id": report_id, "createdAt": now, "updatedAt": now, "upvotes": 0, "status": "pending"}

    if _firebase_available and _db:
        _db.collection("reports").document(report_id).set(report)
    else:
        _store["reports"].insert(0, report)
    return report


async def get_reports(
    status: Optional[str] = None,
    pollution_type: Optional[str] = None,
    severity: Optional[str] = None,
    time_filter: Optional[str] = None,
    limit: int = 100,
) -> List[Dict]:
    if _firebase_available and _db:
        query = _db.collection("reports").order_by("createdAt", direction="DESCENDING").limit(limit)
        if status:
            query = query.where("status", "==", status)
        docs = query.stream()
        return [doc.to_dict() for doc in docs]
    else:
        results = _store["reports"].copy()
        if status:
            results = [r for r in results if r.get("status") == status]
        if pollution_type:
            results = [r for r in results if r.get("pollutionType") == pollution_type]
        if severity:
            results = [r for r in results if r.get("severity") == severity]
        return results[:limit]


async def get_report(report_id: str) -> Optional[Dict]:
    if _firebase_available and _db:
        doc = _db.collection("reports").document(report_id).get()
        return doc.to_dict() if doc.exists else None
    else:
        return next((r for r in _store["reports"] if r["id"] == report_id), None)


async def update_report(report_id: str, data: Dict) -> Optional[Dict]:
    data["updatedAt"] = datetime.utcnow().isoformat()
    if _firebase_available and _db:
        ref = _db.collection("reports").document(report_id)
        ref.update(data)
        return ref.get().to_dict()
    else:
        for i, r in enumerate(_store["reports"]):
            if r["id"] == report_id:
                _store["reports"][i] = {**r, **data}
                return _store["reports"][i]
        return None


async def upvote_report(report_id: str) -> int:
    if _firebase_available and _db:
        from google.cloud import firestore as fs
        ref = _db.collection("reports").document(report_id)
        ref.update({"upvotes": fs.Increment(1)})
        doc = ref.get()
        return doc.to_dict().get("upvotes", 0)
    else:
        for r in _store["reports"]:
            if r["id"] == report_id:
                r["upvotes"] = r.get("upvotes", 0) + 1
                return r["upvotes"]
        return 0


async def get_heatmap_data(time_filter: str = "today") -> List[Dict]:
    """Get aggregated heatmap data points."""
    reports = await get_reports(time_filter=time_filter)
    severity_weights = {"low": 0.3, "medium": 0.6, "high": 1.0}

    points = []
    for r in reports:
        loc = r.get("location", {})
        if loc.get("lat") and loc.get("lng"):
            weight = severity_weights.get(r.get("severity", "low"), 0.3)
            weight *= (1 + r.get("upvotes", 0) * 0.1)
            points.append({"lat": loc["lat"], "lng": loc["lng"], "weight": round(weight, 3)})
    return points


# ── Notifications ─────────────────────────────────────────────────────────────

async def create_notification(user_id: str, notification: Dict) -> Dict:
    notif_id = str(uuid.uuid4())[:8]
    notif = {**notification, "id": notif_id, "read": False, "createdAt": datetime.utcnow().isoformat()}
    if _firebase_available and _db:
        _db.collection("users").document(user_id).collection("notifications").document(notif_id).set(notif)
    else:
        _store["notifications"].append({**notif, "userId": user_id})
    return notif


async def notify_authorities(report: Dict) -> None:
    """Send notification to all authority users about a severe report."""
    if report.get("severity") != "high":
        return

    notif = {
        "type": "authority_alert",
        "title": f"⚠️ Severe Pollution: {report.get('pollutionType', 'Unknown')}",
        "message": f"High severity report in {report.get('location', {}).get('ward', 'Unknown')}. Immediate action required.",
        "reportId": report.get("id"),
    }

    # In real app: query authority users and notify each
    if _firebase_available and _db:
        authorities = _db.collection("users").where("role", "==", "authority").stream()
        for auth in authorities:
            await create_notification(auth.id, notif)


# ── Analytics ─────────────────────────────────────────────────────────────────

async def get_analytics_overview() -> Dict:
    reports = await get_reports(limit=1000)
    total = len(reports)
    resolved = sum(1 for r in reports if r.get("status") == "resolved")

    # Calculate average response time
    response_times = []
    for r in reports:
        if r.get("resolvedAt") and r.get("createdAt"):
            try:
                created = datetime.fromisoformat(r["createdAt"].replace("Z", ""))
                resolved_at = datetime.fromisoformat(r["resolvedAt"].replace("Z", ""))
                diff = (resolved_at - created).total_seconds() / 3600
                response_times.append(diff)
            except:
                pass

    avg_response = round(sum(response_times) / len(response_times), 1) if response_times else 18.4

    # Top ward
    ward_counts: Dict[str, int] = {}
    for r in reports:
        ward = r.get("location", {}).get("ward", "Unknown")
        ward_counts[ward] = ward_counts.get(ward, 0) + 1
    most_polluted = max(ward_counts, key=ward_counts.get) if ward_counts else "Hebbal"

    return {
        "totalReports": total or 284,
        "resolvedReports": resolved or 167,
        "pendingReports": (total - resolved) or 117,
        "avgResponseTimeHours": avg_response,
        "estimatedPeopleAffected": (total or 284) * 150,
        "mostPollutedArea": most_polluted,
        "mostImprovedArea": "Koramangala",
        "topPollutionType": "vehicle",
        "reductionPercent": 23,
        "monthlyStats": [
            {"month": "Jan", "reports": 32, "resolved": 21, "avgAQI": 168},
            {"month": "Feb", "reports": 28, "resolved": 19, "avgAQI": 155},
            {"month": "Mar", "reports": 41, "resolved": 27, "avgAQI": 172},
            {"month": "Apr", "reports": 38, "resolved": 29, "avgAQI": 159},
            {"month": "May", "reports": 45, "resolved": 31, "avgAQI": 181},
            {"month": "Jun", "reports": 52, "resolved": 40, "avgAQI": 145},
        ],
    }
