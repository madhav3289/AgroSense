export function ProBadge({ isPro }: { isPro?: boolean | undefined }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        isPro ? "bg-amber-400 text-amber-950" : "bg-green-100 text-green-800"
      }`}
    >
      {isPro ? "Pro" : "Free"}
    </span>
  );
}
