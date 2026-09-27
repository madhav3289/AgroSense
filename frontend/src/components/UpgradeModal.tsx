import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose, AiOutlineThunderbolt } from "react-icons/ai";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type OrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type UpgradeModalVariant = "limit_reached" | "proactive";

const VARIANT_COPY: Record<UpgradeModalVariant, { title: string; subtext: string }> = {
  limit_reached: {
    title: "You've used your free scans 🌾",
    subtext:
      "Upgrade to AgroSense Pro for unlimited plant disease detection, priority analysis and full scan history.",
  },
  proactive: {
    title: "Upgrade to Pro",
    subtext:
      "Unlock unlimited disease detections, PDF reports for every scan, and full history & mandi prices.",
  },
};

export function UpgradeModal({
  open,
  onClose,
  variant = "limit_reached",
}: {
  open: boolean;
  onClose: () => void;
  variant?: UpgradeModalVariant;
}) {
  const { user, refreshUser } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "verifying" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setOrder(null);
      setStatus("idle");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const copy = VARIANT_COPY[variant];
  const priceLabel = order
    ? `₹${(order.amount / 100).toFixed(2)} / month`
    : "₹99 / month (approx.)";

  async function handleUpgrade() {
    setError(null);
    setStatus("loading");
    try {
      const { data } = await api.post<OrderResponse>("/api/create-order");
      setOrder(data);

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        setStatus("idle");
        setError("Couldn't load the payment window. Please check your connection.");
        return;
      }

      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "AgroSense Pro",
        description: "Unlimited disease detection scans",
        theme: { color: "#15803d" },
        prefill: { name: user?.username, email: user?.email },
        modal: { ondismiss: () => setStatus("idle") },
        handler: async (response: Record<string, string>) => {
          setStatus("verifying");
          try {
            const { data: verify } = await api.post<{ success: boolean; error?: string }>(
              "/api/verify-payment",
              {
                razorpay_order_id: response["razorpay_order_id"],
                razorpay_payment_id: response["razorpay_payment_id"],
                razorpay_signature: response["razorpay_signature"],
              },
            );
            if (verify.success) {
              await refreshUser();
              setStatus("success");
            } else {
              setStatus("idle");
              setError("Payment could not be verified, please contact support.");
            }
          } catch {
            setStatus("idle");
            setError("Payment could not be verified, please contact support.");
          }
        },
      });
      rzp.open();
    } catch (err) {
      setStatus("idle");
      setError(apiErrorMessage(err, "Upgrades aren't available right now."));
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-green-200 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-xl text-green-800 hover:text-green-600"
        >
          <AiOutlineClose />
        </button>

        {status === "success" ? (
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-green-800">🎉 You're Pro!</h2>
            <p className="mt-2 text-sm text-green-900">
              Unlimited disease detection scans are now unlocked.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Continue scanning
            </button>
          </div>
        ) : (
          <>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-green-800">
              <AiOutlineThunderbolt /> {copy.title}
            </h2>
            <p className="mt-2 text-sm text-green-900">{copy.subtext}</p>

            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50/80 p-4">
              <p className="text-lg font-extrabold text-green-800">AgroSense Pro</p>
              <p className="text-sm text-green-900">{priceLabel}</p>
              <ul className="mt-2 space-y-1 text-sm text-green-900">
                <li>✅ Unlimited disease scans</li>
                <li>✅ PDF reports for every scan</li>
                <li>✅ Full history &amp; mandi prices</li>
              </ul>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}

            <button
              onClick={handleUpgrade}
              disabled={status !== "idle"}
              className="mt-5 w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
            >
              {status === "loading"
                ? "Opening checkout…"
                : status === "verifying"
                  ? "Verifying payment…"
                  : "Upgrade with Razorpay"}
            </button>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-green-800 hover:underline"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
