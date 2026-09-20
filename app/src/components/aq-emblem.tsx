/** AlphaQ monogram — a hollow "A" triangle overlapping a "Q" ring. Pure SVG,
 * theme-adaptive, scales to its container. */
export function AqEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" fill="none" className={className} aria-hidden="true">
      {/* A — hollow triangle (outer + inner cutout via even-odd) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M86 26 L156 166 L16 166 Z M86 86 L120 150 L52 150 Z"
        fill="var(--primary-bright, #6bffab)"
        fillOpacity="0.92"
      />
      {/* Q — ring */}
      <circle cx="160" cy="150" r="52" stroke="var(--primary, #1ee07a)" strokeWidth="15" />
      {/* Q — tail */}
      <path
        d="M178 168 L204 194"
        stroke="var(--primary, #1ee07a)"
        strokeWidth="15"
        strokeLinecap="round"
      />
    </svg>
  );
}
