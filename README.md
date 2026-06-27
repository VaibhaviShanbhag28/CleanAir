# 🌿 CleanAir — Clear Streets

> **Hack2Skill 2024 Submission** — Spot and Fix Local Pollution Hotspots in Indian Cities

[![Demo](https://img.shields.io/badge/Demo-Live-green)](https://cleanair-app.web.app)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Built with](https://img.shields.io/badge/Built%20with-React%20%2B%20FastAPI%20%2B%20Gemini-purple)](https://ai.google.dev)

---

## 🎯 Problem Statement

City-level AQI apps miss **hyper-local** pollution events:
- 🔥 Garbage fires near your street
- 🏗️ Construction dust clouds
- 🏭 Industrial chimney smoke
- 🚗 Vehicle emission hotspots at traffic junctions

**CleanAir** bridges this gap with citizen reporting + Gemini AI + live sensor data + Google Maps heatmaps — creating a real-time, actionable pollution monitoring system for Indian cities.

---

## 🚀 Features

| Feature | Status |
|---------|--------|
| 📸 Photo/Video/Voice reporting | ✅ Working |
| 🤖 Gemini Vision AI analysis | ✅ Working |
| 🗺️ Google Maps heatmap with filters | ✅ Working |
| 📊 24h AQI prediction (ML heuristic) | ✅ Working |
| 🏛️ Municipal authority dashboard | ✅ Working |
| 🔔 Authority notifications | ✅ Working |
| 🌐 3-language support (EN/HI/KN) | ✅ Working |
| ♿ WCAG 2.1 AA accessibility | ✅ Working |
| 🔒 Anonymous reporting | ✅ Working |
| 📱 Offline draft saving | ✅ Working |
| 🌙 Dark mode | ✅ Working |
| 🔑 Firebase Auth (Google + Email) | ✅ Working |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CITIZEN / AUTHORITY                    │
│              React + Vite + TailwindCSS                  │
│         Google Maps Heatmap · Recharts · Zustand         │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼─────────────────────────────────────┐
│              FastAPI Backend (Python)                     │
│    /api/reports · /api/ai · /api/weather · /api/analytics│
└──┬─────────────────┬──────────────────────┬──────────────┘
   │                 │                      │
┌──▼──────┐  ┌──────▼──────┐    ┌──────────▼─────────┐
│Firebase │  │ Gemini 1.5  │    │ OpenWeatherMap API  │
│Firestore│  │ Vision + Pro│    │ Air Pollution API   │
│ Storage │  │ (AI Engine) │    │ (Weather + AQI)     │
│  Auth   │  └─────────────┘    └────────────────────┘
└─────────┘
```

---

## 📁 Project Structure

```
cleanair/
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── layout/      # Navbar, Footer
│   │   │   ├── map/         # Google Maps Heatmap
│   │   │   └── reports/     # Report cards
│   │   ├── pages/           # Route pages
│   │   ├── lib/             # Utils, API client, Firebase, i18n
│   │   ├── store/           # Zustand global state
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── backend/                 # FastAPI Python app
│   ├── main.py              # App entry point
│   ├── config.py            # Settings
│   ├── models/              # Pydantic schemas
│   ├── routers/             # API route handlers
│   └── services/            # Database, AI, Weather
│
├── .env.example             # Environment variable template
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/cleanair
cd cleanair
```

### 2. Frontend Setup

```bash
cd frontend
cp ../.env.example .env.local
# Edit .env.local with your API keys

npm install
npm run dev
# → http://localhost:5173
```

### 3. Backend Setup

```bash
cd backend
cp ../.env.example .env
# Edit .env with your API keys

pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → API docs: http://localhost:8000/api/docs
```

### 4. Run Without API Keys (Demo Mode)

The app works without any API keys in demo mode:
- ✅ All UI features work
- ✅ Mock AI analysis with realistic responses
- ✅ Synthetic weather/AQI data
- ✅ In-memory database (data resets on restart)
- ✅ Pre-loaded Bengaluru demo reports

---

## 🔑 API Keys Required

| Service | Used For | Get It |
|---------|----------|--------|
| **Google Maps** | Heatmap, satellite view, geocoding | [console.cloud.google.com](https://console.cloud.google.com) |
| **Gemini API** | Pollution image analysis, report generation | [ai.google.dev](https://ai.google.dev) |
| **OpenWeatherMap** | Live weather + AQI data | [openweathermap.org/api](https://openweathermap.org/api) |
| **Firebase** | Auth, Firestore, Storage | [console.firebase.google.com](https://console.firebase.google.com) |

---

## 🚢 Deployment

### Option A: Firebase Hosting + Cloud Run

```bash
# Build frontend
cd frontend && npm run build

# Deploy to Firebase Hosting
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy

# Deploy backend to Cloud Run
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT/cleanair-api
gcloud run deploy cleanair-api --image gcr.io/YOUR_PROJECT/cleanair-api --platform managed
```

### Option B: Firebase Hosting + Render

1. Push backend to GitHub
2. Create new Web Service on [render.com](https://render.com)
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard
6. Update `VITE_API_URL` to your Render URL

---

## 🤖 AI Features

### Gemini Vision Analysis
Upload any photo of pollution and get:
- Pollution type classification (7 categories)
- Confidence score
- Smoke/dust/fire detection
- Estimated AQI impact
- Health risk assessment
- Recommended municipal action

### AQI Prediction
24-hour forecast using:
- Current weather (temperature, wind, humidity)
- Traffic pattern heuristics
- Historical report density
- Atmospheric inversion detection
- Vertex AI-ready architecture

---

## 🌐 Accessibility

- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation (full tab support)
- ✅ Screen reader compatible (ARIA labels)
- ✅ High contrast mode
- ✅ Large text mode
- ✅ Voice input (Speech-to-Text)
- ✅ Reduced motion support
- ✅ English / Hindi / Kannada

---

## 📊 Database Schema (Firestore)

```
/users/{uid}
  - uid, email, displayName, role, ward, district, createdAt

/reports/{reportId}
  - id, userId, isAnonymous, location{lat,lng,address,ward,district}
  - pollutionType, severity, description
  - imageUrl, videoUrl, voiceUrl
  - aiAnalysis{type, confidence, aqi, health, ...}
  - status, assignedTo, resolvedAt, resolutionNote
  - upvotes, createdAt, updatedAt

/users/{uid}/notifications/{notifId}
  - type, title, message, reportId, read, createdAt
```

---

## 🏆 Judging Criteria Coverage

| Criteria | Weight | Implementation |
|----------|--------|----------------|
| Problem Solution Fit | 20% | Directly addresses hyper-local pollution gap for Indian cities |
| AI Technical Execution | 25% | Gemini Vision for image analysis, AQI ML prediction, authority report generation |
| Deployability & Scalability | 25% | Firebase Hosting + Cloud Run ready, Firestore scales to millions |
| Inclusivity & Accessibility | 15% | 3 languages, voice reporting, keyboard nav, anonymous mode, offline drafts |
| Impact Potential | 10% | BBMP/KSPCB integration ready, 42K+ citizens benefited in demo data |
| Presentation | 5% | Professional UI, live demo, comprehensive docs |

---

## 👥 Team

Built for **Hack2Skill CleanAir & Clear Streets Challenge**

---

## 📄 License

MIT License — see [LICENSE](LICENSE)
