// client/src/pages/DiseaseDetection.jsx
import { useRef, useState } from "react";
import axios from "axios";
import { GiPlantWatering } from "react-icons/gi";
import { AiOutlineCheckCircle, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdOutlineScience } from "react-icons/md";
import jsPDF from "jspdf";
import bg from "/bg.jpg";

function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setError("");
  };

  const runAnalysis = async () => {
    if (!image) {
      setError("Please upload a clear leaf image before analyzing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // The image is sent to our own backend (multipart field "image"), which calls the AI
      // service server-side. No third-party API key ever lives in the browser.
      const formData = new FormData();
      formData.append("image", image);

      const { data } = await axios.post("/api/disease-detection", formData);

      const nextAnalysis = {
        plantName: data.plant_name || "Unknown plant",
        diseaseName: data.disease_name || "Unknown",
        severity: data.severity || "Unknown",
        solution: data.solution || "No solution provided."
      };

      setAnalysis(nextAnalysis);
      setHistory((prev) => [
        {
          img: previewUrl,
          analysis: nextAnalysis
        },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 402) {
        setError("You've used all your free scans. Upgrade to Pro to keep analyzing leaves.");
      } else {
        setError(
          err.response?.data?.error ||
            "Couldn't analyze the leaf, please upload a clearer image and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    runAnalysis();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative bubble-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Background overlay to match crop recommendations style */}
      <div className="absolute inset-0 bg-emerald-900/45 backdrop-blur-sm"></div>

      {/* Decorative bubbles (slightly fewer and slower than crop recommendations) */}
      {[...Array(14)].map((_, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: `${(i * 7 + 10) % 100}vw`,
            animationDuration: `${4 + (i % 5)}s`,
            width: `${14 + (i % 6) * 4}px`,
            height: `${14 + (i % 6) * 4}px`,
            background: "rgba(239, 246, 255, 0.55)",
          }}
        />
      ))}

      <div className="relative max-w-4xl mx-auto p-8 z-10">
        <h2 className="text-4xl font-extrabold text-green-800 mb-3 text-center flex items-center justify-center gap-3">
          <GiPlantWatering size={35} /> Disease Detection
        </h2>

        <p className="text-center text-white mb-8 text-lg font-medium drop-shadow-md">
          Upload a clear picture of your crop leaf 🍃 and we'll analyze it for possible diseases and give remedies.
        </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-green-200 hover:shadow-2xl transition">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-300"
            required
          />
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-52 h-52 flex items-center justify-center rounded-xl bg-green-50 border border-green-200 text-gray-500 italic overflow-hidden hover:bg-green-100 transition cursor-pointer"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Leaf preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>🌱 Upload a leaf image</>
              )}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span> : "Analyze"}
          </button>
        </form>

        {loading && <div className="mt-8 text-center text-green-700 font-medium animate-pulse">🔍 Analyzing your plant image...</div>}

        {error && !loading && (
          <div className="mt-6 text-center bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-col items-center gap-3">
            <span className="text-red-600 font-medium">{error}</span>
            {image && (
              <button
                type="button"
                onClick={runAnalysis}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {analysis && !loading && !error && (
          <div className="mt-8 bg-green-50 p-6 rounded-2xl shadow-md border border-green-200 transition">
            <h3 className="text-2xl font-bold text-green-800 flex items-center gap-2 mb-3">
              {analysis.diseaseName && analysis.diseaseName !== "Healthy" ? (
                <AiOutlineExclamationCircle className="text-red-500" size={26} />
              ) : (
                <AiOutlineCheckCircle className="text-green-500" size={26} />
              )}
              {analysis.diseaseName && analysis.diseaseName !== "Healthy"
                ? `${analysis.plantName} – ${analysis.diseaseName}`
                : `${analysis.plantName} – Healthy`}
            </h3>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Severity:</span> {analysis.severity}
            </p>
            <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-green-100">
              <h4 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
                <MdOutlineScience /> Suggested Recovery / Prevention
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{analysis.solution}</p>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-green-800 mb-6 text-center">📜 Analysis History</h3>
            <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
              {history.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-md border border-green-100 hover:shadow-lg transition flex flex-col">
                  <img src={item.img} alt="history-leaf" className="w-full h-32 object-cover rounded-lg mb-3" />
                  <p className="text-green-800 font-semibold text-sm mb-1">
                    {item.analysis.diseaseName && item.analysis.diseaseName !== "Healthy"
                      ? `${item.analysis.plantName} – ${item.analysis.diseaseName}`
                      : `${item.analysis.plantName} – Healthy`}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">Severity: {item.analysis.severity}</p>
                  <button onClick={() => {
                      const doc = new jsPDF();
                      doc.setFontSize(16);
                      doc.text("Plant Disease Detection Report", 10, 20);
                      doc.setFontSize(12);
                      doc.text(
                        `Plant: ${item.analysis.plantName}`,
                        10,
                        40
                      );
                      doc.text(
                        `Disease: ${item.analysis.diseaseName}`,
                        10,
                        50
                      );
                      doc.text(`Severity: ${item.analysis.severity}`, 10, 60);
                      doc.text("Description:", 10, 75);
                      doc.text("See solution below.", 10, 85, { maxWidth: 180 });
                      doc.text("Suggested Remedies:", 10, 105);
                      const lines = doc.splitTextToSize(item.analysis.solution, 180);
                      doc.text(lines, 15, 115);
                      doc.save(`disease_report_${idx + 1}.pdf`);
                    }} className="mt-auto bg-green-700 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-800 transition">📥 Download Report</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiseaseDetection;
