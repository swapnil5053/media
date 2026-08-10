import { Check, X } from "lucide-react";

const BEFORE = [
  { label: "iPhone", ok: true },
  { label: "Android", ok: false },
  { label: "Chrome", ok: false },
  { label: "Smart TV", ok: false },
];

const AFTER = BEFORE.map((device) => ({ ...device, ok: true }));

function Column({
  heading,
  format,
  devices,
  tone,
}: {
  heading: string;
  format: string;
  devices: Array<{ label: string; ok: boolean }>;
  tone: "muted" | "positive";
}) {
  return (
    <div className="flex-1 p-5">
      <p className="text-[13px] text-muted">{heading}</p>
      <p className="mt-1 font-mono text-[13px] text-ink">{format}</p>

      <ul className="mt-4 space-y-2">
        {devices.map((device) => (
          <li key={device.label} className="flex items-center gap-2.5 text-[13px]">
            <span
              className={`flex size-4 items-center justify-center rounded-full ${
                device.ok ? "bg-positive-soft text-positive" : "bg-critical-soft text-critical"
              }`}
            >
              {device.ok ? <Check size={11} aria-hidden /> : <X size={11} aria-hidden />}
            </span>
            <span className={device.ok ? "text-ink" : "text-muted"}>{device.label}</span>
          </li>
        ))}
      </ul>

      <p className={`mt-4 text-2xl font-semibold tabular-nums ${tone === "positive" ? "text-positive" : "text-ink"}`}>
        {devices.filter((device) => device.ok).length}/{devices.length}
      </p>
    </div>
  );
}

/** A quiet, honest product visual: the same clip, before and after AdaptFlow. */
export function DeviceProof() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="ml-2 font-mono text-[12.5px] text-subtle">beach-trip.mov</span>
      </div>

      <div className="flex flex-col divide-y divide-line sm:flex-row sm:divide-x sm:divide-y-0">
        <Column heading="What your friend sent" format="MOV · HEVC · AAC" devices={BEFORE} tone="muted" />
        <Column heading="What AdaptFlow delivers" format="MP4 · H.264 · AAC" devices={AFTER} tone="positive" />
      </div>
    </div>
  );
}
