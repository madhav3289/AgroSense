# app.py (paste whole file, replaces your previous one)
import os
import json
import hmac
import hashlib
import time
import traceback
import warnings
import numpy as np
import pickle
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity,
    verify_jwt_in_request
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.exceptions import HTTPException
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import pandas as pd
import difflib
import re

# ===============================
# CONFIGURATION & INITIALIZATION
# ===============================

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
warnings.filterwarnings("ignore", category=FutureWarning, module="sklearn")

load_dotenv()

app = Flask(__name__, static_folder=None)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB cap (leaf photos for /api/disease-detection)

# Render / Railway put a reverse proxy in front of the app, so without this every
# request appears to come from the proxy's IP and the rate limiter below would
# treat all users as one client. Trust exactly one proxy hop for X-Forwarded-For.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

bcrypt = Bcrypt(app)
jwt = JWTManager(app)


def env(name):
    """Read an env var; unset and blank are treated the same."""
    return (os.environ.get(name) or "").strip()


# Allowed browser origins. FRONTEND_URL may be a single origin or a comma-separated list
# (e.g. production + a Vercel preview URL). Trailing slashes are stripped because
# browsers send origins without them.
FRONTEND_URL = env("FRONTEND_URL") or "http://localhost:5173"
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in FRONTEND_URL.split(",") if o.strip()]
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

# Simple in-memory rate limiter (per client IP). Fine for a single-process deployment;
# each gunicorn worker keeps its own counters.
limiter = Limiter(key_func=get_remote_address, app=app, storage_uri="memory://")
AUTH_RATE_LIMIT = "10 per minute"


@app.errorhandler(429)
def handle_rate_limit(e):
    return jsonify({"error": "Too many attempts. Please wait a minute and try again."}), 429


@app.errorhandler(413)
def handle_payload_too_large(e):
    return jsonify({"error": "File too large. Maximum size is 10 MB."}), 413

# ===============================
# PLAN / FEATURE CONSTANTS
# ===============================

FREE_DISEASE_SCANS = 3          # free disease-detection scans before the paywall (when Razorpay is configured)
PRO_PRICE_PAISE = 9900          # ₹99 in paise (placeholder plan)
PRO_CURRENCY = "INR"
PRO_DURATION_DAYS = 30
GEMINI_MODEL = "gemini-3.5-flash-lite"
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# ===============================
# DATABASE CONNECTION
# ===============================

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "agrosense")

try:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    client.admin.command("ping")
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    db = None

users_collection = db.users if db is not None else None
predictions_collection = db.predictions if db is not None else None
orders_collection = db.orders if db is not None else None

if db is not None:
    try:
        predictions_collection.create_index([("user_id", 1), ("created_at", -1)])
        orders_collection.create_index("order_id", unique=True)
    except Exception as e:
        print(f"⚠️ Could not create indexes: {e}")

# ===============================
# MODEL LOADING
# ===============================

def load_pickle_file(filename):
    abs_path = os.path.abspath(filename)
    if not os.path.exists(abs_path):
        print(f"❌ File not found: {abs_path}")
        return None
    try:
        with open(abs_path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        print(f"❌ Error loading {abs_path}: {e}")
        return None

model = load_pickle_file("model.pkl")
mx = load_pickle_file("minmaxscaler.pkl")
sc = load_pickle_file("standscaler.pkl")

crop_dict = {
    'rice': 1, 'maize': 2, 'chickpea': 3, 'kidneybeans': 4, 'pigeonpeas': 5,
    'mothbeans': 6, 'mungbean': 7, 'blackgram': 8, 'lentil': 9, 'pomegranate': 10,
    'banana': 11, 'mango': 12, 'grapes': 13, 'watermelon': 14, 'muskmelon': 15,
    'apple': 16, 'orange': 17, 'papaya': 18, 'coconut': 19, 'cotton': 20,
    'jute': 21, 'coffee': 22
}
inv_crop_dict = {v: k for k, v in crop_dict.items()}

tips = {
    "rice": "🌾 Needs heavy rainfall & humid conditions.",
    "maize": "🌽 Grows best in warm weather with well-drained soil and moderate rainfall.",
    "chickpea": "🫘 Thrives in cool, dry conditions; avoid waterlogged soil.",
    "kidneybeans": "🫘 Prefers mild temperatures and well-drained loamy soil; protect from frost.",
    "pigeonpeas": "🌱 Drought-tolerant legume that does well in warm weather and well-drained soil.",
    "mothbeans": "🌱 Very hardy in hot, arid regions; suits sandy soil with little rainfall.",
    "mungbean": "🌱 Quick-maturing crop that likes warm weather and light, well-drained soil.",
    "blackgram": "🌱 Grows well in warm, humid weather on loamy soil with good drainage.",
    "lentil": "🌱 A cool-season crop that prefers well-drained loamy soil and modest rainfall.",
    "pomegranate": "🌳 Loves hot, dry summers; needs well-drained soil and careful watering at fruiting.",
    "banana": "🍌 Needs warm, humid weather, rich soil and steady moisture.",
    "mango": "🥭 Prefers a warm climate with a dry spell before flowering and deep, well-drained soil.",
    "grapes": "🍇 Needs warm, dry weather and well-drained soil; prune regularly for a better yield.",
    "watermelon": "🍉 Loves hot weather and sandy loam; water regularly until the fruits set.",
    "muskmelon": "🍈 Grows best in warm, dry weather on sandy loam; ease off watering as fruits ripen.",
    "apple": "🍎 Needs a cool climate with chilling winters and well-drained loamy soil.",
    "orange": "🍊 Suits subtropical climates; needs well-drained soil and regular watering.",
    "papaya": "🌱 Needs warm weather, frost protection and well-drained soil; avoid waterlogging.",
    "coconut": "🥥 Thrives in hot, humid coastal conditions with plenty of rainfall and sandy soil.",
    "cotton": "🌿 Needs a long, warm, sunny season with moderate rainfall; black soil works well.",
    "jute": "🌿 Requires warm, humid weather with heavy rainfall and fertile alluvial soil.",
    "coffee": "☕ Prefers shaded, humid highland areas with well-drained, slightly acidic soil.",
}

# ===============================
# SHARED HELPERS (plans, history)
# ===============================

def payments_enabled():
    """Paywall is only active when both Razorpay keys are configured."""
    return bool(env("RAZORPAY_KEY_ID") and env("RAZORPAY_KEY_SECRET"))


def iso_utc(dt):
    """Naive UTC datetime -> ISO-8601 string with a 'Z' suffix (so browsers don't read it as local time)."""
    return dt.isoformat() + "Z" if dt else None


def is_user_pro(user):
    """Pro status honouring the expiry date. is_pro with no expiry is treated as non-expiring."""
    if not user.get("is_pro", False):
        return False
    expires = user.get("pro_expires_at")
    return expires is None or expires > datetime.utcnow()


def plan_fields(user):
    """Plan info added to the user object returned by login/register/auth-profile."""
    pro = is_user_pro(user)
    return {
        "is_pro": pro,
        "pro_expires_at": iso_utc(user.get("pro_expires_at")) if pro else None,
        "disease_detection_uses": int(user.get("disease_detection_uses", 0)),
    }


def get_optional_user_id():
    """User id from a valid JWT if one was sent, else None. Never raises."""
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None


def _json_safe(value):
    """Recursively replace NaN/inf with None so stored history always serialises to valid JSON."""
    if isinstance(value, float) and (value != value or value in (float("inf"), float("-inf"))):
        return None
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    return value


def log_prediction(user_id, pred_type, input_data, result_data):
    """Record a successful prediction for /api/history. Never lets a logging failure break the request."""
    if predictions_collection is None or not user_id:
        return
    try:
        predictions_collection.insert_one({
            "user_id": str(user_id),
            "type": pred_type,
            "input": _json_safe(input_data),
            "result": _json_safe(result_data),
            "created_at": datetime.utcnow(),
        })
    except Exception as e:
        print(f"⚠️ Could not record history entry: {e}")

# ===============================
# SOIL RESTORATION MODEL (CSV-BASED)
# ===============================

SOIL_CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'india_crop_rotation_200_plus.csv'))
soil_df = None
if os.path.exists(SOIL_CSV_PATH):
    try:
        soil_df = pd.read_csv(SOIL_CSV_PATH)
        # Normalize whitespace, lowercase columns for consistent querying
        soil_df.columns = [c.strip().lower().replace(' ', '_').replace(')', '') for c in soil_df.columns]
    except Exception as e:
        print(f"❌ Error loading soil restoration CSV: {e}")
else:
    print(f"❌ Soil CSV not found at {SOIL_CSV_PATH}")


def normalize_crop_string(s):
    # Remove non-alphanumeric except spaces, lowercase, and collapse whitespace
    return re.sub(r'[^a-zA-Z0-9 ]', '', s or '').strip().lower()

def get_crop_soil_recommendations(last_crop):
    if soil_df is None:
        return []
    norm_input = normalize_crop_string(last_crop)
    crop_names = soil_df['harvested'].astype(str).tolist()
    norm_crop_names = [normalize_crop_string(c) for c in crop_names]

    # Exact or substring match
    matches_idx = [i for i, name in enumerate(norm_crop_names) if norm_input in name or name in norm_input]

    # If nothing, fuzzy match for top 3 closest
    if not matches_idx:
        close_matches = difflib.get_close_matches(norm_input, norm_crop_names, n=3, cutoff=0.6)
        matches_idx = [i for i, name in enumerate(norm_crop_names) if name in close_matches]

    # Return matches as records
    return soil_df.iloc[matches_idx].to_dict(orient='records') if matches_idx else []


@app.route("/api/soil-restoration", methods=["POST"])
def soil_restoration_endpoint():
    try:
        data = request.get_json() or {}
        last_crop = data.get("last_crop", "").strip()
        if not last_crop:
            return jsonify({"error": "Missing last_crop in request."}), 400
        results = get_crop_soil_recommendations(last_crop)
        if not results:
            return jsonify({"recommendations": [], "message": "No suitable rotation found for the given crop."})
        # Endpoint stays open to anonymous callers as before; history is only recorded
        # when a valid JWT accompanies the request. Stored copy is capped to keep history small.
        log_prediction(
            get_optional_user_id(),
            "soil_restoration",
            {"last_crop": last_crop},
            {"recommendations": results[:5], "total_matches": len(results)},
        )
        return jsonify({"recommendations": results})
    except Exception as e:
        print("❌ Exception in /api/soil-restoration:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ===============================
# ROUTES: Auth, Predict (unchanged)
# ===============================

@app.before_request
def log_request_info():
    print(f"Request: {request.method} {request.path}")

@app.route("/api/auth/register", methods=["POST"])
@limiter.limit(AUTH_RATE_LIMIT)
def register():
    try:
        if users_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
        data = request.get_json()
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Username, email, and password are required"}), 400
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters long"}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        if '@' not in email:
            return jsonify({"error": "Invalid email format"}), 400
        if users_collection.find_one({"username": username}):
            return jsonify({"error": "Username already exists"}), 400
        if users_collection.find_one({"email": email}):
            return jsonify({"error": "Email already registered"}), 400
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user_data = {
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        result = users_collection.insert_one(user_data)
        user_id = str(result.inserted_id)
        access_token = create_access_token(identity=user_id)
        return jsonify({
            "message": "User registered successfully",
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "created_at": user_data["created_at"].isoformat(),
                "is_active": True,
                **plan_fields(user_data)
            }
        }), 201
    except Exception as e:
        print(f"❌ Registration error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Registration failed"}), 500

@app.route("/api/auth/login", methods=["POST"])
@limiter.limit(AUTH_RATE_LIMIT)
def login():
    try:
        if users_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
        data = request.get_json()
        if not data or not (data.get('username') or data.get('email')) or not data.get('password'):
            return jsonify({"error": "Username/email and password are required"}), 400

        # accept either username or email from frontend:
        identifier = data.get('username') if data.get('username') else data.get('email')
        identifier = identifier.strip().lower()
        password = data['password']

        user = users_collection.find_one({
            "$or": [
                {"username": identifier},
                {"email": identifier}
            ]
        })

        if not user or not bcrypt.check_password_hash(user['password_hash'], password):
            return jsonify({"error": "Invalid credentials"}), 401
        if not user.get('is_active', True):
            return jsonify({"error": "Account is deactivated"}), 401

        user_id = str(user['_id'])
        access_token = create_access_token(identity=user_id)

        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": user_id,
                "username": user['username'],
                "email": user['email'],
                "created_at": user['created_at'].isoformat(),
                "is_active": user.get('is_active', True),
                **plan_fields(user)
            }
        }), 200
    except Exception as e:
        print(f"❌ Login error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Login failed"}), 500

@app.route("/api/auth/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        if users_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
        user_id = get_jwt_identity()
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "user": {
                "id": str(user['_id']),
                "username": user['username'],
                "email": user['email'],
                "created_at": user['created_at'].isoformat(),
                "is_active": user.get('is_active', True),
                **plan_fields(user)
            }
        }), 200
    except Exception as e:
        print(f"❌ Profile error: {e}")
        return jsonify({"error": "Failed to get profile"}), 500

@app.route("/api/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200

@app.route("/api/predict", methods=["POST"])
@jwt_required()
def api_predict():
    try:
        if not model or not mx or not sc:
            return jsonify({"error": "❌ Model or scaler files not loaded. Check server logs for missing files."}), 500
        data = request.get_json()
        print("Received data:", data)
        N = float(data.get("N", 0))
        P = float(data.get("P", 0))
        K = float(data.get("K", 0))
        temperature = float(data.get("temperature", 0))
        humidity = float(data.get("humidity", 0))
        ph = float(data.get("ph", 0))
        rainfall = float(data.get("rainfall", 0))

        errors = []
        if N < 0 or P < 0 or K < 0:
            errors.append("❌ N, P, K cannot be negative.")
        if N < 5 and P < 5 and K < 5:
            errors.append("❌ Soil nutrients (N, P, K) too low for any crop.")
        if rainfall < 20 or rainfall > 400:
            errors.append("❌ Rainfall not suitable (20–400 mm).")
        if not (10 <= temperature <= 45):
            errors.append("❌ Temperature not suitable (10–45°C).")
        if not (14 <= humidity <= 95):
            errors.append("❌ Humidity not suitable (14–95%).")
        if not (4.5 <= ph <= 9.0):
            errors.append("❌ Soil pH not suitable (4.5–9.0).")
        if errors:
            return jsonify({"error": errors}), 400

        features = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
        features = mx.transform(features)
        features = sc.transform(features)

        pred = model.predict(features)[0]
        crop_name = inv_crop_dict.get(pred, "Unknown")
        tip = tips.get(crop_name, "No tip available.")
        user_id = get_jwt_identity()
        user = users_collection.find_one({"_id": ObjectId(user_id)}) if users_collection is not None else None
        print(f"Prediction made by user: {user['username'] if user else 'Unknown'}")
        log_prediction(
            user_id,
            "crop_recommendation",
            {"N": N, "P": P, "K": K, "temperature": temperature,
             "humidity": humidity, "ph": ph, "rainfall": rainfall},
            {"crop": crop_name, "tip": tip},
        )
        return jsonify({"crop": crop_name, "tip": tip})
    except Exception as e:
        print("❌ Exception in /api/predict:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "AgroSense API is running"}), 200

# ===============================
# PROFILE
# ===============================

@app.route("/api/profile", methods=["GET", "PUT"])
@jwt_required()
def user_profile():
    try:
        if users_collection is None:
            return jsonify({"error": "Database connection not available"}), 500

        user_id = get_jwt_identity()
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404

        if request.method == "GET":
            # Basic + extended profile fields
            prof = {
                "id": str(user["_id"]),
                "username": user.get("username", ""),
                "email": user.get("email", ""),
                "created_at": user.get("created_at").isoformat()
                if user.get("created_at")
                else "",
                "is_active": user.get("is_active", True),
                "phone": user.get("phone", ""),
                "location": user.get("location", ""),
                "about": user.get("about", ""),
            }
            return jsonify({"user": prof}), 200

        # PUT: update profile fields
        data = request.get_json() or {}

        new_username = (data.get("username") or "").strip()
        new_email = (data.get("email") or "").strip().lower()

        update_doc = {}

        # Username / email validation & uniqueness
        if new_username:
            if len(new_username) < 3:
                return jsonify({"error": "Username must be at least 3 characters long"}), 400
            if new_username != user.get("username") and users_collection.find_one(
                {"username": new_username}
            ):
                return jsonify({"error": "Username already exists"}), 400
            update_doc["username"] = new_username

        if new_email:
            if "@" not in new_email:
                return jsonify({"error": "Invalid email format"}), 400
            if new_email != user.get("email") and users_collection.find_one(
                {"email": new_email}
            ):
                return jsonify({"error": "Email already registered"}), 400
            update_doc["email"] = new_email

        # Optional extended fields
        if "phone" in data:
            phone = (data.get("phone") or "").strip()
            update_doc["phone"] = phone

        if "location" in data:
            location = (data.get("location") or "").strip()
            update_doc["location"] = location

        if "about" in data:
            about = (data.get("about") or "").strip()
            update_doc["about"] = about

        if not update_doc:
            return jsonify({"message": "No changes to update"}), 200

        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_doc})

        # Return updated profile snapshot
        updated = users_collection.find_one({"_id": ObjectId(user_id)})
        prof = {
            "id": str(updated["_id"]),
            "username": updated.get("username", ""),
            "email": updated.get("email", ""),
            "created_at": updated.get("created_at").isoformat()
            if updated.get("created_at")
            else "",
            "is_active": updated.get("is_active", True),
            "phone": updated.get("phone", ""),
            "location": updated.get("location", ""),
            "about": updated.get("about", ""),
        }
        return jsonify({"message": "Profile updated", "user": prof}), 200
    except Exception as e:
        print(f"❌ Profile error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to get/update profile"}), 500

# ===============================
# DISEASE DETECTION (Gemini, server-side)
# ===============================
# Request: multipart/form-data with a single file field named "image".
# Response: { plant_name, disease_name, severity, solution }

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}

DISEASE_PROMPT = (
    'You are an agricultural leaf disease expert. Analyze the uploaded leaf image and answer in JSON '
    'with keys: plant_name, disease_name, severity, solution. If the leaf looks healthy, set '
    'disease_name to "Healthy" and provide preventive steps.'
)


class AnalysisError(Exception):
    """Raised when the Gemini call or its response can't be used."""


def _strip_code_fences(text):
    text = (text or "").strip()
    m = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.S | re.I)
    return m.group(1).strip() if m else text


def _as_text(value, default):
    if isinstance(value, list):
        value = "\n".join(str(v) for v in value)
    value = "" if value is None else str(value).strip()
    return value or default


def analyze_leaf_with_gemini(image_bytes, mime_type):
    import base64
    body = {
        "contents": [{
            "parts": [
                {"text": DISEASE_PROMPT},
                {"inline_data": {"mime_type": mime_type,
                                 "data": base64.b64encode(image_bytes).decode("ascii")}},
            ]
        }],
        "generationConfig": {"responseMimeType": "application/json"},
    }
    try:
        # Key goes in a header (not the URL) so it can never end up in logs or exception text.
        resp = requests.post(
            GEMINI_ENDPOINT,
            headers={"Content-Type": "application/json", "x-goog-api-key": env("GEMINI_API_KEY")},
            json=body,
            timeout=60,
        )
    except requests.RequestException as e:
        raise AnalysisError(f"Gemini request failed: {type(e).__name__}")
    if resp.status_code != 200:
        raise AnalysisError(f"Gemini returned HTTP {resp.status_code}")
    try:
        parts = resp.json()["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts)
        parsed = json.loads(_strip_code_fences(text))
        if isinstance(parsed, list) and parsed:
            parsed = parsed[0]
        if not isinstance(parsed, dict):
            raise ValueError("not an object")
    except Exception:
        raise AnalysisError("Could not parse Gemini response")
    return {
        "plant_name": _as_text(parsed.get("plant_name"), "Unknown plant"),
        "disease_name": _as_text(parsed.get("disease_name"), "Unknown"),
        "severity": _as_text(parsed.get("severity"), "Unknown"),
        "solution": _as_text(parsed.get("solution"), "No solution provided."),
    }


@app.route("/api/disease-detection", methods=["POST"])
@jwt_required()
def api_disease_detection():
    try:
        if users_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
        if not env("GEMINI_API_KEY"):
            return jsonify({"error": "Disease detection is not configured on the server."}), 503

        file = request.files.get("image")
        if file is None:
            return jsonify({"error": "No image uploaded. Send it as multipart form field 'image'."}), 400
        mime_type = (file.mimetype or "").lower()
        if mime_type not in ALLOWED_IMAGE_TYPES:
            return jsonify({"error": "Unsupported image type. Please upload a JPG, PNG or WEBP image."}), 400
        image_bytes = file.read()
        if not image_bytes:
            return jsonify({"error": "The uploaded image is empty."}), 400

        user_id = get_jwt_identity()
        oid = ObjectId(user_id)
        user = users_collection.find_one({"_id": oid})
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Usage gate: only active when Razorpay is configured, and never for Pro users.
        # The scan is reserved atomically *before* calling Gemini so parallel requests can't
        # slip past the limit, and refunded below if the analysis fails.
        gated = payments_enabled() and not is_user_pro(user)
        if gated:
            reserved = users_collection.find_one_and_update(
                {"_id": oid, "$or": [
                    {"disease_detection_uses": {"$lt": FREE_DISEASE_SCANS}},
                    {"disease_detection_uses": {"$exists": False}},
                ]},
                {"$inc": {"disease_detection_uses": 1}},
            )
            if reserved is None:
                return jsonify({"error": "free_limit_reached", "uses_remaining": 0}), 402

        try:
            result = analyze_leaf_with_gemini(image_bytes, mime_type)
        except Exception as e:
            if gated:
                users_collection.update_one({"_id": oid}, {"$inc": {"disease_detection_uses": -1}})
            print(f"❌ Disease detection failed: {e}")
            return jsonify({"error": "Could not analyze the image. Please try again with a clearer photo."}), 502

        if not gated:
            users_collection.update_one({"_id": oid}, {"$inc": {"disease_detection_uses": 1}})

        # The image itself is deliberately not stored (no storage cost); only its type and size.
        log_prediction(
            user_id,
            "disease_detection",
            {"mime_type": mime_type, "size_bytes": len(image_bytes)},
            result,
        )
        return jsonify(result)
    except HTTPException:
        raise  # e.g. 413 from MAX_CONTENT_LENGTH: let Flask's handler return it, not a generic 500
    except Exception as e:
        print("❌ Exception in /api/disease-detection:", e)
        traceback.print_exc()
        return jsonify({"error": "Disease detection failed"}), 500

# ===============================
# PAYMENTS (Razorpay) — inert unless RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set
# ===============================

RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"


@app.route("/api/create-order", methods=["POST"])
@jwt_required()
def api_create_order():
    try:
        if not payments_enabled():
            return jsonify({"error": "Payments are not enabled"}), 503
        if orders_collection is None:
            return jsonify({"error": "Database connection not available"}), 500

        user_id = get_jwt_identity()
        key_id, key_secret = env("RAZORPAY_KEY_ID"), env("RAZORPAY_KEY_SECRET")
        try:
            resp = requests.post(
                RAZORPAY_ORDERS_URL,
                auth=(key_id, key_secret),
                json={
                    "amount": PRO_PRICE_PAISE,
                    "currency": PRO_CURRENCY,
                    "receipt": f"gg_{str(user_id)[-8:]}_{int(time.time())}",  # Razorpay caps receipt at 40 chars
                    "notes": {"user_id": str(user_id), "plan": "pro_monthly"},
                },
                timeout=15,
            )
        except requests.RequestException as e:
            print(f"❌ Razorpay order request failed: {type(e).__name__}")
            return jsonify({"error": "Could not reach the payment provider"}), 502
        if resp.status_code not in (200, 201):
            print(f"❌ Razorpay order creation returned HTTP {resp.status_code}")
            return jsonify({"error": "Could not create payment order"}), 502

        order_id = resp.json()["id"]
        orders_collection.insert_one({
            "order_id": order_id,
            "user_id": str(user_id),
            "amount": PRO_PRICE_PAISE,
            "currency": PRO_CURRENCY,
            "status": "created",
            "created_at": datetime.utcnow(),
        })
        return jsonify({
            "order_id": order_id,
            "amount": PRO_PRICE_PAISE,
            "currency": PRO_CURRENCY,
            "key_id": key_id,
        })
    except Exception as e:
        print("❌ Exception in /api/create-order:", e)
        traceback.print_exc()
        return jsonify({"error": "Could not create payment order"}), 500


@app.route("/api/verify-payment", methods=["POST"])
@jwt_required()
def api_verify_payment():
    try:
        if not payments_enabled():
            return jsonify({"success": False, "error": "Payments are not enabled"}), 503
        if users_collection is None or orders_collection is None:
            return jsonify({"success": False, "error": "Database connection not available"}), 500

        data = request.get_json(silent=True) or {}
        order_id = str(data.get("razorpay_order_id") or "")
        payment_id = str(data.get("razorpay_payment_id") or "")
        signature = str(data.get("razorpay_signature") or "")
        if not (order_id and payment_id and signature):
            return jsonify({"success": False, "error": "Missing payment details"}), 400

        user_id = str(get_jwt_identity())
        order = orders_collection.find_one({"order_id": order_id, "user_id": user_id})
        if not order:
            return jsonify({"success": False, "error": "Unknown order"}), 400

        # Already processed: repeat calls with the same payment are harmless (double-click / retry).
        if order.get("status") == "paid":
            if order.get("payment_id") == payment_id:
                return jsonify({"success": True, "is_pro": True})
            return jsonify({"success": False, "error": "Order already processed"}), 400

        # Never trust the frontend's success callback alone: recompute Razorpay's HMAC-SHA256
        # signature over "order_id|payment_id" with our secret and compare in constant time.
        expected = hmac.new(
            env("RAZORPAY_KEY_SECRET").encode("utf-8"),
            f"{order_id}|{payment_id}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return jsonify({"success": False, "error": "Payment verification failed"}), 400

        # Atomically claim the order so it can only ever grant Pro once.
        claimed = orders_collection.find_one_and_update(
            {"order_id": order_id, "user_id": user_id, "status": "created"},
            {"$set": {"status": "paid", "payment_id": payment_id, "paid_at": datetime.utcnow()}},
        )
        if claimed is None:
            return jsonify({"success": False, "error": "Order already processed"}), 400

        user = users_collection.find_one({"_id": ObjectId(user_id)})
        now = datetime.utcnow()
        # Renewing while still Pro extends from the current expiry instead of losing paid days.
        base = user["pro_expires_at"] if user and is_user_pro(user) and user.get("pro_expires_at") else now
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_pro": True, "pro_expires_at": base + timedelta(days=PRO_DURATION_DAYS)}},
        )
        return jsonify({"success": True, "is_pro": True})
    except Exception as e:
        print("❌ Exception in /api/verify-payment:", e)
        traceback.print_exc()
        return jsonify({"success": False, "error": "Payment verification failed"}), 500

# ===============================
# HISTORY
# ===============================

@app.route("/api/history", methods=["GET"])
@jwt_required()
def api_history():
    try:
        if predictions_collection is None:
            return jsonify({"error": "Database connection not available"}), 500
        try:
            limit = min(max(int(request.args.get("limit", 100)), 1), 200)
        except ValueError:
            limit = 100
        cursor = (
            predictions_collection
            .find({"user_id": str(get_jwt_identity())}, {"_id": 0})
            .sort([("created_at", -1), ("_id", -1)])
            .limit(limit)
        )
        items = [
            {
                "type": doc.get("type"),
                "input": doc.get("input", {}),
                "result": doc.get("result", {}),
                "created_at": iso_utc(doc.get("created_at")),
            }
            for doc in cursor
        ]
        return jsonify({"items": items})
    except Exception as e:
        print("❌ Exception in /api/history:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to load history"}), 500

# ===============================
# MANDI PRICES (data.gov.in / Agmarknet) — returns "unavailable" unless DATA_GOV_IN_API_KEY is set
# ===============================

MANDI_RESOURCE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# The 22 model crops -> Agmarknet commodity names, tried in order until one returns data.
# Agmarknet's naming is inconsistent (e.g. "Paddy(Dhan)(Common)"), so a few crops have fallbacks.
MANDI_COMMODITY_NAMES = {
    "rice": ["Rice", "Paddy(Dhan)(Common)"],
    "maize": ["Maize"],
    "chickpea": ["Bengal Gram(Gram)(Whole)"],
    "kidneybeans": ["Rajma"],
    "pigeonpeas": ["Arhar (Tur/Red Gram)(Whole)", "Arhar(Tur/Red Gram)(Whole)"],
    "mothbeans": ["Moath Dal", "Moth Beans"],
    "mungbean": ["Green Gram (Moong)(Whole)"],
    "blackgram": ["Black Gram (Urd Beans)(Whole)"],
    "lentil": ["Lentil (Masur)(Whole)"],
    "pomegranate": ["Pomegranate"],
    "banana": ["Banana"],
    "mango": ["Mango"],
    "grapes": ["Grapes"],
    "watermelon": ["Water Melon"],
    "muskmelon": ["Musk Melon"],
    "apple": ["Apple"],
    "orange": ["Orange"],
    "papaya": ["Papaya"],
    "coconut": ["Coconut"],
    "cotton": ["Cotton"],
    "jute": ["Jute"],
    "coffee": ["Coffee"],
}

_mandi_cache = {}  # crop -> (expires_at_epoch, payload)
MANDI_CACHE_OK_SECONDS = 6 * 60 * 60   # prices are published daily
MANDI_CACHE_MISS_SECONDS = 5 * 60      # don't hammer the API when it is failing / has no data


def _mandi_unavailable(crop):
    return {"crop": crop, "price": None, "message": "Price data unavailable"}


def _to_price(value):
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _fetch_mandi_records(commodity):
    try:
        resp = requests.get(
            MANDI_RESOURCE_URL,
            params={"api-key": env("DATA_GOV_IN_API_KEY"), "format": "json",
                    "limit": 100, "filters[commodity]": commodity},
            timeout=10,
        )
        if resp.status_code != 200:
            print(f"⚠️ data.gov.in returned HTTP {resp.status_code}")
            return []
        return resp.json().get("records") or []
    except (requests.RequestException, ValueError) as e:
        # Only the exception type is logged: the request URL contains the API key.
        print(f"⚠️ data.gov.in request failed: {type(e).__name__}")
        return []


def _pick_representative(records):
    """Median modal price among the most recent day's reports, plus the market it came from."""
    dated = []
    for r in records:
        price = _to_price(r.get("modal_price"))
        if price is None or price <= 0:
            continue
        try:
            when = datetime.strptime(str(r.get("arrival_date", "")).strip(), "%d/%m/%Y")
        except ValueError:
            when = datetime.min
        dated.append((when, price, r))
    if not dated:
        return None
    latest = max(d[0] for d in dated)
    todays = sorted((d for d in dated if d[0] == latest), key=lambda d: d[1])
    return todays[len(todays) // 2]


@app.route("/api/mandi-price", methods=["GET"])
@jwt_required()
def api_mandi_price():
    crop = (request.args.get("crop") or "").strip().lower()
    if not crop:
        return jsonify({"error": "Missing 'crop' query parameter"}), 400
    if not env("DATA_GOV_IN_API_KEY"):
        return jsonify(_mandi_unavailable(crop))

    cached = _mandi_cache.get(crop)
    if cached and cached[0] > time.time():
        return jsonify(cached[1])

    payload = _mandi_unavailable(crop)
    ttl = MANDI_CACHE_MISS_SECONDS
    try:
        for commodity in MANDI_COMMODITY_NAMES.get(crop, [crop.title()]):
            picked = _pick_representative(_fetch_mandi_records(commodity))
            if picked:
                record = picked[2]
                payload = {
                    "crop": crop,
                    "price": int(round(picked[1])),
                    "unit": "₹/quintal",
                    "market": record.get("market", ""),
                    "state": record.get("state", ""),
                }
                ttl = MANDI_CACHE_OK_SECONDS
                break
    except Exception as e:
        print(f"⚠️ Mandi lookup failed: {type(e).__name__}")
    _mandi_cache[crop] = (time.time() + ttl, payload)
    return jsonify(payload)

# ===============================
# MAIN ENTRY
# ===============================

if __name__ == "__main__":
    print("🚀 Flask running at http://localhost:5000")
    app.run(debug=False, host="0.0.0.0", port=5000, threaded=True)
