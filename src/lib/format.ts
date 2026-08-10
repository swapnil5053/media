export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return "0 MB";
  if (bytes < 1024 ** 2) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(bytes < 10 * 1024 ** 2 ? 1 : 0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return "0:00";

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
    : `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatRelative(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";

  const steps: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];

  let value = seconds / 60;
  let unit: Intl.RelativeTimeFormatUnit = "minute";

  for (const [divisor, nextUnit] of steps) {
    if (Math.abs(value) < divisor) break;
    value /= divisor;
    unit = nextUnit;
  }

  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-Math.round(value), unit);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export const formatPercent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export function formatResolution(width: number, height: number): string {
  if (!width || !height) return "Unknown";

  const shortSide = Math.min(width, height);
  const label = shortSide >= 2160 ? "4K" : shortSide >= 1080 ? "1080p" : shortSide >= 720 ? "720p" : `${shortSide}p`;
  return `${label} · ${width}×${height}`;
}
