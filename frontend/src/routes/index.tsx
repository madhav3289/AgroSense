import { createFileRoute, Link } from "@tanstack/react-router";
import { GiWheat, GiFarmTractor, GiPlantRoots } from "react-icons/gi";
import { MdOutlineLocalOffer, MdOutlineHealthAndSafety } from "react-icons/md";
import { Card } from "@/components/PageShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgroSense — Smart Farming Decisions, Field by Field" },
      {
        name: "description",
        content:
          "Get crop recommendations from your soil and weather, restore soil with rotation advice, detect plant diseases from a photo and check live mandi prices.",
      },
      { property: "og:title", content: "AgroSense — Smart Farming Decisions, Field by Field" },
      {
        property: "og:description",
        content:
          "Crop recommendation, soil restoration, disease detection and mandi prices for Indian farmers.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: <GiWheat className="text-3xl text-green-700" />,
    title: "Crop Recommendation 🌾",
    text: "Enter your soil's N-P-K and pH, pull live weather from your location, and get the crop best suited to your field — with a practical growing tip.",
    to: "/crop-recommendation" as const,
    cta: "Recommend a crop",
  },
  {
    icon: <GiPlantRoots className="text-3xl text-green-700" />,
    title: "Soil Restoration 🌱",
    text: "Tell us what you last harvested and see which rotation crops, fertilizers and organic matter will bring your soil back to health.",
    to: "/soil-restoration" as const,
    cta: "Plan a rotation",
  },
  {
    icon: <MdOutlineHealthAndSafety className="text-3xl text-green-700" />,
    title: "Disease Detection 🔬",
    text: "Upload a photo of a leaf and get the plant, disease, severity and a treatment plan — downloadable as a PDF for your records.",
    to: "/disease-detection" as const,
    cta: "Scan a leaf",
  },
  {
    icon: <MdOutlineLocalOffer className="text-3xl text-green-700" />,
    title: "Mandi Prices 💰",
    text: "See the current market price for your recommended crop, straight from government mandi data, so you know what it's worth before you sow.",
    to: "/crop-recommendation" as const,
    cta: "Check prices",
  },
];

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 text-sm font-semibold text-green-800 backdrop-blur-md">
          <GiFarmTractor /> Smart agriculture, made simple
        </p>
        <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-6xl">
          Grow more with AgroSense 🌿
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-green-50 sm:text-lg">
          AgroSense turns your soil readings, local weather and a simple leaf photo into clear
          decisions — which crop to sow, how to restore your soil, what disease is spreading, and
          what the mandi is paying today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/crop-recommendation"
                className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Start a recommendation
              </Link>
              <Link
                to="/history"
                className="rounded-lg bg-white/90 px-6 py-3 font-semibold text-green-800 backdrop-blur-md transition hover:bg-white"
              >
                Welcome back, {user?.username}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Create a free account
              </Link>
              <Link
                to="/login"
                className="rounded-lg bg-white/90 px-6 py-3 font-semibold text-green-800 backdrop-blur-md transition hover:bg-white"
              >
                I already have an account
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-6">
            {f.icon}
            <h2 className="mt-3 text-xl font-extrabold text-green-800">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-green-900/90">{f.text}</p>
            <Link
              to={f.to}
              className="mt-4 inline-block text-sm font-semibold text-green-700 hover:underline"
            >
              {f.cta} →
            </Link>
          </Card>
        ))}
      </section>

      <section className="mt-14">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-extrabold text-green-800">
            Ready to plan your next season? 🚜
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-green-900/90">
            Create your free AgroSense account — every recommendation, rotation plan and leaf scan
            is saved to your history.
          </p>
          <Link
            to={isAuthenticated ? "/crop-recommendation" : "/register"}
            className="mt-6 inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            {isAuthenticated ? "Go to crop recommendation" : "Get started free"}
          </Link>
        </Card>
      </section>
    </div>
  );
}
