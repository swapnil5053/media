import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-line bg-panel", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-medium text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * The two-column header used at the top of every page and marketing section:
 * title on the left, one supporting line on the right behind a hairline.
 */
export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="mb-8 grid gap-4 md:grid-cols-[1fr_minmax(0,22rem)] md:gap-12">
      <h1 className="text-4xl leading-[1.05] text-ink sm:text-[2.75rem]">{title}</h1>
      {lead ? <p className="rule self-center text-sm text-muted md:pl-8">{lead}</p> : null}
    </header>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-card border border-line bg-panel px-5 py-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-2 text-[2rem] leading-none font-medium tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-2 text-[13px] text-subtle">{hint}</p> : null}
    </div>
  );
}
