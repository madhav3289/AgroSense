import { useState } from "react";
import { FaSeedling, FaLeaf, FaHandsHelping } from "react-icons/fa";
import bg from "/bg.jpg";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SoilRestoration() {
  const [lastCrop, setLastCrop] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch(`${API_URL}/api/soil-restoration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Lets the server record this lookup in the user's history (endpoint still works without it).
          ...(localStorage.getItem("access_token")
            ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
            : {}),
        },
        body: JSON.stringify({ last_crop: lastCrop })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Unknown error");
      setResults(data.recommendations || []);
    } catch (err) {
      setError(err.message || "Could not fetch suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative bubble-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* ✅ Background overlay: consistent cool green tint like other tools */}
      <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm"></div>

      {/* Floating soil / nutrient bubbles, warmer tone and different sizing */}
      {[...Array(18)].map((_, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: `${(i * 5 + 15) % 100}vw`,
            animationDuration: `${3 + (i % 7)}s`,
            width: `${10 + (i % 7) * 3}px`,
            height: `${10 + (i % 7) * 3}px`,
            background: "rgba(254, 249, 195, 0.55)", // soft yellow
          }}
        />
      ))}

      {/* ✅ Content */}
      <div className="relative max-w-3xl mx-auto p-8 z-10">
        {/* Heading */}
        <h2 className="text-4xl font-bold text-green-800 mb-6 text-center flex items-center justify-center gap-3">
          <FaHandsHelping size={32} /> Soil Restoration
        </h2>

        {/* Intro Tips Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col items-center text-center">
            <FaSeedling className="text-green-700 mb-2" size={28} />
            <p className="text-sm font-medium text-gray-700">Rotate crops to improve soil fertility</p>
          </div>
          <div className="bg-white/80 p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col items-center text-center">
            <FaLeaf className="text-green-700 mb-2" size={28} />
            <p className="text-sm font-medium text-gray-700">Add organic manure or compost</p>
          </div>
          <div className="bg-white/80 p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col items-center text-center">
            <FaHandsHelping className="text-green-700 mb-2" size={28} />
            <p className="text-sm font-medium text-gray-700">Use cover crops to restore balance</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white/80 p-6 rounded-2xl shadow-lg border border-green-100 hover:shadow-2xl transition"
        >
          <input
            type="text"
            placeholder="Enter last harvested crop (e.g., Wheat)"
            value={lastCrop}
            onChange={(e) => setLastCrop(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-semibold"
            disabled={loading}
          >
            {loading ? "Loading..." : "Get Suggestions"}
          </button>
        </form>

        {/* Results */}
        {error && <div className="mt-6 text-red-600 font-semibold">{error}</div>}
        {results.length > 0 && (
          <div className="mt-8 bg-green-50 p-6 rounded-2xl shadow-md border border-green-100 transition animate-fadeIn soil-sprout">
            <h3 className="text-2xl font-semibold text-green-800 mb-4 text-center">
              🌱 Soil Restoration Recommendations
            </h3>
            <div className="grid gap-4 mb-4">
              {results.map((rec, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                  <div className="mb-1"><span className="font-semibold text-green-700">Harvested Crop:</span> {rec.harvested}</div>
                  <div className="mb-1"><span className="font-semibold text-yellow-800">Deficiency:</span> {rec.deficiency}</div>
                  <div className="mb-1"><span className="font-semibold text-emerald-700">Recommended Crop:</span> {rec.recommended_crop}</div>
                  <div className="mb-1"><span className="font-semibold text-cyan-900">Reason:</span> {rec.reason_for_recommended_crop}</div>
                  <div className="mb-1"><span className="font-semibold text-purple-700">Fertilizers:</span> {rec.fertilizers}</div>
                  <div className="mb-1"><span className="font-semibold text-pink-700">Pesticides:</span> {rec.pesticides}</div>
                  <div><span className="font-semibold text-orange-800">Organic Matter:</span> {rec.organic_matter}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SoilRestoration;
