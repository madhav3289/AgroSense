import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineUserAdd } from "react-icons/ai";
import { MdAutoAwesome } from "react-icons/md";
import { Card, PageHeading } from "@/components/PageShell";
import { api, apiErrorMessage, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account — AgroSense" },
      {
        name: "description",
        content:
          "Register for a free AgroSense account and start getting crop, soil and plant disease guidance.",
      },
      { property: "og:title", content: "Create your account — AgroSense" },
      {
        property: "og:description",
        content:
          "Free AgroSense account: crop recommendations, soil restoration and disease detection.",
      },
    ],
  }),
  component: RegisterPage,
});

const CHARS = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?";

function generatePassword(length = 14) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => CHARS[v % CHARS.length]).join("");
}

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const STRENGTH = [
  { label: "Too weak", color: "bg-red-500", width: "w-1/4" },
  { label: "Weak", color: "bg-orange-500", width: "w-2/4" },
  { label: "Good", color: "bg-yellow-500", width: "w-3/4" },
  { label: "Strong", color: "bg-green-600", width: "w-full" },
  { label: "Very strong", color: "bg-green-700", width: "w-full" },
];

function RegisterPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => STRENGTH[strengthOf(password)] ?? STRENGTH[0]!, [password]);

  useEffect(() => {
    if (isAuthenticated) void navigate({ to: "/crop-recommendation", replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ access_token: string; user: User }>("/api/auth/register", {
        username,
        email,
        password,
      });
      signIn(data.access_token, data.user);
      void navigate({ to: "/crop-recommendation" });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your account"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageHeading
        icon={<AiOutlineUserAdd />}
        title="Join AgroSense 🌱"
        subtitle="Free account — no card needed"
      />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="At least 3 characters"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">Password</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setCopied(false);
                  }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 pr-11 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="At least 6 characters"
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
              <button
                type="button"
                title="Generate a strong password"
                onClick={() => {
                  const generated = generatePassword();
                  setPassword(generated);
                  setShow(true);
                  setCopied(true);
                }}
                className="flex items-center gap-1 rounded-lg border border-green-300 px-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
              >
                <MdAutoAwesome /> Generate
              </button>
            </div>

            {password ? (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-green-100">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all`} />
                </div>
                <p className="mt-1 text-xs font-medium text-green-800">
                  {strength.label}
                  {copied ? " — generated for you, save it somewhere safe." : ""}
                </p>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-green-900">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-green-700 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
