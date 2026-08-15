/** Padlock, drawn in the same 1.2px line weight as the diagrams. */
export function LockGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 20 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden
    >
      <rect data-node x="1" y="9" width="18" height="12" rx="3" />
      <path d="M5 9V6a5 5 0 0 1 10 0v3" />
      <circle cx="10" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
