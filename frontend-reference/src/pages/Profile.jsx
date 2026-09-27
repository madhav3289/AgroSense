import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { FaUserCircle } from "react-icons/fa";
import bg from "/bg.jpg";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [joinedAt, setJoinedAt] = useState("");
  const [isActiveFlag, setIsActiveFlag] = useState(true);

  useEffect(() => {
    // Fetch profile on page load
    async function fetchProfile() {
      if (!isAuthenticated) return;
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const u = data.user || {};
        setUsername(u.username || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setLocation(u.location || "");
        setAbout(u.about || "");
        setJoinedAt(u.created_at || "");
        setIsActiveFlag(u.is_active ?? true);
      } catch {
        // Leave the fields at their defaults if the profile can't be loaded.
      }
    }
    fetchProfile();
  }, [isAuthenticated]);

  // Save profile to backend
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
          phone,
          location,
          about,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profile update failed");
      }
      const u = data.user || {};
      setUsername(u.username || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
      setLocation(u.location || "");
      setAbout(u.about || "");
      setMessage("Profile updated successfully");
      setEditMode(false);
    } catch (err) {
      setMessage(err.message || "Could not update profile");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPassword("");
      setMessage("Password changed (demo only; backend not implemented).");
      setTimeout(() => setMessage(""), 2500);
    }, 1000);
  };

  const profileCompletion = (() => {
    let score = 0;
    if (username) score += 1;
    if (email) score += 1;
    if (phone) score += 1;
    if (location) score += 1;
    if (about) score += 1;
    const totalFields = 5;
    return Math.round((score / totalFields) * 100);
  })();

  const formattedJoined =
    joinedAt && !Number.isNaN(Date.parse(joinedAt))
      ? new Date(joinedAt).toLocaleDateString()
      : "Not available";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative bubble-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-emerald-900/45 backdrop-blur-sm"></div>

      {/* Soft ambient bubbles for profile */}
      {[...Array(14)].map((_, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: `${(i * 6 + 20) % 100}vw`,
            animationDuration: `${4 + (i % 6)}s`,
            width: `${12 + (i % 5) * 4}px`,
            height: `${12 + (i % 5) * 4}px`,
            background: "rgba(209, 250, 229, 0.55)", // pale green
          }}
        />
      ))}

      <div className="relative max-w-5xl mx-auto py-8 sm:py-10 px-3 md:px-6 z-10">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-md sm:shadow-lg p-5 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
              <FaUserCircle className="w-24 h-24 sm:w-28 sm:h-28 text-green-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-lime-400 truncate">
                {username || user?.username || "AgroSense User"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Profile &amp; settings overview
              </p>
            </div>
          </div>
          {message && (
            <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm w-full sm:w-auto">
              {message}
            </div>
          )}
        </div>

        {/* Quick account overview */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Account Status
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-900">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isActiveFlag ? "bg-emerald-500" : "bg-red-500"
                }`}
              ></span>
              {isActiveFlag ? "Active" : "Inactive"}
            </span>
            <span className="text-[11px] text-emerald-800/80">
              You can securely access all AgroSense tools.
            </span>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
              Member Since
            </span>
            <span className="text-sm font-medium text-sky-900">{formattedJoined}</span>
            <span className="text-[11px] text-sky-800/80">
              Thank you for growing with AgroSense.
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              Profile Insights
            </span>
            <span className="text-sm font-medium text-amber-900">
              Keep your details up to date for the best recommendations.
            </span>
            <div className="mt-1">
              <div className="flex justify-between text-[11px] text-amber-800/80 mb-1">
                <span>Profile completion</span>
                <span>{profileCompletion}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-amber-400 transition-all"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Account</h3>
            {!editMode ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-semibold">Name:</span>{" "}
                  {username ? (
                    <span className="font-semibold text-lime-400">
                      {username}
                    </span>
                  ) : (
                    "-"
                  )}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Email:</span> {email || "-"}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Contact:</span>{" "}
                  {phone || "Add your contact number"}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Location:</span>{" "}
                  {location || "Add where you farm from"}
                </div>
                <button onClick={() => setEditMode(true)} className="w-full sm:w-auto bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition">
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col">
                  <label className="font-semibold text-sm mb-1">Name</label>
                  <input type="text" className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 3 characters</p>
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold text-sm mb-1">Email</label>
                  <input type="email" className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold text-sm mb-1">Contact number</label>
                  <input
                    type="tel"
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold text-sm mb-1">Location</label>
                  <input
                    type="text"
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City / District, State"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold text-sm mb-1">About / Farm details</label>
                  <textarea
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none min-h-[72px] resize-none"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Share a bit about your farm, crops, or goals."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This helps tailor your recommendations.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition w-full sm:w-auto" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 transition w-full sm:w-auto">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Password Change */}
          <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="flex flex-col">
                <label className="font-semibold text-sm mb-1">New password</label>
                <input type="password" className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Enter a new password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <button type="submit" className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
