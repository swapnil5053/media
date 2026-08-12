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
    <div className="w-full max-w-sm rounded-card border border-line bg-panel/85 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] text-ink">IMG_4821.MOV</p>
          <p className="mt-0.5 text-[13px] text-muted">{converted ? "H.264 · MP4" : "HEVC · MOV"}</p>
        </div>

        <div role="tablist" aria-label="Compatibility view" className="flex rounded-full border border-line p-0.5">
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
                "rounded-full px-2.5 py-1 text-[12px] transition-colors duration-150 ease-[var(--ease)]",
                converted === option.key ? "bg-invert text-on-invert" : "text-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[2.5rem] leading-none font-medium tabular-nums transition-colors duration-150",
            converted ? "text-positive" : "text-ink",
          )}
        >
          {percent}%
        </span>
        <span className="text-sm text-muted">of devices</span>
      </p>
      <p className="mt-1 text-[13px] text-subtle">
        {playing} of {TARGETS.length} play it natively
      </p>

      <ul className="mt-4 space-y-2 border-t border-line pt-4">
        {TARGETS.map((target) => {
          const plays = converted || target.original;
          return (
            <li key={target.label} className="flex items-center justify-between text-[13px]">
              <span className="text-muted">{target.label}</span>
              <span className={plays ? "text-positive" : "text-subtle"}>{plays ? "plays" : "won't open"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
