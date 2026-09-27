import type { ReactNode } from "react";
import { Bubbles } from "./Bubbles";
import farmBg from "@/assets/farm-bg.jpg";

/** Full-viewport background image + emerald overlay + bubbles, shared by every page. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${farmBg})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-emerald-900/45 backdrop-blur-sm" aria-hidden="true">
        <Bubbles />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-green-200 bg-white/90 shadow-lg backdrop-blur-md transition hover:shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeading({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 text-center">
      <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-white drop-shadow-md sm:text-4xl">
        {icon}
        {title}
      </h1>
      {subtitle ? <p className="mt-2 text-sm text-green-50/90">{subtitle}</p> : null}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-green-800">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-green-300 border-t-green-700" />
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </div>
  );
}
