export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-green-100 py-20 text-center">
        <h1 className="text-4xl font-bold text-green-900">🌱 Welcome to AgroSense</h1>
        <p className="mt-4 text-lg text-gray-700">
          Smart crop recommendations, disease detection, and soil restoration insights for farmers.
        </p>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <h2 className="text-3xl font-bold text-center text-green-800 mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
          <div className="p-6 bg-green-50 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-green-900 mb-2">🌦 Crop Recommendations</h3>
            <p className="text-gray-700">
              Get the best crops to grow based on weather, soil, and region conditions.
            </p>
          </div>
          <div className="p-6 bg-green-50 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-green-900 mb-2">🩺 Disease Detection</h3>
            <p className="text-gray-700">
              Upload crop images to detect diseases early and prevent losses.
            </p>
          </div>
          <div className="p-6 bg-green-50 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold text-green-900 mb-2">🌍 Soil Restoration</h3>
            <p className="text-gray-700">
              Get crop suggestions that help restore soil nutrients quickly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

