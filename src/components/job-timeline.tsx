import type { JobSummary } from "@shared/types";
import { formatRelative } from "@/lib/format";
import { Badge } from "./ui/feedback";

const TONES = {
  done: "positive",
  running: "positive",
  queued: "neutral",
  cancelled: "neutral",
  failed: "critical",
} as const;

/** Stage names from the pipeline, said the way a person would say them. */
const STAGES: Record<string, string> = {
  queued: "Waiting to start",
  probing: "Reading the file",
  converting: "Converting",
  packaging: "Preparing for streaming",
  storyboard: "Making previews",
  fingerprint: "Final checks",
  retrying: "Trying again",
  done: "Finished",
};

const LABELS: Record<string, string> = {
  done: "Done",
  running: "In progress",
  queued: "Waiting",
  cancelled: "Cancelled",
  failed: "Failed",
};

const tone = (status: string) => TONES[status as keyof typeof TONES] ?? "neutral";

export function JobTimeline({ jobs }: { jobs: JobSummary[] }) {
  if (jobs.length === 0) return <p className="px-6 py-8 text-center text-[13px] text-muted">Nothing yet.</p>;

  return (
    <ul className="divide-y divide-line">
      {jobs.map((job) => (
        <li key={job.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
          <Badge tone={tone(job.status)}>{LABELS[job.status] ?? job.status}</Badge>

          <span className="text-sm text-ink">
            {job.status === "running"
              ? `${STAGES[job.stage] ?? job.stage} · ${Math.round(job.progress * 100)}%`
              : (STAGES[job.stage] ?? job.stage)}
          </span>

          {job.attempts > 1 ? <span className="text-[13px] text-caution">retried {job.attempts - 1}×</span> : null}

          <span className="ml-auto text-[13px] text-subtle">
            {job.durationMs !== null ? `${(job.durationMs / 1000).toFixed(1)}s` : formatRelative(job.createdAt)}
          </span>

          {job.error ? <p className="w-full text-[13px] text-critical">{job.error}</p> : null}
        </li>
      ))}
    </ul>
  );
}
