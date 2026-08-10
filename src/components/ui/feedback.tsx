import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type Tone = "neutral" | "positive" | "caution" | "critical" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-muted border-line",
  positive: "bg-positive-soft text-positive border-positive/20",
  caution: "bg-caution-soft text-caution border-caution/25",
  critical: "bg-critical-soft text-critical border-critical/20",
  accent: "bg-accent-soft text-accent border-accent/20",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12.5px] font-medium",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sunken", className)} />;
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-subtle">{icon}</div> : null}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-card border border-critical/25 bg-critical-soft px-5 py-4">
      <p className="text-sm font-medium text-critical">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
