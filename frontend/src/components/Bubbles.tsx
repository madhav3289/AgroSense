const BUBBLES = [
  { left: "6%", size: 70, delay: "0s", duration: "17s" },
  { left: "18%", size: 34, delay: "3s", duration: "13s" },
  { left: "31%", size: 96, delay: "6s", duration: "21s" },
  { left: "45%", size: 46, delay: "1.5s", duration: "15s" },
  { left: "58%", size: 120, delay: "8s", duration: "24s" },
  { left: "71%", size: 40, delay: "4.5s", duration: "14s" },
  { left: "84%", size: 82, delay: "2s", duration: "19s" },
  { left: "93%", size: 28, delay: "7s", duration: "12s" },
];

/** Decorative rising bubbles used on every page background. */
export function Bubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="agro-bubble absolute rounded-full bg-white/25"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}
    </div>
  );
}
