// Prorun AI brand mark.
// Concept: ascending risk bars pierced by a momentum arrow — "run through
// the risk". Rendered as an inline SVG so it stays crisp at any size and
// matches the app's emerald→lime gradient.
export function LogoMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Prorun AI"
    >
      <defs>
        <linearGradient id="prorun-lg" x1="0" y1="64" x2="64" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="0.55" stopColor="#34d399" />
          <stop offset="1" stopColor="#a3e635" />
        </linearGradient>
        <linearGradient id="prorun-bars" x1="0" y1="64" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#052e1f" />
          <stop offset="1" stopColor="#0b1a12" />
        </linearGradient>
      </defs>

      {/* tile */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="18"
        fill="url(#prorun-lg)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />

      {/* ascending risk bars */}
      <rect x="15" y="41" width="8" height="9" rx="3" fill="url(#prorun-bars)" />
      <rect x="26" y="33" width="8" height="17" rx="3" fill="url(#prorun-bars)" />
      <rect x="37" y="25" width="8" height="25" rx="3" fill="url(#prorun-bars)" />

      {/* momentum arrow */}
      <path
        d="M20 46.5 C 29 44.5, 36 33, 42 19.5"
        stroke="#06130d"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36.5 17.5 L 45 14 L 43 22.5 Z"
        fill="#06130d"
        stroke="#06130d"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}