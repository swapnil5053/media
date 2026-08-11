import type { JobSummary } from "@shared/types";
import { formatRelative } from "@/lib/format";
import { Badge } from "./ui/feedback";

const TONES = {
  done: "positive",
  running: "accent",
  queued: "neutral",
  cancelled: "neutral",
  failed: "critical",
} as const;

const tone = (status: string) => TONES[status as keyof typeof TONES] ?? "neutral";

export function JobTimeline({ jobs }: { jobs: JobSummary[] }) {
  if (jobs.length === 0) return <p className="px-5 py-6 text-center text-[13px] text-muted">No jobs recorded.</p>;

  return (
    <ul className="divide-y divide-line">
      {jobs.map((job) => (
        <li key={job.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
          <span className="font-mono text-[13px] text-ink">{job.type}</span>
          <Badge tone={tone(job.status)}>{job.status}</Badge>

          <span className="text-[13px] text-muted">
            {job.status === "running" ? `${job.stage} · ${Math.round(job.progress * 100)}%` : job.stage}
          </span>

          {job.attempts > 1 ? (
            <span className="text-[13px] text-caution">
              attempt {job.attempts}/{job.maxAttempts}
            </span>
          ) : null}

          <span className="ml-auto font-mono text-[13px] text-subtle">
            {job.durationMs !== null ? `${(job.durationMs / 1000).toFixed(1)}s` : formatRelative(job.createdAt)}
          </span>

          {job.error ? <p className="w-full text-[13px] text-critical">{job.error}</p> : null}
        </li>
      ))}
    </ul>
  );
}
