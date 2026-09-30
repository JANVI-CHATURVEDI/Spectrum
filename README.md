# SwachDrishti — Clean Vision for Smarter Cities

> Turn citizen waste reports into prioritized, actionable sanitation operations.

**Flow:** `Report → Verify → Prioritize → Assign → Resolve → Citizen Verify → Analyze → Prevent`

## What it is

Full-stack civic-tech platform: citizens report garbage with GPS + photo, AI triages and scores it, supervisors dispatch workers from a live map, workers resolve with photo proof, citizens verify, admins steer the city with insights and forecasts.

## Features

**Citizen (`/citizen`)**
- GPS map-pin reports with photo upload, address auto-fill (geolocation + Nominatim)
- AI auto-categorization + severity suggestion before submit
- Duplicate warning within 100m
- Bulk / e-waste / garden / construction pickup booking with slots
- Confirm-or-reopen cleanup verification with reason + feedback, earns impact points

**Worker (`/worker`)**
- Live dispatch queue (8s polling toggle)
- Priority-weighted route optimizer with numbered markers + polyline
- Start-cleaning → upload after-photo → submit resolution flow
- AI cleanup score (0–100) + verdict on completion

**Supervisor (`/supervisor`)**
- Pending dispatch queue + click-on-map targeting
- One-click worker assignment modal
- AI before/after verification review (photo grid + score + verdict)
- Crew workload roster + live team summary

**Admin (`/admin`)**
- City KPIs (resolved, recurring spots, avg turnaround)
- Natural-language semantic search over reports
- AI executive insights (summary + 3 actions + city stats, cached 15 min)
- Ward Cleanliness Index (score/100, grade, resolution rate)
- 48-hour overflow forecasts per zone (risk score + recommendation)

**Public + Education (no login)**
- `/public` — anonymized map, city stats, recently-cleared ledger with resident-verified ticks
- `/awareness` — Green/Blue/Red segregation guides, "where does it go?" lookup, Civic Waste IQ quiz (streaks, explanations, results), drop-off locator with fill levels + Maps directions

**AI (Gemini 2.5 Flash + heuristic fallback, works without a key)**
Text/vision triage, Hindi→English translation, hazard flags, before/after cleanup audit, semantic search, exec insights, overflow forecasting.

**Priority engine** — `severity + density + age + recurrence + sensitive-area` → CRITICAL / HIGH / MEDIUM / LOW with "Why this priority?" explanation on every report.

**Hotspots** — auto-clusters ≥3 nearby reports into zones (OCCASIONAL/FREQUENT/CHRONIC) with intervention recommendations; dual forecast paths (open-report clustering + persisted-hotspot prediction).

## Tech stack

- **Backend:** Django 5 + DRF (token auth), WhiteNoise, Gunicorn — `backend/`
- **DB / files:** Neon Postgres (`DATABASE_URL`) / SQLite fallback; Neon Object Storage (S3) / local `media/`
- **Frontend:** React 18 + Vite + Tailwind + React-Leaflet + Axios — `frontend/`
- **Maps:** OpenStreetMap + custom markers · **Comms:** SMTP + Twilio (optional)

## Run locally

```bash
# Backend
cd backend
py -m pip install -r requirements.txt
py manage.py migrate
py manage.py seed_demo_data
py manage.py runserver 8000   # → http://127.0.0.1:8000/api/

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # → http://localhost:3000
```

Or on Windows: `start.bat` / `start.ps1` launches both.

**Env:** copy `backend/.env.example → backend/.env` (`DATABASE_URL`, `GEMINI_API_KEY` optional) and `frontend/.env.example → frontend/.env` (`VITE_API_URL=http://localhost:8000`).

## Demo logins

Seeded by `seed_demo_data` — or use the **Demo** switcher in the navbar (no password needed):

| Role | Username | Password | Route |
|------|----------|----------|-------|
| Admin | `admin` | `admin123` | `/admin` |
| Supervisor | `supervisor` | `supervisor123` | `/supervisor` |
| Worker | `worker` | `worker123` | `/worker` |
| Citizen | `citizen` | `citizen123` | `/citizen` |

## Deploy

- **Frontend → Vercel:** root `frontend/`, build `npm run build` → `dist/`, set `VITE_API_URL` to API URL
- **Backend → Render:** root `backend/`, uses `Procfile` + `render.yaml` (install → migrate → seed → gunicorn, Python 3.13)
- **DB → Neon:** paste pooled Postgres URL into `DATABASE_URL` (`?sslmode=require`)

```bash
cd backend
py manage.py test core   # contract + unit tests
```

## API (base `/api/`)

`auth/` (register, login, demo-login, me, workers) · `reports/` (CRUD, categories, check-duplicate, verify) · `incidents/` (clusters, evidence/submit) · `hotspots/` (CRUD, detect, predictions) · `pickups/` (CRUD) · `operations/` (tasks, assign, tasks/:id/transition, team-summary) · `analytics/` (overview, cleanliness-index, charts, public/transparency) · `awareness/` (streams/guides, quiz + quiz/:id/check, points, collection-points, qr/:code) · `ai/` (classify, search, insights, verify-cleanup, forecast)

## License

MIT — free for civic bodies, researchers, and contributors.
