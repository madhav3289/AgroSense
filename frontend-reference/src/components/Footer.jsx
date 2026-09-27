import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white py-10 mt-12">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        
        {/* About */}
        <div>
          <h2 className="text-2xl font-bold mb-3">🌱 AgroSense</h2>
          <p className="text-green-200">
            Empowering farmers with AI-driven crop recommendations, 
            disease detection, and soil restoration.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:text-green-300">
                Home
              </Link>
            </li>
            <li>
              <Link to="/crop-recommendations" className="hover:text-green-300">
                Crop Recommendations
              </Link>
            </li>
            <li>
              <Link to="/disease-detection" className="hover:text-green-300">
                Disease Detection
              </Link>
            </li>
            <li>
              <Link to="/soil-restoration" className="hover:text-green-300">
                Soil Restoration
              </Link>
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Connect with us</h3>
          <div className="flex justify-center md:justify-start gap-4">
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-300 text-2xl"
            >
              🌐
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-300 text-2xl"
            >
              📘
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-300 text-2xl"
            >
              🐦
            </a>
          </div>
        </div>
      </div>
      <p className="text-center text-green-300 mt-6 text-sm">
        © {new Date().getFullYear()} AgroSense. All Rights Reserved.
      </p>
    </footer>
  );
}

