## AgroSense – Smart Agriculture Platform

AgroSense is a full‑stack web application that helps farmers make better decisions with **AI‑powered crop recommendations**, **soil restoration guidance** and **leaf disease detection**, wrapped in a secure, modern web experience.

This repository contains both the **Flask API backend** (MongoDB + ML models) and the **frontend** web app.

---

## Project Structure

```text
AgroSense/
├─ backend/                # Flask API + ML models
│  ├─ app.py               # Main API entrypoint
│  ├─ *.pkl                # Trained model & scalers
│  ├─ *.csv                # Datasets / reference data
│  ├─ requirements.txt     # Backend dependencies
│  └─ README.md            # Backend-specific setup notes
├─ frontend/                # React (TanStack Start) + Tailwind CSS + shadcn/ui web app
│  ├─ src/
│  │  ├─ routes/           # Pages (home, login, register, crop recommendation,
│  │  │                    #   soil restoration, disease detection, history, profile)
│  │  ├─ components/       # Navbar, Footer, UpgradeModal, ProBadge, UI primitives, etc.
│  │  └─ lib/               # API client, auth context, shared helpers
│  ├─ package.json
│  └─ README.md            # Frontend-specific setup notes
└─ README.md                # This file — root project documentation
```

For backend detail, see `backend/README.md`. For frontend detail, see `frontend/README.md`.

---

## Features

- **User authentication**
  - JWT‑based login and registration (rate limited to 10 requests/minute per IP)
  - Protected routes on the frontend using an auth context
  - Profile fetching and secure logout
- **AI crop recommendation**
  - Uses a trained ML model (`model.pkl`) with preprocessing scalers
  - Inputs: N, P, K, temperature, humidity, pH, rainfall
  - Returns a recommended crop plus a short growing tip for each of the 22 supported crops
- **Soil restoration guidance**
  - `/api/soil-restoration` endpoint powered by CSV data
  - Suggests rotation and restoration options based on last harvested crop
- **Disease detection**
  - Upload a leaf photo and get the plant, disease, severity and suggested remedies
  - Powered by Google Gemini, called **server-side** via `POST /api/disease-detection` (the API key never reaches the browser)
  - Free accounts get 3 scans; Pro removes the limit (only enforced once Razorpay keys are configured)
- **Pro plan payments (Razorpay)**
  - `POST /api/create-order` and `POST /api/verify-payment` (signature verified on the server)
  - Pro lasts 30 days; feature-flagged off when Razorpay keys are not set
  - The frontend's upgrade flow can be opened from the free-scan limit, the Profile page, or the Navbar's plan badge
- **Prediction history**
  - Successful crop recommendations, soil restoration lookups and disease detections are saved per user
  - Retrieve them with `GET /api/history`
- **Mandi (market) prices**
  - `GET /api/mandi-price?crop=<name>` looks up current prices from data.gov.in (Agmarknet)
  - Responds with "Price data unavailable" when no API key is configured
- **User profiles**
  - Username, email, phone, location and a short farm description
  - Shows Pro/Free plan status and remaining free disease scans

---

## Prerequisites

- **Python**: 3.10+ (backend)
- **Node.js**: 20+ and npm (frontend)
- **MongoDB**: running locally or accessible via connection string

---

## Backend (Flask API) – Setup & Run

From the project root:

```bash
cd backend

# (Optional but recommended) create & activate a virtual env
python -m venv myvenv
myvenv\Scripts\activate      # Windows PowerShell / CMD

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```bash
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=jwt-super-secret-key-change-in-production
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=agrosense
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:8080
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
DATA_GOV_IN_API_KEY=
```

A ready-to-copy template with comments is in `backend/.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SECRET_KEY`, `JWT_SECRET_KEY` | yes | Flask / JWT signing secrets — always set your own in production |
| `MONGO_URI`, `MONGO_DB_NAME` | yes | MongoDB connection (local or Atlas) |
| `GEMINI_API_KEY` | for disease detection | Used server-side only; the key never reaches the browser |
| `FRONTEND_URL` | yes in production | Allowed CORS origin(s); comma-separate to allow several (e.g. a local dev URL and your deployed frontend URL) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | optional | Enables Pro upgrades and the free-scan limit. **Blank = payments off and disease detection is unlimited for everyone** |
| `DATA_GOV_IN_API_KEY` | optional | Enables live mandi prices. Blank = `/api/mandi-price` returns "Price data unavailable" |

Start MongoDB (local or cloud), then run the server:

```bash
python app.py
```

The API will be available at `http://localhost:5000`.

---

## Frontend – Setup & Run

From the project root:

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` in `frontend/` and set:

```bash
VITE_API_URL=http://localhost:5000
```

(use your deployed backend URL instead once the backend is hosted, e.g. a Render/Railway URL).

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

Other useful scripts (run from `frontend/`):

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint the codebase |
| `npm run format` | Format with Prettier |

---

## Key API Endpoints (Summary)

- **Auth**
  - `POST /api/auth/register` – create new user
  - `POST /api/auth/login` – obtain JWT access token
  - `GET /api/auth/profile` – fetch current user (JWT required)
  - `POST /api/auth/logout` – logical logout (JWT required)
- **Crop recommendation**
  - `POST /api/predict` – get recommended crop and tip (JWT required)
- **Soil restoration**
  - `POST /api/soil-restoration` – recommendations based on last crop (a JWT is optional; when sent, the lookup is saved to history)
- **Disease detection**
  - `POST /api/disease-detection` – multipart form with an `image` field (JPG/PNG/WEBP, max 10 MB); returns `{ plant_name, disease_name, severity, solution }` (JWT required). Returns HTTP `402` `{ "error": "free_limit_reached", "uses_remaining": 0 }` when a free account is out of scans
- **Payments**
  - `POST /api/create-order` – create a ₹99 Razorpay order; returns `{ order_id, amount, currency, key_id }` (JWT required)
  - `POST /api/verify-payment` – verify Razorpay's signature and activate Pro; returns `{ success, is_pro }` (JWT required)
- **History**
  - `GET /api/history` – `{ items: [{ type, input, result, created_at }] }`, newest first, current user only (JWT required). `created_at` is an ISO‑8601 UTC string. Shapes by `type`:
    - `crop_recommendation` – input `{ N, P, K, temperature, humidity, ph, rainfall }`, result `{ crop, tip }`
    - `soil_restoration` – input `{ last_crop }`, result `{ recommendations: [...up to 5], total_matches }`
    - `disease_detection` – input `{ mime_type, size_bytes }` (the image itself is not stored), result `{ plant_name, disease_name, severity, solution }`
- **Market prices**
  - `GET /api/mandi-price?crop=<name>` – `{ crop, price, unit, market, state }`, or `{ crop, price: null, message }` when unavailable (JWT required)
- **Profile**
  - `GET /api/profile` – user profile (username, email, phone, location, about, plan status)
  - `PUT /api/profile` – update profile fields

See `backend/app.py` for the full implementation.

---

## Deployment

- **Backend**: deploy `backend/` to Render, Railway, or similar, running `gunicorn app:app`. Point `MONGO_URI` at a MongoDB Atlas cluster, and set `FRONTEND_URL` to your deployed frontend's URL(s). The rate limiter is in-memory, so keep a single gunicorn worker (the default) for the 10/minute limit to be exact.
- **Frontend**: deploy `frontend/` to Vercel (or another Node-compatible host). Set the `VITE_API_URL` environment variable to your deployed backend's URL. If deploying to Vercel specifically, also set `NITRO_PRESET=vercel` so the build targets Vercel's serverless runtime correctly.
- After deploying both, double check `FRONTEND_URL` on the backend includes the frontend's live URL, or API requests from the deployed frontend will fail with CORS errors.

---

## Development Notes

- Environment‑specific secrets (`SECRET_KEY`, `JWT_SECRET_KEY`, `MONGO_URI`, `GEMINI_API_KEY`, Razorpay and data.gov.in keys, `VITE_API_URL`) are **not** committed; use local `.env` files in `backend/` and `frontend/` (see each folder's `.env.example`).
- Large or generated assets (`node_modules`, virtualenvs, build output) are ignored via `.gitignore`.
- When changing model files (`model.pkl`, scalers, CSVs), restart the Flask server so they are reloaded.

---

## License / Usage

This project is currently for educational / internal use.
Add a formal license file if you plan to open‑source or distribute it.