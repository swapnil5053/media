import { Link } from "react-router-dom";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-ink" aria-label="AdaptFlow home">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="0.75" y="3.75" width="12.5" height="12.5" rx="3.25" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M13.25 7.5H16.25C17.6307 7.5 18.75 8.61929 18.75 10V13.75C18.75 15.1307 17.6307 16.25 16.25 16.25H13.25"
          stroke="var(--positive)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">AdaptFlow</span>
    </Link>
  );
}
