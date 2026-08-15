import { useEffect, useMemo, useRef } from "react";

interface Bar {
  top: string;
  height: string;
  background: string;
}

interface Card {
  x: string;
  y: string;
  width: string;
  opacity: number;
  blur: string;
  rotate: string;
  border: string;
  shadow: string;
  still: string;
  grade: string;
  bars: Bar[];
  chip: boolean;
  play: boolean;
  progress: string | false;
}

/** Eleven frames, cycled by the seeded shuffle below. See public/stills/README.md. */
const STILLS = Array.from({ length: 11 }, (_, i) => `/stills/f${String(i + 1).padStart(2, "0")}.jpg`);

const BANDS = [
  { key: "far", count: 34, width: 62, base: 60, opacity: 0.35, blur: "blur(6px)", animation: "riverFar 38s cubic-bezier(0.37,0,0.63,1) infinite alternate" },
  { key: "mid", count: 24, width: 104, base: 78, opacity: 0.7, blur: "blur(2px)", animation: "riverMid 33s cubic-bezier(0.37,0,0.63,1) infinite alternate" },
  { key: "near", count: 16, width: 168, base: 96, opacity: 1, blur: "none", animation: "riverNear 40s cubic-bezier(0.37,0,0.63,1) infinite alternate" },
] as const;

/** Fixed seed, so the composition is the same every load and matches the design. */
function buildBands() {
  let seed = 20260817;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  return BANDS.map((band) => ({
    key: band.key,
    animation: band.animation,
    cards: Array.from({ length: band.count }, (_, index): Card => {
      const t = (index + 0.5) / band.count;
      const x = -10 + t * 122 + (random() - 0.5) * 7;
      const raw = band.base - x * 0.72 + (random() - 0.5) * 12;
      const y = (((raw + 10) % 122) + 122) % 122 - 12;

      // p runs 0 → 1 along the diagonal: 0 is the file that will not open.
      const p = Math.max(0, Math.min(1, (x + 6) / 96));
      const grey = Math.max(0, 1 - p * 1.55);
      const broken = p < 0.56 && random() < 0.92 - p;
      const barCount = broken ? 2 + (random() < 0.45 ? 1 : 0) : 0;

      return {
        x: `${x.toFixed(2)}%`,
        y: `${y.toFixed(2)}%`,
        width: `${band.width}px`,
        opacity: band.opacity,
        blur: band.blur,
        rotate: `${((random() - 0.5) * 3).toFixed(2)}deg`,
        border: p > 0.55 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        shadow: band.key === "near" ? "0 18px 40px rgba(0,0,0,0.45)" : "none",
        still: STILLS[Math.floor(random() * STILLS.length)] ?? STILLS[0]!,
        grade: `saturate(${(1 - grey * 0.95).toFixed(2)}) brightness(${(0.72 + p * 0.52).toFixed(2)}) contrast(${(0.85 + p * 0.2).toFixed(2)})`,
        bars: Array.from({ length: barCount }, () => ({
          top: `${(14 + random() * 68).toFixed(1)}%`,
          height: `${(3 + random() * 6).toFixed(1)}%`,
          background: random() < 0.5 ? "rgba(10,10,10,0.85)" : "rgba(196,196,190,0.14)",
        })),
        chip: broken && band.key !== "far" && p < 0.42 && random() < 0.6,
        play: !broken && p > 0.62 && random() < 0.5,
        progress: !broken && p > 0.5 && random() < 0.34 ? `${35 + Math.floor(random() * 55)}%` : false,
      };
    }),
  }));
}

function CardTile({ card }: { card: Card }) {
  return (
    <div
      style={{
        position: "absolute",
        left: card.x,
        top: card.y,
        width: card.width,
        aspectRatio: "16 / 9",
        borderRadius: 8,
        overflow: "hidden",
        background: "#0D0D0D",
        border: `1px solid ${card.border}`,
        transform: `rotate(${card.rotate})`,
        opacity: card.opacity,
        filter: card.blur === "none" ? undefined : card.blur,
        boxShadow: card.shadow === "none" ? undefined : card.shadow,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${card.still})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: card.grade,
        }}
      />

      {card.bars.map((bar, index) => (
        <div
          key={index}
          style={{ position: "absolute", left: 0, right: 0, top: bar.top, height: bar.height, background: bar.background }}
        />
      ))}

      {card.chip ? (
        <span
          style={{
            position: "absolute",
            left: 6,
            bottom: 6,
            fontSize: 9,
            letterSpacing: "0.02em",
            color: "rgba(250,250,250,0.82)",
            background: "rgba(10,10,10,0.72)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 5,
            padding: "2px 5px",
            whiteSpace: "nowrap",
          }}
        >
          can't open
        </span>
      ) : null}

      {card.play ? (
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 0,
            height: 0,
            borderLeft: "9px solid rgba(255,255,255,0.92)",
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
          }}
        />
      ) : null}

      {card.progress ? (
        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            bottom: 6,
            height: 2,
            borderRadius: 999,
            background: "rgba(255,255,255,0.22)",
          }}
        >
          <div style={{ width: card.progress, height: "100%", borderRadius: 999, background: "#C9F2DA" }} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Everything painted behind the hero copy: a lit backdrop, and three depth bands
 * of real frames drifting along a diagonal in the right-hand two thirds. Cards
 * that start on the left are desaturated, torn by dropped-frame bars and
 * labelled "can't open"; as they travel right they gain colour, a play glyph and
 * a progress bar — the product's argument, told without a word of copy.
 */
export function HeroRiver() {
  const bands = useMemo(buildBands, []);
  const riverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const river = riverRef.current;
    if (!river || !("IntersectionObserver" in window)) return;

    // The drift keyframes are the only thing still running when nothing is
    // scrolling, so stop them once the hero is off screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const state = entry?.isIntersecting ? "running" : "paused";
        river.querySelectorAll<HTMLElement>("[data-drift]").forEach((node) => {
          node.style.animationPlayState = state;
        });
      },
      { threshold: 0 },
    );
    observer.observe(river);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(118% 92% at 74% 6%,#262626 0%,#181818 32%,#0D0D0D 66%,#080808 100%)",
        }}
      />
      {/* The light the river is lit by. */}
      <div
        aria-hidden
        data-bloom
        style={{
          position: "absolute",
          left: "38%",
          right: "-18%",
          top: "-24%",
          height: "96%",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(52% 50% at 50% 50%,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0.055) 42%,rgba(255,255,255,0) 72%)",
          filter: "blur(12px)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-12%",
          bottom: "-34%",
          width: "78%",
          height: "70%",
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(50% 50% at 50% 50%,rgba(255,255,255,0.035) 0%,rgba(255,255,255,0) 70%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.5,
          background: "linear-gradient(107deg,rgba(255,255,255,0) 34%,rgba(255,255,255,0.028) 47%,rgba(255,255,255,0) 60%)",
        }}
      />

      <div
        aria-hidden
        data-river
        ref={riverRef}
        style={{
          position: "absolute",
          left: "44%",
          right: "-6%",
          top: 0,
          bottom: "-4%",
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
          // Two masks intersected: the river fades in from the copy side and
          // never touches the panel's top or bottom edge.
          maskImage:
            "linear-gradient(to right,rgba(0,0,0,0) 0,#000 9%),linear-gradient(to bottom,rgba(0,0,0,0) 0,#000 12%,#000 88%,rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to right,rgba(0,0,0,0) 0,#000 9%),linear-gradient(to bottom,rgba(0,0,0,0) 0,#000 12%,#000 88%,rgba(0,0,0,0) 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        {bands.map((band) => (
          <div key={band.key} data-band={band.key} style={{ position: "absolute", inset: 0 }}>
            <div data-drift style={{ position: "absolute", inset: 0, animation: band.animation }}>
              {band.cards.map((card, cardIndex) => (
                <CardTile key={cardIndex} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sits above the river so the headline keeps clean ground under it. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: "radial-gradient(64% 74% at 18% 46%,rgba(8,8,8,0.94) 0%,rgba(8,8,8,0.62) 42%,rgba(8,8,8,0) 74%)",
        }}
      />
      {/* 4% grain, which is what stops the gradients banding on a wide display. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          opacity: 0.05,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}
