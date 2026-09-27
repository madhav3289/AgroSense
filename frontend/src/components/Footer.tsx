import { Link } from "@tanstack/react-router";
import { GiPlantRoots } from "react-icons/gi";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-green-200/50 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <div className="flex items-center gap-2 font-extrabold text-green-800">
          <GiPlantRoots className="text-xl text-green-700" />
          AgroSense
        </div>
        <div className="flex gap-4 text-sm text-green-900">
          <Link to="/crop-recommendation" className="hover:text-green-600">
            Crop Recommendation
          </Link>
          <Link to="/history" className="hover:text-green-600">
            History
          </Link>
          <Link to="/profile" className="hover:text-green-600">
            Profile
          </Link>
        </div>
        <p className="text-xs text-green-700">
          © {new Date().getFullYear()} AgroSense — smart farming for everyone.
        </p>
      </div>
    </footer>
  );
}
