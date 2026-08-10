import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { formatDuration, formatPercent } from "@/lib/format";
import { useOverview } from "@/hooks/use-sharing";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";

const AXIS = { stroke: "var(--ink-subtle)", fontSize: 12 };

export function Insights() {
  const overview = useOverview();

  if (overview.isPending) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (overview.isError || !overview.data) {
    return <ErrorState message="We could not load your insights." onRetry={() => void overview.refetch()} />;
  }

  const data = overview.data;
  const chartData = data.daily.map((point) => ({
    label: new Date(point.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    views: point.views,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-3xl">Insights</h1>
        <p className="mt-1 text-sm text-muted">Everything here comes from real plays — nothing is estimated.</p>
      </div>

      {data.totalViews === 0 ? (
        <EmptyState
          icon={<BarChart3 size={20} aria-hidden />}
          title="No plays yet"
          description="Share a video and come back. Views, devices and completion rates appear as people watch."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Views" value={data.totalViews} />
            <Stat label="Unique viewers" value={data.uniqueViewers} />
            <Stat label="Average completion" value={formatPercent(data.averageCompletion)} />
            <Stat label="Watch time" value={formatDuration(data.totalWatchSeconds)} />
          </div>

          <Card>
            <CardHeader title="Views per day" />
            <div className="h-64 px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip
                    cursor={{ fill: "var(--surface-sunken)" }}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--ink)",
                    }}
                  />
                  <Bar dataKey="views" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="What people watched on" description="The reason this product exists, in one table." />
            <ul className="divide-y divide-line">
              {data.devices.map((device) => {
                const share = device.views / data.totalViews;
                return (
                  <li key={device.name} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-32 shrink-0 text-sm text-ink">{device.name}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${share * 100}%` }} />
                    </span>
                    <span className="w-16 shrink-0 text-right font-mono text-[13px] text-muted">
                      {device.views} · {formatPercent(share)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
