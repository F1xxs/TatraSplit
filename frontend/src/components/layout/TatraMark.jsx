// Tatra banka diagonal-slash mark — three stylized bars within a bordered square.
export function TatraMark({ className }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tatra banka"
      role="img"
    >
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <g fill="currentColor">
        <rect x="10"    y="26" width="5" height="8"  rx="0.5" transform="skewX(-28)" />
        <rect x="16.5"  y="20" width="5" height="14" rx="0.5" transform="skewX(-28)" />
        <rect x="23"    y="14" width="5" height="20" rx="0.5" transform="skewX(-28)" />
      </g>
    </svg>
  )
}
