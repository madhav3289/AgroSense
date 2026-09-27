import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GiWheat } from "react-icons/gi";
import { MdOutlineLocalOffer, MdCheckCircle } from "react-icons/md";
import { Card, PageHeading, Spinner } from "@/components/PageShell";
import { Protected } from "@/components/Protected";
import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/crop-recommendation")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Crop Recommendation — AgroSense" },
      {
        name: "description",
        content:
          "Enter your soil's N, P, K, pH and local weather to get the best crop for your field, plus today's mandi price.",
      },
      { property: "og:title", content: "Crop Recommendation — AgroSense" },
      {
        property: "og:description",
        content: "Soil and weather based crop recommendations with mandi prices.",
      },
    ],
  }),
  component: () => (
    <Protected>
      <CropRecommendationPage />
    </Protected>
  ),
});

type Fields = {
  N: string;
  P: string;
  K: string;
  temperature: string;
  humidity: string;
  ph: string;
  rainfall: string;
};

const EMPTY: Fields = {
  N: "",
  P: "",
  K: "",
  temperature: "",
  humidity: "",
  ph: "",
  rainfall: "",
};

type PredictResult = { crop: string; tip: string };
type MandiResult = {
  crop: string;
  price: number | null;
  unit?: string;
  market?: string;
  state?: string;
  message?: string;
};

const SOIL_FIELDS = [
  { key: "N" as const, label: "Nitrogen (N)", hint: "kg/ha, ≥ 0" },
  { key: "P" as const, label: "Phosphorus (P)", hint: "kg/ha, ≥ 0" },
  { key: "K" as const, label: "Potassium (K)", hint: "kg/ha, ≥ 0" },
  { key: "ph" as const, label: "Soil pH", hint: "4.5 – 9.0" },
];

const WEATHER_FIELDS = [
  { key: "temperature" as const, label: "Temperature (°C)", hint: "10 – 45" },
  { key: "humidity" as const, label: "Humidity (%)", hint: "14 – 95" },
  { key: "rainfall" as const, label: "Rainfall (mm)", hint: "20 – 400" },
];

function CropRecommendationPage() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [autofilled, setAutofilled] = useState<Record<string, boolean>>({});
  const [weatherState, setWeatherState] = useState<"idle" | "loading">("idle");
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResult | null>(null);

  const [mandi, setMandi] = useState<MandiResult | null>(null);
  const [mandiLoading, setMandiLoading] = useState(false);
  const [mandiError, setMandiError] = useState<string | null>(null);

  function update(key: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setAutofilled((a) => ({ ...a, [key]: false }));
  }

  function useMyWeather() {
    setWeatherError(null);
    if (!("geolocation" in navigator)) {
      setWeatherError("Your browser doesn't support location access.");
      return;
    }
    setWeatherState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&past_days=30&forecast_days=1&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("weather");
          const data = await res.json();
          const temperature = data?.current?.temperature_2m;
          const humidity = data?.current?.relative_humidity_2m;
          const daily: number[] = data?.daily?.precipitation_sum ?? [];
          const monthlyTotal = daily.reduce((sum, v) => sum + (Number(v) || 0), 0);
          // The model expects a seasonal/monthly average (20–400mm), not a live
          // reading — use the past 30 days' total, clamped into that range.
          const rainfall = Math.min(400, Math.max(20, Math.round(monthlyTotal)));

          setFields((f) => ({
            ...f,
            temperature: temperature != null ? String(temperature) : f.temperature,
            humidity: humidity != null ? String(humidity) : f.humidity,
            rainfall: String(rainfall),
          }));
          setAutofilled({ temperature: true, humidity: true, rainfall: true });
        } catch {
          setWeatherError("Couldn't fetch the weather for your location. Enter values manually.");
        } finally {
          setWeatherState("idle");
        }
      },
      () => {
        setWeatherState("idle");
        setWeatherError("Location permission denied — you can still type the values in.");
      },
      { timeout: 12000 },
    );
  }

  async function fetchMandi(crop: string) {
    setMandiLoading(true);
    setMandiError(null);
    setMandi(null);
    try {
      const { data } = await api.get<MandiResult>("/api/mandi-price", { params: { crop } });
      setMandi(data);
    } catch (err) {
      setMandiError(apiErrorMessage(err, "Couldn't load the mandi price."));
    } finally {
      setMandiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setMandi(null);
    setLoading(true);
    try {
      const { data } = await api.post<PredictResult>("/api/predict", {
        N: Number(fields.N),
        P: Number(fields.P),
        K: Number(fields.K),
        temperature: Number(fields.temperature),
        humidity: Number(fields.humidity),
        ph: Number(fields.ph),
        rainfall: Number(fields.rainfall),
      });
      setResult(data);
      void fetchMandi(data.crop);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't get a recommendation."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        icon={<GiWheat />}
        title="Crop Recommendation 🌾"
        subtitle="Soil readings + weather → the crop best suited to your field"
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-extrabold text-green-800">Soil</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOIL_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-semibold text-green-800">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={fields[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    placeholder={f.hint}
                  />
                  <p className="mt-1 text-xs text-green-700/80">{f.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-green-800">Weather</h2>
              <button
                type="button"
                onClick={useMyWeather}
                disabled={weatherState === "loading"}
                className="rounded-lg border border-green-300 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50 disabled:opacity-60"
              >
                {weatherState === "loading" ? "Fetching weather…" : "📍 Use my location's weather"}
              </button>
            </div>
            {weatherError ? (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {weatherError}
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              {WEATHER_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-green-800">
                    {f.label}
                    {autofilled[f.key] ? <MdCheckCircle className="text-green-600" /> : null}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={fields[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-green-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 ${
                      autofilled[f.key] ? "border-green-500 bg-green-50" : "border-green-200"
                    }`}
                    placeholder={f.hint}
                  />
                  <p className="mt-1 text-xs text-green-700/80">{f.hint}</p>
                </div>
              ))}
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
            {loading ? "Analysing your field…" : "Recommend a crop"}
          </button>
        </form>
      </Card>

      {loading ? (
        <Card className="mt-6 p-6">
          <Spinner label="Crunching your soil and weather numbers…" />
        </Card>
      ) : null}

      {result ? (
        <>
          <Card className="mt-6 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Recommended crop
            </p>
            <h2 className="mt-1 text-3xl font-extrabold capitalize text-green-800">
              {result.crop} 🌱
            </h2>
            <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-900">
              💡 {result.tip}
            </p>
          </Card>

          <Card className="mt-6 p-6">
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-green-800">
              <MdOutlineLocalOffer /> Mandi price for {result.crop}
            </h3>
            {mandiLoading ? (
              <Spinner label="Checking today's market…" />
            ) : mandiError ? (
              <p className="mt-2 text-sm text-red-700">{mandiError}</p>
            ) : mandi && mandi.price !== null ? (
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-green-800">
                  ₹{mandi.price.toLocaleString("en-IN")}
                  <span className="ml-2 text-sm font-medium text-green-700">
                    {mandi.unit ?? "₹/quintal"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-green-900/80">
                  {[mandi.market, mandi.state].filter(Boolean).join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-green-800/70">
                {mandi?.message ?? "Price data unavailable"}
              </p>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
