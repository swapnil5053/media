import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type Tone = "neutral" | "positive" | "caution" | "critical";

const TONES: Record<Tone, string> = {
  neutral: "border-line text-muted",
  positive: "border-positive/30 text-positive",
  caution: "border-caution/35 text-caution",
  critical: "border-critical/35 text-critical",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium tracking-wide uppercase",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-raised", className)} />;
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-raised"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <div
        className="h-full rounded-full bg-positive transition-[width] duration-500 ease-[var(--ease)]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line px-6 py-16 text-center">
      <p className="text-[15px] text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-card border border-critical/30 px-6 py-5">
      <p className="text-sm text-critical">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
