import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MdHistory } from "react-icons/md";
import { Card, PageHeading, Spinner } from "@/components/PageShell";
import { Protected } from "@/components/Protected";
import { api, apiErrorMessage } from "@/lib/api";
import { SoilCard, type SoilRecommendation } from "./soil-restoration";

export const Route = createFileRoute("/history")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your History — AgroSense" },
      {
        name: "description",
        content:
          "Every crop recommendation, soil rotation plan and disease scan you've run on AgroSense, newest first.",
      },
      { property: "og:title", content: "Your History — AgroSense" },
      {
        property: "og:description",
        content: "Review your past AgroSense recommendations and scans.",
      },
    ],
  }),
  component: () => (
    <Protected>
      <HistoryPage />
    </Protected>
  ),
});

type HistoryItem =
  | {
      type: "crop_recommendation";
      input: Record<string, number>;
      result: { crop: string; tip: string };
      created_at: string;
    }
  | {
      type: "soil_restoration";
      input: { last_crop: string };
      result: { recommendations: SoilRecommendation[]; total_matches?: number };
      created_at: string;
    }
  | {
      type: "disease_detection";
      input: { mime_type?: string; size_bytes?: number };
      result: {
        plant_name: string;
        disease_name: string;
        severity: string;
        solution: string;
      };
      created_at: string;
    };

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ items: HistoryItem[] }>("/api/history", { params: { limit: 100 } })
      .then(({ data }) => {
        if (active) setItems(data.items ?? []);
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, "Couldn't load your history."));
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        icon={<MdHistory />}
        title="Your History 📜"
        subtitle="Everything you've run on AgroSense, newest first"
      />

      {error ? (
        <Card className="p-6">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      ) : null}

      {!items && !error ? (
        <Card className="p-6">
          <Spinner label="Loading your history…" />
        </Card>
      ) : null}

      {items && items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-green-900">
            No history yet — try a crop recommendation to get started.
          </p>
          <Link
            to="/crop-recommendation"
            className="mt-4 inline-block rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            Recommend a crop
          </Link>
        </Card>
      ) : null}

      <div className="space-y-6">
        {items?.map((item, i) => {
          if (item.type === "crop_recommendation") {
            return (
              <Card key={i} className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  🌾 Crop recommendation · {formatDate(item.created_at)}
                </p>
                <h3 className="mt-1 text-2xl font-extrabold capitalize text-green-800">
                  {item.result?.crop}
                </h3>
                <p className="mt-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
                  💡 {item.result?.tip}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-green-900">
                  {Object.entries(item.input ?? {}).map(([k, v]) => (
                    <span key={k} className="rounded-full bg-green-100 px-2 py-1 font-medium">
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              </Card>
            );
          }

          if (item.type === "disease_detection") {
            const sizeMb = item.input?.size_bytes
              ? `${(item.input.size_bytes / 1024 / 1024).toFixed(2)} MB`
              : null;
            return (
              <Card key={i} className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  🔬 Disease detection · {formatDate(item.created_at)}
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-green-800">
                  {item.result?.plant_name} — {item.result?.disease_name}
                </h3>
                <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                  Severity: {item.result?.severity}
                </span>
                <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
                  {item.result?.solution}
                </p>
                <p className="mt-2 text-xs text-green-700/80">
                  {[item.input?.mime_type, sizeMb].filter(Boolean).join(" · ")}
                </p>
              </Card>
            );
          }

          return (
            <div key={i} className="space-y-3">
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  🌱 Soil restoration · {formatDate(item.created_at)}
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-green-800">
                  After harvesting {item.input?.last_crop}
                </h3>
                {item.result?.total_matches ? (
                  <p className="mt-1 text-xs text-green-700/80">
                    {item.result.total_matches} matching rotation record
                    {item.result.total_matches === 1 ? "" : "s"}
                  </p>
                ) : null}
              </Card>
              {(item.result?.recommendations ?? []).map((rec, j) => (
                <SoilCard key={j} rec={rec} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
