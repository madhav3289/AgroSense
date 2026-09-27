// src/components/AppWrapper.jsx
import React from "react";

const backgrounds = [
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80", // lush green fields
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80", // wheat field
  "https://images.unsplash.com/photo-1597248881519-8d58c9e43864?auto=format&fit=crop&w=1600&q=80", // farmer in crops
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80", // rice terrace
  "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1600&q=80", // soil & young plants
];

function AppWrapper({ children }) {
  const bgImage = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* ✅ overlay for readability */}
      <div className="min-h-screen w-full bg-white/70">{children}</div>
    </div>
  );
}

export default AppWrapper;
