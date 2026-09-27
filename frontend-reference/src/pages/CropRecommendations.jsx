import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import bg from "/bg.jpg";

const CropRecommendation = () => {
  const { user } = useAuth();
  const [inputs, setInputs] = useState({
    N: "",
    P: "",
    K: "",
    temperature: "",
    humidity: "",
    ph: "",
    rainfall: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const container = document.querySelector(".bubble-container");
    if (!container) return;

    container.querySelectorAll(".bubble").forEach((b) => b.remove());

    for (let i = 0; i < 20; i++) {
      const bubble = document.createElement("span");
      bubble.classList.add("bubble");
      bubble.style.left = Math.random() * 100 + "vw";
      bubble.style.animationDuration = 3 + Math.random() * 5 + "s";
      const size = 10 + Math.random() * 30;
      bubble.style.width = size + "px";
      bubble.style.height = size + "px";
      container.appendChild(bubble);
    }

    return () => {
      container?.querySelectorAll(".bubble").forEach((b) => b.remove());
    };
  }, []);

  const handleReset = () => {
    setInputs({
      N: "",
      P: "",
      K: "",
      temperature: "",
      humidity: "",
      ph: "",
      rainfall: "",
    });
    setResult(null);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (val.length > 1 && val[0] === "0" && val[1] !== ".") {
      val = val.replace(/^0+/, "");
    }

    if (
      val === "" ||
      (!isNaN(val) &&
        ((["N", "P", "K", "temperature", "humidity", "rainfall"].includes(name) &&
          Number(val) >= 1) ||
          (name === "ph" && Number(val) >= 0 && Number(val) <= 14)))
    ) {
      setInputs({ ...inputs, [name]: val });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const payload = {
      N: Number(inputs.N),
      P: Number(inputs.P),
      K: Number(inputs.K),
      temperature: Number(inputs.temperature),
      humidity: Number(inputs.humidity),
      ph: Number(inputs.ph),
      rainfall: Number(inputs.rainfall),
    };

    for (const key in payload) {
      if (
        isNaN(payload[key]) ||
        inputs[key] === "" ||
        (["N", "P", "K", "temperature", "humidity", "rainfall"].includes(key) &&
          payload[key] <= 0) ||
        (key === "ph" && (payload[key] < 0 || payload[key] > 14))
      ) {
        setError(
          key === "ph"
            ? "⚠️ Please enter a valid soil pH between 0 and 14."
            : `⚠️ ${key.toUpperCase()} must be a positive number.`
        );
        return;
      }
    }

    try {
      const response = await axios.post("/api/predict", payload);
      setResult(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to fetch. Is the backend running?";
      setError(`❌ ${errorMessage}`);
      console.error("Prediction error:", err);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative bubble-container"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <div className="absolute inset-0 bg-green-900/30 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4">
        <div className={`grid gap-6 ${result ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-green-800 mb-4 md:mb-6 flex items-center gap-2">
              🌱 Smart Crop Recommendation
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              Welcome,{" "}
              <span className="font-semibold text-lime-400">
                {user?.username}
              </span>
              ! Enter your soil and climate data to get personalized recommendations.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["N", "P", "K", "temperature", "humidity", "ph", "rainfall"].map(
                  (field) => (
                    <input
                      key={field}
                      name={field}
                      type="number"
                      placeholder={
                        field === "N"
                          ? "Nitrogen (N)"
                          : field === "P"
                          ? "Phosphorus (P)"
                          : field === "K"
                          ? "Potassium (K)"
                          : field === "temperature"
                          ? "Temperature (°C)"
                          : field === "humidity"
                          ? "Humidity (%)"
                          : field === "ph"
                          ? "Soil pH"
                          : "Rainfall (mm)"
                      }
                      value={inputs[field]}
                      onChange={handleChange}
                      min={field === "ph" ? 0 : 1}
                      max={field === "ph" ? 14 : undefined}
                      step="any"
                      required
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
                    />
                  )
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex justify-center items-center gap-2"
              >
                🔍 Analyse
              </button>
            </form>

            {/* 🔴 Error */}
            {error && (
              <div className="mt-4 text-red-700 bg-red-100 p-3 rounded-lg text-center">
                <div className="mb-4">❌ {error}</div>
                <button
                  onClick={handleReset}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex justify-center items-center gap-2"
                >
                  ⬅️ Try Again
                </button>
              </div>
            )}
          </div>

          {/* Result Card (appears side-by-side on md+) */}
          {result && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8 self-start">
              <h2 className="text-xl font-semibold text-green-800">
                ✅ Recommended Crop: <span className="font-bold text-green-600">{result.crop}</span>
              </h2>
              <p className="mt-2 text-gray-700">{result.tip}</p>
              <button
                className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                onClick={handleReset}
              >
                ⬅️ Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;
