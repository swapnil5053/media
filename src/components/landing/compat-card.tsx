import { useEffect, useRef, useState } from "react";

/**
 * The argument in one card. These are the numbers the compatibility engine
 * actually returns for an iPhone recording: HEVC in a MOV reaches two of six
 * targets, the delivered copy reaches all six.
 */
const DEVICES = [
  { name: "Android Chrome", original: false },
  { name: "iPhone Safari", original: true },
  { name: "Chrome / Edge", original: false },
  { name: "Firefox", original: false },
  { name: "macOS Safari", original: true },
  { name: "Smart TVs", original: false },
];

const EASE = "cubic-bezier(0.22,1,0.36,1)";
const BAR_MS = 600;

/**
 * Counts to a new score over the same 600ms the bar takes, on the same curve —
 * a number that snaps while the bar underneath it slides reads as two separate
 * things happening.
 */
function useCountTo(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof requestAnimationFrame !== "function") {
      from.current = target;
      setShown(target);
      return;
    }

    let frame = 0;
    // Start the clock from the first frame's own timestamp. performance.now()
    // and the rAF timeline share an origin in most browsers but not all, and a
    // mismatch leaves t permanently below 1 — the count never lands.
    let began = 0;
    const step = (now: number) => {
      if (!began) began = now;
      const t = Math.min(1, (now - began) / BAR_MS);
      // easeOutQuint, which is what cubic-bezier(0.22,1,0.36,1) looks like
      const eased = 1 - (1 - t) ** 5;
      setShown(Math.round(start + (target - start) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
      else from.current = target;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

export function CompatCard() {
  const [converted, setConverted] = useState(false);
  const playing = converted ? DEVICES.length : DEVICES.filter((device) => device.original).length;
  const score = Math.round((playing / DEVICES.length) * 100);
  const shownScore = useCountTo(score);

  return (
    <div
      className="compat-card"
      style={{
        width: "min(360px,84vw)",
        background: "rgba(20,20,20,0.66)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20,
        padding: 20,
        transition: `border-color 150ms ${EASE}, transform 150ms ${EASE}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#FAFAFA", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            IMG_4821.MOV
          </div>
          <div style={{ fontSize: 13, color: "rgba(250,250,250,0.40)" }}>{converted ? "H.264 · MP4" : "HEVC · MOV"}</div>
        </div>

        <div
          role="tablist"
          aria-label="Compatibility view"
          style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: 3 }}
        >
          {[
            { key: false, label: "Original" },
            { key: true, label: "Converted" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="tab"
              aria-selected={converted === option.key}
              tabIndex={converted === option.key ? 0 : -1}
              data-state-btn={String(converted === option.key)}
              onClick={() => setConverted(option.key)}
              style={{
                border: 0,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 999,
                transition: `background 250ms ${EASE}, color 250ms ${EASE}`,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, margin: "14px 0 8px" }}>
        <span style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {shownScore}
        </span>
        <span style={{ fontSize: 15, fontWeight: 500, paddingBottom: 7 }}>%</span>
        <span style={{ fontSize: 13, color: "rgba(250,250,250,0.40)", paddingBottom: 8 }}>of devices</span>
      </div>

      <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            borderRadius: 999,
            background: "linear-gradient(90deg,#C9F2DA,#F0F0BE)",
            transition: `width 600ms ${EASE}`,
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 12, fontSize: 13 }}>
        {DEVICES.map((device) => {
          const ok = converted || device.original;
          return (
            <div
              key={device.name}
              className="compat-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "5px 8px",
                margin: "0 -8px",
                borderRadius: 8,
                color: "rgba(250,250,250,0.62)",
                transition: `background 150ms ${EASE}, color 150ms ${EASE}, transform 150ms ${EASE}`,
              }}
            >
              <span>{device.name}</span>
              <span
                data-mark={String(ok)}
                style={{ fontSize: 12, whiteSpace: "nowrap", transition: `color 250ms ${EASE}` }}
              >
                {ok ? "✓ plays" : "✗ won't open"}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 13, color: "rgba(250,250,250,0.40)", lineHeight: 1.4 }}>
        {playing} of {DEVICES.length} play it natively · checked against six real devices.
      </p>
    </div>
  );
}
