import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AxiosError } from "axios";
import { MdOutlineHealthAndSafety, MdFileDownload, MdCloudUpload } from "react-icons/md";
import jsPDF from "jspdf";
import { Card, PageHeading, Spinner } from "@/components/PageShell";
import { Protected } from "@/components/Protected";
import { UpgradeModal } from "@/components/UpgradeModal";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/disease-detection")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Plant Disease Detection — AgroSense" },
      {
        name: "description",
        content:
          "Upload a leaf photo and AgroSense identifies the plant, the disease, its severity and the treatment to apply.",
      },
      { property: "og:title", content: "Plant Disease Detection — AgroSense" },
      {
        property: "og:description",
        content: "Photo-based plant disease detection with downloadable PDF reports.",
      },
    ],
  }),
  component: () => (
    <Protected>
      <DiseaseDetectionPage />
    </Protected>
  ),
});

type Detection = {
  plant_name: string;
  disease_name: string;
  severity: string;
  solution: string;
};

type Scan = Detection & { id: string; fileName: string; previewUrl: string; scannedAt: Date };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];

function severityClass(severity: string) {
  const s = severity.toLowerCase();
  if (s.includes("high") || s.includes("severe")) return "bg-red-100 text-red-800";
  if (s.includes("moder")) return "bg-amber-100 text-amber-900";
  if (s.includes("low") || s.includes("mild")) return "bg-yellow-100 text-yellow-900";
  return "bg-green-100 text-green-800";
}

function downloadPdf(scan: Scan) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("AgroSense — Plant Disease Report", 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated: ${scan.scannedAt.toLocaleString()}`, 14, 30);
  doc.text(`Image: ${scan.fileName}`, 14, 37);

  doc.setFontSize(13);
  doc.text(`Plant: ${scan.plant_name}`, 14, 52);
  doc.text(`Disease: ${scan.disease_name}`, 14, 61);
  doc.text(`Severity: ${scan.severity}`, 14, 70);

  doc.text("Recommended solution:", 14, 84);
  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(scan.solution ?? "", 180), 14, 92);

  doc.save(
    `agrosense-${scan.plant_name}-${scan.disease_name}.pdf`.replace(/\s+/g, "-").toLowerCase(),
  );
}

function DiseaseDetectionPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [usesRemaining, setUsesRemaining] = useState<number | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function pickFile(next: File | null) {
    setError(null);
    if (!next) return;
    if (!ACCEPTED.includes(next.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(next.name)) {
      setError("Please upload a JPG, PNG, WEBP or HEIC image.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("Image too large, please use one under 10 MB.");
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleAnalyse() {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const { data } = await api.post<Detection>("/api/disease-detection", form);
      const scan: Scan = {
        ...data,
        id: crypto.randomUUID(),
        fileName: file.name,
        previewUrl: preview ?? "",
        scannedAt: new Date(),
      };
      setScans((prev) => [scan, ...prev]);
      setUsesRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; uses_remaining?: number }>;
      if (
        axiosError.response?.status === 402 &&
        axiosError.response.data?.error === "free_limit_reached"
      ) {
        setUsesRemaining(axiosError.response.data.uses_remaining ?? 0);
        setUpgradeOpen(true);
      } else {
        setError(apiErrorMessage(err, "Couldn't analyse that image."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        icon={<MdOutlineHealthAndSafety />}
        title="Disease Detection 🔬"
        subtitle="Upload a clear photo of an affected leaf"
      />

      {!user?.is_pro && usesRemaining !== null ? (
        <p className="mb-4 rounded-xl bg-white/90 px-4 py-2 text-center text-sm font-semibold text-green-800 backdrop-blur-md">
          {usesRemaining > 0
            ? `${usesRemaining} free scan${usesRemaining === 1 ? "" : "s"} remaining`
            : "No free scans remaining — upgrade to keep scanning"}
        </p>
      ) : null}

      <Card className="p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragging ? "border-green-600 bg-green-50" : "border-green-300 bg-green-50/40"
          }`}
        >
          <MdCloudUpload className="text-4xl text-green-700" />
          <p className="mt-2 font-semibold text-green-800">
            Drag &amp; drop a leaf photo, or click to choose
          </p>
          <p className="mt-1 text-xs text-green-700/80">JPG, PNG, WEBP or HEIC — up to 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {preview ? (
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
            <img
              src={preview}
              alt="Selected leaf"
              loading="lazy"
              className="h-40 w-40 rounded-2xl border border-green-200 object-cover"
            />
            <div className="text-sm text-green-900">
              <p className="font-semibold">{file?.name}</p>
              <p className="text-green-700/80">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="mt-2 text-sm font-semibold text-green-700 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          onClick={handleAnalyse}
          disabled={!file || loading}
          className="mt-5 w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
        >
          {loading ? "Analysing leaf…" : "Detect disease"}
        </button>
      </Card>

      {loading ? (
        <Card className="mt-6 p-6">
          <Spinner label="Looking closely at that leaf…" />
        </Card>
      ) : null}

      {scans.length === 0 && !loading ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-green-900">
            No scans yet in this session — upload a leaf photo to get started. 🌿
          </p>
        </Card>
      ) : null}

      <div className="mt-6 space-y-6">
        {scans.map((scan) => (
          <Card key={scan.id} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              {scan.previewUrl ? (
                <img
                  src={scan.previewUrl}
                  alt={scan.plant_name}
                  loading="lazy"
                  className="h-32 w-32 shrink-0 rounded-2xl border border-green-200 object-cover"
                />
              ) : null}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold text-green-800">
                    {scan.plant_name} — {scan.disease_name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${severityClass(scan.severity)}`}
                  >
                    {scan.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-green-700/80">
                  {scan.scannedAt.toLocaleString()} · {scan.fileName}
                </p>
                <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-900">
                  {scan.solution}
                </p>
                <button
                  onClick={() => downloadPdf(scan)}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg border border-green-300 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                >
                  <MdFileDownload /> Download as PDF
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
