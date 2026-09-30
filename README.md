# SwachDrishti — Clean Vision for Smarter Cities

> **SwachDrishti turns citizen waste reports into location-aware, prioritized, actionable sanitation operations.**

Built for high-impact civic technology and modern municipal operations.

---

## 🌟 The Core SwachDrishti Loop

```
REPORT ➔ VERIFY ➔ PRIORITIZE ➔ ASSIGN ➔ RESOLVE ➔ CITIZEN VERIFICATION ➔ ANALYZE ➔ PREVENT RECURRENCE
```

1. **Smart Waste Reporting**: Pinpoint map locator, AI-assisted auto-categorization & severity suggestion, automated duplicate heap warnings within 100m.
2. **Explainable Priority Engine**: Dynamic scoring combining density, age, sensitive context, and recurring hotspot status with factor breakdown.
3. **Hotspot AI & Recurrence Mitigation**: Clusters repeated dumpings into persistent operational zones with concrete municipal intervention policies.
4. **Role-Based Command & Dispatch**:
   - **Citizen**: Submit incidents, book bulk/e-waste pickups, verify cleanup resolutions, earn civic impact points.
   - **Sanitation Worker**: Real-time field route dispatch queue, start cleaning jobs, log resolution evidence.
   - **Supervisor**: Ward team capacity balancer, unassigned queue dispatcher, worker workload roster.
   - **Administrator**: Municipal Command Center, AI policy insight generation, natural-language semantic query engine, Area Cleanliness Index (ACI) scoring.
5. **Open Civic Transparency**: Publicly accessible ledger of resolved heaps, turnaround metrics, and ward rankings.
6. **Civic Waste Education**: Segregation standards (Green / Blue / Red bins), interactive civic IQ quiz, and recycling depot locator.

---

## 🛠 Tech Stack

- **Backend**: Python, Django 5.x / 6.x, Django REST Framework, WhiteNoise, python-dotenv, CORS Headers
- **Database**: PostgreSQL (Neon production-ready) / SQLite local fallback
- **Frontend**: React 18, Vite, Tailwind CSS, React-Leaflet, Lucide Icons, Axios, React Router 6
- **Maps**: Leaflet with OpenStreetMap tiles & custom SVG markers
- **AI Service**: Google Gemini API integration with intelligent heuristic fallback

---

## 🚀 Quickstart & Local Setup

### 1. Backend Setup
```bash
cd backend

# Install dependencies
py -m pip install -r requirements.txt

# Run migrations
py manage.py migrate

# Seed rich demo dataset (Delhi civic wards, hotspots, reports, roster)
py manage.py seed_demo_data

# Run unit tests
py manage.py test core

# Start Django development server
py manage.py runserver 8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` to explore SwachDrishti. Use the **Role Persona Switcher** in the top navigation bar to seamlessly demo **Citizen**, **Worker**, **Supervisor**, or **Administrator** roles!

---

## 🌐 Production Deployment

- **Frontend**: Deployable to **Vercel** (`npm run build` -> `dist/`)
- **Backend**: Ready for **Render / Railway / Heroku** via included `Procfile` and `render.yaml`
- **Database**: Connects directly via `DATABASE_URL` to **Neon PostgreSQL**
