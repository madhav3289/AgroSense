import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GiPlantRoots } from "react-icons/gi";
import { Card, PageHeading, Spinner } from "@/components/PageShell";
import { Protected } from "@/components/Protected";
import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/soil-restoration")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Soil Restoration — AgroSense" },
      {
        name: "description",
        content:
          "Tell AgroSense your last harvest and get rotation crops, fertilizers and organic matter to restore your soil.",
      },
      { property: "og:title", content: "Soil Restoration — AgroSense" },
      {
        property: "og:description",
        content: "Crop rotation and soil nutrient restoration advice based on your last harvest.",
      },
    ],
  }),
  component: () => (
    <Protected>
      <SoilRestorationPage />
    </Protected>
  ),
});

export type SoilRecommendation = Record<string, string>;

const FIELD_LABELS: { key: string; label: string; emoji: string }[] = [
  { key: "deficiency ", label: "Deficiency", emoji: "⚠️" },
  { key: "recommended Crop", label: "Recommended crops", emoji: "🌱" },
  { key: "reason for recommended crop)", label: "Why", emoji: "📋" },
  { key: "fertilizers", label: "Fertilizers", emoji: "🧪" },
  { key: "pesticides", label: "Pesticides", emoji: "🛡️" },
  { key: "organic Matter", label: "Organic matter", emoji: "🍂" },
];

/** Defensive lookup: the backend's keys contain stray spaces/parens. */
export function readField(rec: SoilRecommendation, key: string): string | undefined {
  if (rec[key]) return rec[key];
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const target = normalise(key);
  const match = Object.keys(rec).find((k) => normalise(k) === target);
  return match ? rec[match] : undefined;
}

export function SoilCard({ rec }: { rec: SoilRecommendation }) {
  const harvested = readField(rec, "harvested");
  return (
    <Card className="p-6">
      <h3 className="text-xl font-extrabold text-green-800">🌾 After {harvested ?? "harvest"}</h3>
      <dl className="mt-4 space-y-3">
        {FIELD_LABELS.map((f) => {
          const value = readField(rec, f.key);
          if (!value) return null;
          return (
            <div key={f.key}>
              <dt className="text-sm font-semibold text-green-700">
                {f.emoji} {f.label}
              </dt>
              <dd className="text-sm leading-relaxed text-green-900">{value}</dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}

function SoilRestorationPage() {
  const [lastCrop, setLastCrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SoilRecommendation[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setRecommendations(null);
    setLoading(true);
    try {
      const { data } = await api.post<{
        recommendations: SoilRecommendation[];
        message?: string;
      }>("/api/soil-restoration", { last_crop: lastCrop });
      setRecommendations(data.recommendations ?? []);
      setMessage(data.message ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't load rotation advice."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        icon={<GiPlantRoots />}
        title="Soil Restoration 🌱"
        subtitle="What did you last harvest? We'll suggest what to sow next"
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">
              Last harvested crop
            </label>
            <input
              value={lastCrop}
              onChange={(e) => setLastCrop(e.target.value)}
              required
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="e.g. Rice, Wheat, Sugarcane"
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Looking up rotations…" : "Get restoration plan"}
          </button>
        </form>
      </Card>

      {loading ? (
        <Card className="mt-6 p-6">
          <Spinner label="Matching your crop to rotation data…" />
        </Card>
      ) : null}

      {recommendations && recommendations.length > 0 ? (
        <div className="mt-6 space-y-6">
          {recommendations.map((rec, i) => (
            <SoilCard key={i} rec={rec} />
          ))}
        </div>
      ) : null}

      {recommendations && recommendations.length === 0 ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-green-900">
            {message ?? "No suitable rotation found for the given crop."}
          </p>
          <p className="mt-2 text-xs text-green-700/80">
            Try the crop's common name, e.g. "Rice" instead of "Paddy IR64".
          </p>
        </Card>
      ) : null}
    </div>
  );
}
