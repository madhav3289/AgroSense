# AgroSense Server

This folder contains the server-side components of the AgroSense application.

## Structure

- `app.py` - Flask API server for crop recommendation
- `Crop Recommendation Using ML.ipynb` - Jupyter notebook for ML model development
- `Crop_recommendation.csv` - Dataset for training the ML model
- `model.pkl` - Trained ML model
- `minmaxscaler.pkl` - MinMax scaler for data preprocessing
- `standscaler.pkl` - Standard scaler for data preprocessing

**Note:** This is a pure API server - no static files are served. The React frontend handles all UI assets.

## Setup

1. Install MongoDB:
   - Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)

2. Start MongoDB service:
   ```bash
   # Windows (if installed as service)
   net start MongoDB
   
   # macOS/Linux
   mongod
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (copy `.env.example` to `.env` and edit it):
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

5. Run the Flask application:
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/logout` - User logout (protected)

### Crop Recommendation
- `POST /api/predict` - Crop recommendation prediction (protected)

### Soil Restoration
- `POST /api/soil-restoration` - Rotation suggestions for the last harvested crop (JWT optional; saved to history when sent)

### Disease Detection
- `POST /api/disease-detection` - Leaf image analysis via Gemini, called server-side (protected). Multipart form, field `image`, max 10 MB. Returns `402` `{"error": "free_limit_reached", "uses_remaining": 0}` when a free account has used its 3 scans (only when Razorpay is configured)

### Payments (Razorpay — disabled unless both keys are set)
- `POST /api/create-order` - Create a Pro order (protected)
- `POST /api/verify-payment` - Verify the payment signature and activate Pro for 30 days (protected)

### History
- `GET /api/history` - The current user's past predictions, newest first (protected)

### Market Prices
- `GET /api/mandi-price?crop=<name>` - Current mandi price from data.gov.in (protected)

### Profile
- `GET /api/profile` - Get profile (protected)
- `PUT /api/profile` - Update username, email, phone, location, about (protected)

