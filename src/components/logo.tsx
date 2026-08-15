import { Link } from "react-router-dom";

/** A wordmark, not a badge — the product name is short enough to be the logo. */
export function Logo({ to = "/", size = 16 }: { to?: string; size?: number }) {
  return (
    <Link
      to={to}
      className="font-semibold tracking-[-0.02em] text-ink"
      style={{ fontSize: size, lineHeight: 1.2 }}
    >
      AdaptFlow
    </Link>
  );
}
