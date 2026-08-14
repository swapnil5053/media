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

const STILLS = [
  "f01", "f02", "f03", "f04", "f05", "f06", "f07", "f09", "f10", "f11", "f12",
].map((name) => `/stills/${name}.jpg`);

const BANDS = [
  { key: "far", count: 34, width: 62, base: 60, opacity: 0.35, blur: "blur(6px)", animation: "riverFar 38s cubic-bezier(0.37,0,0.63,1) infinite alternate", factor: 0.06 },
  { key: "mid", count: 24, width: 104, base: 78, opacity: 0.7, blur: "blur(2px)", animation: "riverMid 33s cubic-bezier(0.37,0,0.63,1) infinite alternate", factor: 0.14 },
  { key: "near", count: 16, width: 168, base: 96, opacity: 1, blur: "none", animation: "riverNear 40s cubic-bezier(0.37,0,0.63,1) infinite alternate", factor: 0.26 },
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
 * Three depth bands of real frames drifting along a diagonal. Cards on the left
 * are desaturated, torn by dropped-frame bars and labelled "can't open"; toward
 * the right they gain colour, a play glyph and a progress bar.
 */
export function HeroRiver() {
  const bands = useMemo(buildBands, []);
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY, 900);
        refs.current.forEach((node, index) => {
          const factor = BANDS[index]?.factor ?? 0;
          if (node) node.style.transform = `translate3d(0, ${Math.min(offset * factor, 120)}px, 0)`;
        });
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {bands.map((band, index) => (
        <div
          key={band.key}
          ref={(node) => {
            refs.current[index] = node;
          }}
          style={{ position: "absolute", inset: 0 }}
        >
          <div className="river-drift" style={{ position: "absolute", inset: 0, animation: band.animation }}>
            {band.cards.map((card, cardIndex) => (
              <CardTile key={cardIndex} card={card} />
            ))}
          </div>
        </div>
      ))}

      {/* Keeps the headline on clean ground. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(70% 90% at 0% 50%, #0C0C0C 0%, rgba(12,12,12,0.86) 34%, transparent 72%)",
        }}
      />
    </div>
  );
}
