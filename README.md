# FarmCast

> AI-powered agri-weather intelligence for Kenyan smallholder farmers.

FarmCast combines real-time weather forecasting, AI-generated crop advice, and computer vision tree canopy analysis into a single platform built for East African agriculture. Farmers save their farm locations, get 7-day forecasts with crop-specific planting risk assessments powered by Groq AI, and upload aerial images to analyse tree canopy health — all from a mobile-friendly progressive web app.

---

## Live Demo

| Frontend | API Backend |
|----------|-------------|
| [farmcast-africa.vercel.app](https://farmcast-africa.vercel.app) | [farmcast-api.fly.dev](https://farmcast-api.fly.dev) |

> **Note:** The backend runs on Fly.io free tier. First request after inactivity may take a few seconds to wake.

---

## Screenshots

Below are demo screenshots (placeholders). 

![Dashboard weather](/assets/screenshots/thumbs/Dashboard-weather.png "Dashboard weather")


_Dashboard — 7-day forecast with planting risk badge_

![Tree analysis](/assets/screenshots/thumbs/Tree-analysis.png "Tree analysis")


_Tree analysis — original image with annotated overlay and AI observations_

![Login](/assets/screenshots/thumbs/login.png "Login")


_Login screen — Google sign-in_

---

## What FarmCast Does

### Weather Intelligence Tab

The Weather tab gives farmers a complete picture of upcoming conditions for their specific farm location:

- **7-day forecast cards** showing temperature range, rainfall probability, and wind speed for each day, using real weather condition icons from the WeatherAI CDN
- **Planting Risk Badge** — a scored assessment (0–100) of whether current conditions are suitable for planting. The score weighs rainfall probability (40%), temperature variance (35%), and wind speed (25%) across the forecast window. Labels are Low, Moderate, or High risk
- **AI Crop Advice** — when a farm has a crop type assigned, Groq AI (Llama 3.1) generates 2-3 sentences of practical advice specific to that exact crop, location, and forecast. Works for any crop — maize, arrowroots, tea, coffee, bananas, cassava, traditional vegetables, and anything else a farmer might grow
- **Auto-location detection** — on first load, the dashboard auto-detects your location via IP geolocation and shows local weather before any farm is selected
- **Saved Farms** — farms are persisted to Firestore per user. Click any saved farm to instantly load its weather

**How to use the Weather tab:**
1. Sign in with Google
2. Your current location weather loads automatically
3. Click "Add farm" in the sidebar, enter a farm name, latitude, longitude, and crop type
4. Click the saved farm to load its weather
5. The planting risk badge and crop-specific AI advice update automatically

### Tree Analysis Tab

The Trees tab uses computer vision and AI to analyse tree canopy health from aerial imagery:

- **Upload any aerial image** — drone photos, satellite screenshots, or Google Earth exports
- **Automated tree detection** — OpenCV counts individual tree crowns and measures canopy coverage percentage
- **Health breakdown** — trees are classified into three categories: Healthy, Needs Care, and Needs Replacement, with percentage bars
- **Species detection** — Gemini AI attempts to identify the tree species from the image
- **Side-by-side comparison** — the original image alongside an annotated overlay with detected trees circled
- **Density calculation** — if you provide the plot acreage, trees-per-acre is calculated automatically
- **Agronomic recommendations** — AI-generated observations and actionable recommendations based on what the analysis found
- **Quota tracking** — the quota widget shows remaining analyses (5/month on free plan). Analyses are saved to Firestore so past results can be reloaded without spending quota

**How to use the Tree Analysis tab:**
1. Go to Trees tab
2. Check remaining quota in the quota widget
3. Upload an aerial image (JPEG/PNG/WEBP, max 20MB)
   - Use Google Earth or cropped Google Maps satellite screenshots
   - Image must show tree canopy from directly above
   - Individual tree crowns must be visible as distinct shapes
   - Remove all map UI chrome, labels, and scale bars before uploading
4. Fill in optional fields: Farmer ID, County, Land Acres, Location, Notes
   - More context = more specific AI recommendations
5. Click "Analyze Trees"
6. Results appear with tree count, confidence score, health breakdown, and overlay image
7. Use "Load last analysis" to reload a saved result without spending quota

**Best image sources for demo:**
- Karura Forest, Nairobi: `-1.2375, 36.8305`
- Limuru tea plantations: `-1.1167, 36.6333`
- Thika coffee farms: `-1.0333, 37.0833`

---

## Architecture

```mermaid
flowchart TD
    subgraph Client ["React Client (Vercel)"]
        A[Dashboard] --> B[useWeather Hook]
        A --> C[useWeatherGeo Hook]
        A --> D[useTreeAnalysis Hook]
        A --> E[useFarms Hook]
        A --> F[useQuota Hook]
        G[Firebase Auth] --> H[Google Sign-in]
    end

    subgraph Server ["Express Server (Fly.io)"]
        I["/api/weather"] --> J[calculatePlantingRisk]
        I --> K[getCropAdvice]
        L["/api/weather/geo"] --> J
        M["/api/trees/analyze"] --> N[multer upload]
        O["/api/farms"] --> P[Firebase Admin]
        Q[verifyToken middleware] --> P
    end

    subgraph External ["External Services"]
        R[WeatherAI API v1]
        S[Groq AI Llama 3.1]
        T[Firebase Auth]
        U[Cloud Firestore]
    end

    subgraph CLI ["Python CLI"]
        V[weather_fetch.py]
    end

    B -->|Bearer token| I
    C -->|Bearer token| L
    D -->|Bearer token + image| M
    E -->|Bearer token| O
    F -->|Bearer token| I

    I -->|lat/lon/days| R
    L -->|ip=auto| R
    M -->|multipart image| R
    K -->|crop + weather context| S
    Q -->|verifyIdToken| T
    P -->|read/write| U

    V -->|direct call| R
```
---

## Project Structure

```
farmcast/
├── client/                          # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── AISummary.tsx        # AI summary / upgrade notice card
│   │   │   ├── ErrorBoundary.tsx    # Crash protection wrapper
│   │   │   ├── ForecastGrid.tsx     # 7-day horizontal scroll cards
│   │   │   ├── ImageUploader.tsx    # Drag-drop image upload with preview
│   │   │   ├── LocationSearch.tsx   # Farm list + add farm form in sidebar
│   │   │   ├── PlantingRiskBadge.tsx # Scored risk badge with AI reason
│   │   │   ├── ProtectedRoute.tsx   # Auth guard for dashboard route
│   │   │   ├── QuotaWidget.tsx      # API + tree analysis quota bars
│   │   │   ├── TreeAnalysis.tsx     # Full analysis result display
│   │   │   └── WeatherCard.tsx      # Single day forecast card
│   │   ├── hooks/
│   │   │   ├── useFarms.ts          # CRUD for saved farm locations
│   │   │   ├── useQuota.ts          # Fetches API + tree quota stats
│   │   │   ├── useTreeAnalysis.ts   # Tree analysis + history recovery
│   │   │   ├── useWeather.ts        # Farm-specific weather fetch
│   │   │   └── useWeatherGeo.ts     # IP-based auto-detect weather
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance with Firebase token interceptor
│   │   │   └── firebase.ts          # Firebase app + auth + Firestore init
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Main app page with sidebar + tabs
│   │   │   └── Login.tsx            # Google sign-in page
│   │   └── types/
│   │       └── index.ts             # All shared TypeScript interfaces
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                          # Node.js + TypeScript + Express
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts             # Validated env config (fails fast on missing vars)
│   │   ├── lib/
│   │   │   ├── firebase-admin.ts    # Firebase Admin SDK init
│   │   │   └── weatherai.ts         # WeatherAI axios client + all typed interfaces
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Firebase token verification middleware
│   │   │   ├── errorHandler.ts      # Global Express error handler
│   │   │   ├── upload.ts            # Multer memory storage, 20MB, images only
│   │   │   └── validate.ts          # Zod schema validation middleware factory
│   │   ├── routes/
│   │   │   ├── farms.ts             # GET/POST/DELETE farm locations (Firestore)
│   │   │   ├── trees.ts             # POST analyze, GET history, GET quota
│   │   │   └── weather.ts           # GET weather, GET geo, GET usage
│   │   ├── types/
│   │   │   └── express.d.ts         # Express Request augmentation for req.user
│   │   ├── utils/
│   │   │   ├── cropAdvice.ts        # Groq AI crop-specific advice generator
│   │   │   └── plantingRisk.ts      # Deterministic planting risk score calculator
│   │   └── index.ts                 # Express app setup + middleware stack
│   ├── .env.example
│   ├── fly.toml                     # Fly.io deployment configuration
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                         # Python CLI
│   ├── weather_fetch.py             # Standalone weather fetch with formatted output
│   ├── requirements.txt             # requests, python-dotenv
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript + Vite | Single page application |
| Styling | Tailwind CSS | Dark-theme utility-first CSS |
| Backend | Node.js + TypeScript + Express | API proxy and business logic |
| Authentication | Firebase Authentication | Google OAuth sign-in |
| Database | Cloud Firestore | Farm locations and analysis history |
| Weather Data | WeatherAI API v1 | Real-time forecasts + tree CV analysis |
| Crop AI | Groq API — Llama 3.1 8B | Dynamic crop-specific planting advice |
| Input Validation | Zod | Runtime schema validation on all routes |
| Security | Helmet + express-rate-limit + CORS | HTTP hardening |
| File Handling | Multer | In-memory multipart image processing |
| Backend Deploy | Fly.io | Containerised Node.js hosting |
| Frontend Deploy | Vercel | Static site hosting with edge CDN |
| Python CLI | Python 3.12 + requests | Standalone weather fetch script |

---

## How Groq AI Works in FarmCast

Groq runs the `llama-3.1-8b-instant` model to generate crop-specific planting advice. It is called server-side in `server/src/utils/cropAdvice.ts` whenever a weather request includes a `cropType` parameter.

The prompt sends:
- Farm coordinates and country
- Risk level and score
- Average rainfall probability, temperature range, wind speed
- 3-day daily breakdown with exact figures
- The farmer's crop type

Groq returns 2-3 sentences of practical advice tailored to that exact crop in those exact conditions. Because this is a language model rather than a lookup table, it handles any crop — arrowroots, kunde, muthokoi, indigenous vegetables, exotic fruits — without any hardcoded dictionary.

The call falls back to the generic risk reason if Groq is unavailable or the API key is not configured, so the weather feature always works even without AI crop advice.

---

## Security

| Measure | Implementation |
|---------|---------------|
| API key isolation | `WEATHERAI_API_KEY` and `GROQ_API_KEY` live only in `server/.env`. Never sent to the client. |
| Auth on all writes | Every route that reads or writes user data requires a valid Firebase ID token via `verifyToken` middleware |
| HTTP hardening | `helmet()` sets secure headers on all responses |
| Rate limiting | `express-rate-limit` — 100 requests per 15 minutes per IP |
| CORS whitelist | Only origins in `ALLOWED_ORIGINS` env var are permitted |
| Input validation | All route inputs validated with Zod before any processing |
| File validation | Multer rejects non-image MIME types and files over 20MB |
| No logging of secrets | Error handler logs only `error.message`, never request bodies or tokens |
| Firestore rules | Row-level security ensures users can only read/write their own farm and analysis data |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Firebase project with Google Auth enabled
- WeatherAI API key (`wai_...` from weather-ai.co/dashboard)
- Groq API key (`gsk_...` from console.groq.com — free)

### 1. Clone

```bash
git clone https://github.com/souuja-ops/farmcast.git
cd farmcast
```

### 2. Server Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env and fill in all values
```

### 3. Client Setup

```bash
cd ../client
npm install
cp .env.example .env
# Edit .env and fill in Firebase config values
```

### 4. Run Locally

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Python CLI

```bash
cd scripts
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add WEATHERAI_API_KEY
python weather_fetch.py --lat -1.2921 --lon 36.8219 --crop maize
```

**CLI flags:**

| Flag | Description |
|------|-------------|
| `--lat` | Latitude (required) |
| `--lon` | Longitude (required) |
| `--days` | Forecast days 1-7 (default 7) |
| `--crop` | Crop type label for output |
| `--lang` | Language code (default en) |
| `--no-ai` | Skip AI summary to save quota |

---

## Environment Variables

### server/.env

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `WEATHERAI_API_KEY` | WeatherAI key (wai_ prefix) | `wai_abc123...` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173,https://farmcast.vercel.app` |
| `FIREBASE_PROJECT_ID` | From service account JSON | `farmcast-prod` |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | From service account JSON (quoted) | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `GROQ_API_KEY` | Groq API key (gsk_ prefix) | `gsk_abc123...` |

### client/.env

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (`http://localhost:4000` locally, Fly.io URL in production) |
| `VITE_FIREBASE_API_KEY` | From Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | From Firebase web app config |
| `VITE_FIREBASE_PROJECT_ID` | From Firebase web app config |
| `VITE_FIREBASE_APP_ID` | From Firebase web app config |

---

## API Reference

### Weather Routes (no auth required)

| Method | Route | Query Params | Description |
|--------|-------|-------------|-------------|
| `GET` | `/api/health` | — | Server health check |
| `GET` | `/api/weather` | `lat`, `lon`, `days`, `lang`, `cropType` | 7-day forecast + planting risk + Groq crop advice |
| `GET` | `/api/weather/geo` | — | IP-detected location weather |

### Weather Routes (auth required)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/weather/usage` | WeatherAI API quota stats + tree quota |

### Tree Routes (auth required)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/trees/analyze` | Upload image for tree canopy analysis |
| `GET` | `/api/trees/history` | Paginated past analyses for current user |
| `GET` | `/api/trees/quota` | Remaining tree analyses this month |

### Farm Routes (auth required)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/farms` | List all saved farms for current user |
| `POST` | `/api/farms` | Save a new farm location |
| `DELETE` | `/api/farms/:id` | Delete a saved farm |

---

## Deployment

### Backend — Fly.io

Fly.io runs the Node.js server in a container with zero cold start issues unlike serverless platforms.

#### First-time deploy

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# From the server/ directory
cd server

# Launch app (run once — creates fly.toml)
fly launch --name farmcast-api --region jnb --no-deploy

# Set environment variables
fly secrets set PORT=4000
fly secrets set WEATHERAI_API_KEY=wai_your_key_here
fly secrets set ALLOWED_ORIGINS=https://farmcast.vercel.app
fly secrets set FIREBASE_PROJECT_ID=your-project-id
fly secrets set FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
fly secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your key here...
-----END PRIVATE KEY-----"
fly secrets set GROQ_API_KEY=gsk_your_key_here

# Deploy
fly deploy
```

#### fly.toml (add to server/ directory)

```toml
app = "farmcast-api"
primary_region = "jnb"

[build]

[env]
  PORT = "4000"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

#### Re-deploy after changes

```bash
cd server && fly deploy
```

#### View logs

```bash
fly logs --app farmcast-api
```

### Frontend — Vercel

```bash
# Install Vercel CLI (optional — can also use Vercel dashboard)
npm i -g vercel

# From client/ directory
cd client && vercel

# Set environment variables in Vercel dashboard:
# VITE_API_URL = https://farmcast-api.fly.dev
# VITE_FIREBASE_API_KEY = ...
# VITE_FIREBASE_AUTH_DOMAIN = ...
# VITE_FIREBASE_PROJECT_ID = ...
# VITE_FIREBASE_APP_ID = ...
```

After deploying frontend, add the Vercel URL to Firebase:
- Firebase Console → Authentication → Settings → Authorized Domains → Add domain

Also update `ALLOWED_ORIGINS` in Fly.io secrets:
```bash
fly secrets set ALLOWED_ORIGINS=https://farmcast.vercel.app
fly deploy
```

---

## Firebase Setup

### Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /farms/{userId}/locations/{locationId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /analyses/{analysisId} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.uid;
      allow write: if false;
    }
  }
}
```

---

## Known Limitations

| Limitation | Detail |
|-----------|--------|
| WeatherAI free plan | 1,000 requests/month, 5 tree analyses/month, 7-day forecast max |
| AI summaries disabled | WeatherAI AI summaries (`x-ai-applied: false`) require a paid plan. Groq handles crop advice instead |
| Geo detection | IP geolocation returns country code only — city/region headers are not available on the free plan |
| Tree analysis image requirements | Requires aerial/satellite imagery with visible tree crowns from directly above. Ground-level photos return 0 trees |
| Groq rate limits | Free tier: 14,400 requests/day, 30 requests/minute. Crop advice falls back to generic message if rate limited |

---

## Acknowledgements

- [WeatherAI](https://weather-ai.co) — weather data and tree canopy analysis API
- [Groq](https://groq.com) — fast inference for crop advice generation
- [Firebase](https://firebase.google.com) — authentication and database
- [Fly.io](https://fly.io) — backend hosting
- [Vercel](https://vercel.com) — frontend hosting
