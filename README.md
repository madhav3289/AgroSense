## AgroSense – Smart Agriculture Platform

AgroSense is a full‑stack web application that helps farmers make better decisions with **AI‑powered crop recommendations**, **soil restoration guidance** and **leaf disease detection**, wrapped in a secure, modern web experience.
The project is split into a **Flask API backend** with MongoDB and ML models, and a **frontend** built separately in Lovable against the API contract below.

---

## Project Structure

```text
AgroSense/
├─ backend/                # Flask API + ML models — the real backend, deploy this
│  ├─ app.py               # Main API entrypoint
│  ├─ *.pkl                # Trained model & scalers
│  ├─ *.csv                # Datasets / reference data
│  └─ requirements.txt     # Backend dependencies
├─ frontend-reference/     # Original React (Vite + Tailwind) frontend — kept for reference only, not deployed
├─ API_CONTRACT.md         # Full endpoint reference — hand this to Lovable so the new frontend matches the backend exactly
├─ LOVABLE_PROMPT.md       # Ready-to-paste prompt for building the new frontend in Lovable
└─ README.md               # Root project documentation
```

`frontend/` doesn't exist as a local folder — Lovable projects live on Lovable's platform. Once you paste the prompt in `LOVABLE_PROMPT.md` into a new Lovable project, that becomes your frontend; `frontend-reference/` is only there so you (or Claude) can look up how a screen or flow worked before, it isn't wired up to anything.

For backend detail, see `backend/README.md`. The old frontend's own README is at `frontend-reference/README.md`, describing how to run that copy locally if you ever want to.

---

## Features

- **User authentication**
  - JWT‑based login and registration (rate limited to 10 requests/minute per IP)
  - Protected routes in the frontend using auth context
  - Profile fetching and secure logout
- **AI crop recommendation**
  - Uses trained ML model (`model.pkl`) with preprocessing scalers
  - Inputs: N, P, K, temperature, humidity, pH, rainfall
  - Returns recommended crop plus a short growing tip for each of the 22 supported crops
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
- **Prediction history**
  - Successful crop recommendations, soil restoration lookups and disease detections are saved per user
  - Retrieve them with `GET /api/history`
- **Mandi (market) prices**
  - `GET /api/mandi-price?crop=<name>` looks up current prices from data.gov.in (Agmarknet)
  - Responds with "Price data unavailable" when no API key is configured
- **User profiles**
  - Username, email, phone, location and a short farm description

---

## Prerequisites

- **Python**: 3.10+ (for the backend)
- **MongoDB**: running locally or accessible via connection string
- A **Lovable** account, for building/hosting the new frontend (no local Node setup needed on your machine for that part)

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
FRONTEND_URL=http://localhost:5173

# Optional — leave blank to disable that feature
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
| `FRONTEND_URL` | yes in production | Allowed CORS origin(s); comma-separate to allow several — this must include your Lovable app's published URL |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | optional | Enables Pro upgrades and the free-scan limit. **Blank = payments off and disease detection is unlimited for everyone** |
| `DATA_GOV_IN_API_KEY` | optional | Enables live mandi prices. Blank = `/api/mandi-price` returns "Price data unavailable" |

Start MongoDB (local or cloud), then run the server:

```bash
python app.py
```

The API will be available at `http://localhost:5000`.

---

## Frontend (Lovable) – Setup

1. Open `LOVABLE_PROMPT.md` in this repo, copy the whole thing, and paste it as the first message in a new Lovable project.
2. Once Lovable finishes the first build, set the backend URL it should call — see the "Connecting to the backend" section of `LOVABLE_PROMPT.md` for exactly where that goes.
3. Set `FRONTEND_URL` on the backend to your Lovable app's preview/published URL, so CORS allows it.

`API_CONTRACT.md` is the source of truth for every request/response shape; `LOVABLE_PROMPT.md` already embeds the parts Lovable needs, but keep `API_CONTRACT.md` handy if you ask Lovable to add anything later.

If you'd rather run the **original** React frontend instead of (or while) building the Lovable one, see `frontend-reference/README.md` — it still works standalone against this same backend.

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
  - `GET /api/profile` – user profile (username, email, phone, location, about)
  - `PUT /api/profile` – update profile fields

See `API_CONTRACT.md` for full request/response shapes, headers, and error cases, or `backend/app.py` for the implementation itself.

---

## Development Notes

- Environment‑specific secrets (`SECRET_KEY`, `JWT_SECRET_KEY`, `MONGO_URI`, `GEMINI_API_KEY`, Razorpay and data.gov.in keys) are **not** committed; use a local `.env` file (see `backend/.env.example`).
- Large or generated assets (`node_modules`, virtualenvs) are ignored via `.gitignore`.
- Deploying: the backend runs with `gunicorn app:app` from the `backend/` directory (e.g. Render or Railway), with `MONGO_URI` pointing at MongoDB Atlas and `FRONTEND_URL` set to your Lovable app's URL. The rate limiter is in-memory, so keep a single gunicorn worker (the default) for the 10/minute limit to be exact.
- When changing model files (`model.pkl`, scalers, CSVs), restart the Flask server so they are reloaded.

---

## License / Usage

This project is currently for educational / internal use.
Add a formal license file if you plan to open‑source or distribute it.
