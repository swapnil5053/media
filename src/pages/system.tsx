import { Activity } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { useSystemStatus } from "@/hooks/use-developer";
import { JobTimeline } from "@/components/job-timeline";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/feedback";

const INTERESTING_COUNTERS = [
  ["adaptflow_uploads_total", "Uploads"],
  ["adaptflow_jobs_enqueued_total", "Jobs queued"],
  ["adaptflow_jobs_completed_total", "Jobs completed"],
  ["adaptflow_jobs_retried_total", "Retries"],
  ["adaptflow_jobs_failed_total", "Failures"],
] as const;

/** Sums every labelled series that shares a metric name. */
function total(counters: Record<string, number>, name: string): number {
  return Object.entries(counters)
    .filter(([key]) => key === name || key.startsWith(`${name}{`))
    .reduce((sum, [, value]) => sum + value, 0);
}

export function System() {
  const status = useSystemStatus();

  if (status.isPending) return <Skeleton className="h-72 w-full" />;
  if (status.isError || !status.data) {
    return <ErrorState message="We could not read the system status." onRetry={() => void status.refetch()} />;
  }

  const { queue, jobs, counters, workers, uptimeSeconds } = status.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-3xl">System</h1>
        <p className="mt-1 text-sm text-muted">
          Live view of the transcoding queue. The same numbers are exposed for scraping at{" "}
          <code className="font-mono text-[13px] text-ink">/api/system/metrics</code>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Queued" value={queue.queued} hint={queue.oldestQueuedSeconds > 0 ? `oldest ${queue.oldestQueuedSeconds}s` : "nothing waiting"} />
        <Stat label="Running" value={queue.running} hint={`${workers} workers`} />
        <Stat label="Done today" value={queue.completedToday} hint={queue.averageDurationMs > 0 ? `avg ${(queue.averageDurationMs / 1000).toFixed(1)}s` : undefined} />
        <Stat label="Failed" value={queue.failed} hint={queue.failed > 0 ? "after all retries" : "none"} />
      </div>

      <Card>
        <CardHeader title="Counters" description={`Process uptime ${formatDuration(uptimeSeconds)}.`} />
        <ul className="divide-y divide-line">
          {INTERESTING_COUNTERS.map(([name, label]) => (
            <li key={name} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-[13px] text-muted">{label}</span>
              <span className="font-mono text-[13px] tabular-nums text-ink">{total(counters, name)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="Recent jobs"
          description="Retries use exponential backoff, so a failed attempt reappears here as queued."
          action={<Activity size={16} className="text-subtle" aria-hidden />}
        />
        <JobTimeline jobs={jobs} />
      </Card>
    </div>
  );
}
