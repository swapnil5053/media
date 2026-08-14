import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The argument in one card. The numbers are what the compatibility engine
 * actually returns for an iPhone recording: HEVC in a MOV reaches two of six
 * targets, the delivered copy reaches all six.
 */
const TARGETS = [
  { label: "Android Chrome", original: false },
  { label: "iPhone Safari", original: true },
  { label: "Chrome / Edge", original: false },
  { label: "Firefox", original: false },
  { label: "macOS Safari", original: true },
  { label: "Smart TVs", original: false },
];

export function CompatCard() {
  const [converted, setConverted] = useState(false);
  const playing = converted ? TARGETS.length : TARGETS.filter((target) => target.original).length;
  const percent = Math.round((playing / TARGETS.length) * 100);

  return (
    <div className="w-full max-w-[26rem] rounded-[1.5rem] border border-line bg-panel/90 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-ink">IMG_4821.MOV</p>
          <p className="mt-1 font-mono text-[13px] text-subtle">{converted ? "H.264 · MP4" : "HEVC · MOV"}</p>
        </div>

        <div role="tablist" aria-label="Compatibility view" className="flex shrink-0 rounded-full bg-raised p-1">
          {[
            { key: false, label: "Original" },
            { key: true, label: "Converted" },
          ].map((option) => (
            <button
              key={option.label}
              role="tab"
              type="button"
              aria-selected={converted === option.key}
              tabIndex={converted === option.key ? 0 : -1}
              onClick={() => setConverted(option.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] transition-colors duration-150 ease-[var(--ease)]",
                converted === option.key ? "bg-invert text-on-invert" : "text-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 flex items-baseline gap-2">
        <span className="text-[3.25rem] leading-none font-medium tabular-nums text-ink">{percent}</span>
        <span className="text-2xl font-medium text-ink">%</span>
        <span className="text-[15px] text-muted">of devices</span>
      </p>

      {/* The score as a bar, so the jump from a third to all of them is felt. */}
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--mesh-citron)] to-[var(--mesh-mint)] transition-[width] duration-500 ease-[var(--ease)]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-5 space-y-2.5">
        {TARGETS.map((target) => {
          const plays = converted || target.original;
          return (
            <li key={target.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted">{target.label}</span>
              <span className={cn("flex items-center gap-1.5", plays ? "text-ink" : "text-subtle")}>
                <span aria-hidden className={plays ? "text-positive" : "text-subtle"}>
                  {plays ? "✓" : "✗"}
                </span>
                {plays ? "plays" : "won't open"}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 border-t border-line pt-4 text-[13px] text-subtle">
        {playing} of {TARGETS.length} play it natively · checked against six real devices.
      </p>
    </div>
  );
}
