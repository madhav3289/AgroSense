import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Spinner } from "./PageShell";

export function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-2xl border border-green-200 bg-white/90 p-8 shadow-lg backdrop-blur-md">
          <Spinner label={loading ? "Checking your session…" : "Redirecting to login…"} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
