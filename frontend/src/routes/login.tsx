import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLogin } from "react-icons/ai";
import { Card, PageHeading } from "@/components/PageShell";
import { api, apiErrorMessage, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login — AgroSense" },
      {
        name: "description",
        content:
          "Log in to your AgroSense account to access crop recommendations, soil restoration and disease detection.",
      },
      { property: "og:title", content: "Login — AgroSense" },
      {
        property: "og:description",
        content: "Log in to AgroSense and continue planning your season.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) void navigate({ to: "/crop-recommendation", replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const isEmail = identifier.includes("@");
    try {
      const { data } = await api.post<{ access_token: string; user: User }>("/api/auth/login", {
        ...(isEmail ? { email: identifier } : { username: identifier }),
        password,
      });
      signIn(data.access_token, data.user);
      void navigate({ to: "/crop-recommendation" });
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageHeading
        icon={<AiOutlineLogin />}
        title="Welcome back 🌾"
        subtitle="Log in with your username or email"
      />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">
              Username or email
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="farmer_raj or raj@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 pr-11 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-green-700"
              >
                {show ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-green-900">
          New to AgroSense?{" "}
          <Link to="/register" className="font-semibold text-green-700 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
