import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GiPlantRoots } from "react-icons/gi";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { useAuth } from "@/lib/auth";
import { ProBadge } from "./ProBadge";
import { UpgradeModal } from "./UpgradeModal";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/crop-recommendation", label: "Crop Recommendation" },
  { to: "/soil-restoration", label: "Soil Restoration" },
  { to: "/disease-detection", label: "Disease Detection" },
  { to: "/history", label: "History" },
] as const;

export function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const badge = user?.is_pro ? (
    <ProBadge isPro />
  ) : (
    <button
      onClick={() => setUpgradeOpen(true)}
      aria-label="Upgrade to Pro"
      className="transition hover:opacity-80"
    >
      <ProBadge isPro={false} />
    </button>
  );

  function handleSignOut() {
    signOut();
    setOpen(false);
    void navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-green-200/60 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-green-800">
          <GiPlantRoots className="text-2xl text-green-700" />
          AgroSense
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="text-sm font-medium text-green-900 transition hover:text-green-700"
                activeProps={{ className: "text-green-700 font-bold" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-600"
              >
                {user?.username}
              </Link>
              {badge}
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-green-300 px-3 py-1.5 text-sm font-semibold text-green-800 transition hover:bg-green-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-green-300 px-3 py-1.5 text-sm font-semibold text-green-800 transition hover:bg-green-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="text-2xl text-green-800 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <AiOutlineClose /> : <AiOutlineMenu />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-green-100 bg-white/95 px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-green-900"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-green-800"
                  >
                    {user?.username}
                  </Link>
                  <span className="ml-2 inline-block align-middle">{badge}</span>
                </li>
                <li>
                  <button onClick={handleSignOut} className="text-sm font-semibold text-green-800">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-green-800"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-green-800"
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      ) : null}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} variant="proactive" />
    </header>
  );
}
