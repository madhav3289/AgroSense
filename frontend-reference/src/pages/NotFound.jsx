import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-6xl font-bold text-green-800 mb-4">404</h1>
      <p className="text-lg text-gray-700 mb-6">Oops! The page you’re looking for doesn’t exist.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-green-700 text-white rounded-lg shadow hover:bg-green-600 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}

