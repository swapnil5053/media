const BUCKETS_MS = [100, 500, 1_000, 5_000, 15_000, 60_000, 300_000];

interface Histogram {
  counts: number[];
  sum: number;
  total: number;
}

const counters = new Map<string, number>();
const histograms = new Map<string, Histogram>();
const gauges = new Map<string, () => number>();

const startedAt = Date.now();

function key(name: string, labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) return name;
  const rendered = Object.entries(labels)
    .map(([label, value]) => `${label}="${value.replace(/"/g, "")}"`)
    .join(",");
  return `${name}{${rendered}}`;
}

/**
 * A deliberately small in-process metrics registry. It exposes the Prometheus
 * text format, so a real scraper can read it without any client library.
 */
export const metrics = {
  increment(name: string, labels?: Record<string, string>, by = 1): void {
    const id = key(name, labels);
    counters.set(id, (counters.get(id) ?? 0) + by);
  },

  observe(name: string, milliseconds: number, labels?: Record<string, string>): void {
    const id = key(name, labels);
    const histogram = histograms.get(id) ?? { counts: new Array(BUCKETS_MS.length + 1).fill(0), sum: 0, total: 0 };

    const index = BUCKETS_MS.findIndex((bucket) => milliseconds <= bucket);
    const slot = index === -1 ? BUCKETS_MS.length : index;
    histogram.counts[slot] = (histogram.counts[slot] ?? 0) + 1;
    histogram.sum += milliseconds;
    histogram.total += 1;

    histograms.set(id, histogram);
  },

  gauge(name: string, read: () => number): void {
    gauges.set(name, read);
  },

  render(): string {
    const lines: string[] = [];

    lines.push("# HELP adaptflow_uptime_seconds Seconds since the process started.");
    lines.push("# TYPE adaptflow_uptime_seconds gauge");
    lines.push(`adaptflow_uptime_seconds ${Math.round((Date.now() - startedAt) / 1000)}`);

    for (const [name, read] of gauges) {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${read()}`);
    }

    for (const [id, value] of counters) {
      lines.push(`# TYPE ${id.split("{")[0]} counter`);
      lines.push(`${id} ${value}`);
    }

    for (const [id, histogram] of histograms) {
      const name = id.split("{")[0]!;
      const labelPart = id.includes("{") ? id.slice(id.indexOf("{") + 1, -1) : "";
      const withLabel = (extra: string) => (labelPart ? `${name}_bucket{${labelPart},${extra}}` : `${name}_bucket{${extra}}`);

      lines.push(`# TYPE ${name} histogram`);
      let cumulative = 0;
      BUCKETS_MS.forEach((bucket, index) => {
        cumulative += histogram.counts[index] ?? 0;
        lines.push(`${withLabel(`le="${bucket / 1000}"`)} ${cumulative}`);
      });
      lines.push(`${withLabel('le="+Inf"')} ${histogram.total}`);
      lines.push(`${name}_sum${labelPart ? `{${labelPart}}` : ""} ${(histogram.sum / 1000).toFixed(3)}`);
      lines.push(`${name}_count${labelPart ? `{${labelPart}}` : ""} ${histogram.total}`);
    }

    return `${lines.join("\n")}\n`;
  },

  snapshot() {
    return {
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      counters: Object.fromEntries(counters),
      gauges: Object.fromEntries([...gauges].map(([name, read]) => [name, read()])),
    };
  },
};
