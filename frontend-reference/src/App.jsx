import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppWrapper from "./components/AppWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import Services from "./pages/Services";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CropRecommendations from "./pages/CropRecommendations"; 
import DiseaseDetection from "./pages/DiseaseDetection";
import SoilRestoration from "./pages/SoilRestoration";
import Profile from "./pages/Profile";


function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Background wrapper */}
        <div className="flex-grow">
          <AppWrapper>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/crop-recommendations" 
                element={
                  <ProtectedRoute>
                    <CropRecommendations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/disease-detection" 
                element={
                  <ProtectedRoute>
                    <DiseaseDetection />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/soil-restoration" 
                element={
                  <ProtectedRoute>
                    <SoilRestoration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppWrapper>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </AuthProvider>
  );
}


export default App;
