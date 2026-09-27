import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AiOutlineUser, AiOutlineThunderbolt } from "react-icons/ai";
import { Card, PageHeading, Spinner } from "@/components/PageShell";
import { Protected } from "@/components/Protected";
import { ProBadge } from "@/components/ProBadge";
import { UpgradeModal } from "@/components/UpgradeModal";
import { api, apiErrorMessage, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const FREE_SCAN_LIMIT = 3;

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Profile — AgroSense" },
      {
        name: "description",
        content:
          "Manage your AgroSense account details: username, email, phone, location and about.",
      },
      { property: "og:title", content: "Your Profile — AgroSense" },
      {
        property: "og:description",
        content: "Manage your AgroSense account details and Pro status.",
      },
    ],
  }),
  component: () => (
    <Protected>
      <ProfilePage />
    </Protected>
  ),
});

type Form = { username: string; email: string; phone: string; location: string; about: string };

function initials(name?: string) {
  if (!name) return "🌱";
  return name
    .split(/\s|_/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ user: User }>("/api/profile")
      .then(({ data }) => {
        if (!active) return;
        setProfileUser(data.user);
        setForm({
          username: data.user.username ?? "",
          email: data.user.email ?? "",
          phone: data.user.phone ?? "",
          location: data.user.location ?? "",
          about: data.user.about ?? "",
        });
        setUser({ ...(user ?? {}), ...data.user });
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, "Couldn't load your profile."));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const { data } = await api.put<{ message: string; user?: User }>("/api/profile", form);
      if (data.user) setUser({ ...(user ?? {}), ...data.user });
      setSuccess(data.message ?? "Profile updated");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <PageHeading
        icon={<AiOutlineUser />}
        title="Your Profile 👤"
        subtitle="Keep your details up to date"
      />

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-700 text-xl font-extrabold text-white">
            {initials(user?.username)}
          </div>
          <div>
            <p className="flex items-center gap-2 text-xl font-extrabold text-green-800">
              {user?.username}
              <ProBadge isPro={user?.is_pro} />
            </p>
            <p className="text-sm text-green-900/80">{user?.email}</p>
          </div>
        </div>

        {!form && !error ? <Spinner label="Loading your profile…" /> : null}

        {form ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-green-800">Username</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-green-800">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-green-800">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="+91…"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-green-800">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="Agra, UP"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-green-800">About</label>
              <textarea
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                placeholder="A few words about your farm"
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
            {success ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        ) : null}

        {error && !form ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      </Card>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-green-800">
            <AiOutlineThunderbolt /> Plan
          </h2>
          <ProBadge isPro={profileUser?.is_pro ?? user?.is_pro} />
        </div>

        {(profileUser?.is_pro ?? user?.is_pro) ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-green-800">You're on Pro 🎉</p>
            {formatDate(profileUser.pro_expires_at) ? (
              <p className="mt-1 text-sm text-green-900/80">
                Renews on {formatDate(profileUser.pro_expires_at)}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-green-900">
              Free disease scans used:{" "}
              <span className="font-bold text-green-800">
                {Math.min(profileUser?.disease_detection_uses ?? 0, FREE_SCAN_LIMIT)} /{" "}
                {FREE_SCAN_LIMIT}
              </span>
            </p>
            <p className="mt-1 text-sm text-green-900/80">
              Remaining: {Math.max(FREE_SCAN_LIMIT - (profileUser?.disease_detection_uses ?? 0), 0)}
            </p>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="mt-4 w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </Card>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} variant="proactive" />
    </div>
  );
}
