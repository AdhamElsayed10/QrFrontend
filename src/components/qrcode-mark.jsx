export function QRMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary/10 stroke-primary/35" strokeWidth="1" />
      <g className="stroke-primary" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M7 12V7h5" />
        <path d="M20 7h5v5" />
        <path d="M25 20v5h-5" />
        <path d="M12 25H7v-5" />
      </g>
      <rect x="14" y="14" width="4" height="4" rx="1" className="fill-primary/80" />
    </svg>
  );
}
