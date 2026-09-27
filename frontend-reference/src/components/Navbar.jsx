import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Crop Recommendations", path: "/crop-recommendations" },
    { label: "Soil Restoration", path: "/soil-restoration" },
    { label: "Disease Detection", path: "/disease-detection" },
  ];
  // Animation variants for nav links
  const linkVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6 },
    }),
  };

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-green-900/95 backdrop-blur text-white p-2 sm:p-3 md:p-4 shadow-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, type: "spring" }}
    >
      <div className="mx-auto w-full max-w-6xl md:max-w-7xl px-2 sm:px-3 md:px-4 flex justify-between items-center">
        {/* Logo */}
        <motion.h1
          className="text-xl sm:text-2xl font-bold flex items-center gap-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          🌱 AgroSense
        </motion.h1>

        {/* Mobile menu button */}
        <button
          aria-label="Toggle navigation menu"
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-900 focus:ring-green-300"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 min-w-0">
          {navItems.map(
            (item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={linkVariants}
                className="relative group shrink-0"
              >
                 <Link
                  to={item.path}
                  className="hover:text-green-300 transition whitespace-nowrap text-sm lg:text-base flex items-center gap-1"
                >
                  <span>{item.label}</span>
                </Link>
                {/* Underline Animation */}
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-green-300 transition-all duration-300 group-hover:w-full"></span>
              </motion.div>
            )
          )}
          
          {/* Authentication Section */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={linkVariants}
            className="flex items-center gap-3 lg:gap-4 ml-3 lg:ml-4"
          >
             {isAuthenticated ? (
               <>
                 <span className="text-xs lg:text-sm truncate max-w-[200px] flex items-center gap-1">
                   <span className="text-green-100/90">Welcome,</span>
                   <span className="font-semibold text-lime-300">
                     {user?.username}
                   </span>
                 </span>
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="flex items-center text-white hover:text-green-300 transition text-lg px-2"
                    title="Profile & Settings"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={`${API_URL}${user.avatar_url}`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-green-300 shadow-sm"
                      />
                    ) : (
                      <FaUserCircle size={24} className="text-green-300" />
                    )}
                  </Link>
                  {/* Could put dropdown for more if wanted here */}
                </div>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg transition duration-200 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-green-300 transition text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg transition duration-200 text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {menuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-green-900/95 backdrop-blur border-t border-green-800">
          <div className="flex flex-col space-y-1.5 p-3">
             {navItems.map((item, i) => (
              <Link
                key={i}
                to={item.path}
                className="py-2 px-2 rounded hover:bg-green-800 text-sm flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            ))}

             {isAuthenticated ? (
               <div className="flex items-center justify-between pt-2">
                 <span className="text-sm truncate max-w-[50%] flex items-center gap-1">
                   <span className="text-green-100/90">Welcome,</span>
                   <span className="font-semibold text-lime-300">
                     {user?.username}
                   </span>
                 </span>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  className="text-center py-2 rounded border border-green-300 hover:bg-green-800 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-center py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.nav>
  );
}
