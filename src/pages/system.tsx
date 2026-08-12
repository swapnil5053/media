import { useSystemStatus } from "@/hooks/use-developer";
import { JobTimeline } from "@/components/job-timeline";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";

/**
 * Deliberately plain. The queue underneath has workers, retries and backoff, but
 * someone checking on their upload only needs to know what is happening to it.
 */
export function System() {
  const status = useSystemStatus();

  if (status.isPending) return <Skeleton className="h-72 w-full" />;
  if (status.isError || !status.data) {
    return <ErrorState message="We could not load your activity." onRetry={() => void status.refetch()} />;
  }

  const { queue, jobs } = status.data;
  const waiting = queue.queued + queue.running;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity"
        lead="Everything currently being prepared, and what finished recently."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="In progress" value={waiting} hint={waiting === 0 ? "nothing waiting" : "being prepared now"} />
        <Stat label="Finished today" value={queue.completedToday} />
        <Stat
          label="Needs attention"
          value={queue.failed}
          hint={queue.failed === 0 ? "none" : "we could not process these"}
        />
      </div>

      <Card>
        <CardHeader title="Recent" description="Newest first." />
        {jobs.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Upload a video and you will see it move through here as it is prepared."
          />
        ) : (
          <JobTimeline jobs={jobs} />
        )}
      </Card>
    </div>
  );
}
