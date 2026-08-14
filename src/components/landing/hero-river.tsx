import { useEffect, useMemo, useRef } from "react";

interface Card {
  id: number;
  x: number;
  y: number;
  size: number;
  tone: number;
  broken: boolean;
  bars: number;
  chip: boolean;
}

const BANDS = [
  { name: "far", count: 34, blur: 7, opacity: 0.3, factor: 0.06 },
  { name: "mid", count: 22, blur: 3, opacity: 0.65, factor: 0.14 },
  { name: "near", count: 14, blur: 0, opacity: 1, factor: 0.26 },
] as const;

/**
 * Muted, photographic tones rather than vivid hues — these are meant to read as
 * frames of somebody's footage, not as decoration.
 */
const PALETTES = [
  ["#8aa0b4", "#4c5f73", "#2b3742"],
  ["#b9a68d", "#7a6851", "#453a2d"],
  ["#93a898", "#556759", "#313c34"],
  ["#a89aa8", "#6b5f6d", "#3a333c"],
  ["#9fb0bd", "#5d6c78", "#343d45"],
];

/** Deterministic pseudo-random so the layout is identical on every render. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildBand(count: number, seed: number, nearest: boolean): Card[] {
  const random = seeded(seed);

  return Array.from({ length: count }, (_, index) => {
    // Progress along the diagonal decides how healthy a card looks.
    const t = random();
    const drift = (random() - 0.5) * 30;
    const broken = t < 0.42;

    return {
      id: index,
      x: t * 120 - 14,
      y: 88 - t * 78 + drift,
      size: 7 + random() * 8,
      tone: Math.floor(random() * PALETTES.length),
      broken,
      bars: Math.floor(random() * 3) + 2,
      chip: broken && nearest && random() > 0.55,
    };
  });
}

function CardTile({ card }: { card: Card }) {
  const palette = PALETTES[card.tone] ?? PALETTES[0]!;

  return (
    <div
      className="absolute overflow-hidden rounded-lg"
      style={{
        left: `${card.x}%`,
        top: `${card.y}%`,
        width: `${card.size}rem`,
        aspectRatio: "16 / 9",
        background: card.broken
          ? "linear-gradient(150deg, #262626 0%, #1a1a1a 55%, #212121 100%)"
          : `linear-gradient(155deg, ${palette[0]} 0%, ${palette[1]} 52%, ${palette[2]} 100%)`,
        boxShadow: card.broken ? "none" : "0 10px 30px rgb(0 0 0 / 0.5)",
      }}
    >
      {card.broken ? (
        <>
          {Array.from({ length: card.bars }, (_, index) => (
            <span
              key={index}
              className="absolute left-0 w-full bg-[#333]"
              style={{ top: `${14 + index * 21}%`, height: "8%" }}
            />
          ))}
          {card.chip ? (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white/70">
              can't open
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/**
 * Three depth bands drifting along a diagonal. Cards on the left are the file
 * that would not open; cards on the right are the same footage, playing.
 * Everything is CSS — no imagery is shipped and nothing is a photograph.
 */
export function HeroRiver() {
  const bands = useMemo(
    () => BANDS.map((band, index) => ({ ...band, cards: buildBand(band.count, 7 + index * 31, band.name === "near") })),
    [],
  );
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
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bands.map((band, index) => (
        <div
          key={band.name}
          ref={(node) => {
            refs.current[index] = node;
          }}
          className="absolute inset-0"
          style={{ filter: band.blur ? `blur(${band.blur}px)` : undefined, opacity: band.opacity }}
        >
          <div className="drift absolute inset-0">
            {band.cards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </div>
        </div>
      ))}

      {/* Keeps the headline on clean ground. */}
      <div className="absolute inset-0 bg-[radial-gradient(75%_95%_at_2%_50%,var(--backdrop)_0%,rgb(10_10_10/0.85)_38%,transparent_74%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[var(--panel)] to-transparent" />
    </div>
  );
}
