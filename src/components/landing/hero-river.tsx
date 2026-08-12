import { useEffect, useMemo, useRef } from "react";

interface Card {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  broken: boolean;
  bars: number;
  delay: number;
}

const BANDS = [
  { name: "far", count: 30, blur: 6, opacity: 0.32, factor: 0.06 },
  { name: "mid", count: 20, blur: 2, opacity: 0.7, factor: 0.14 },
  { name: "near", count: 12, blur: 0, opacity: 1, factor: 0.26 },
] as const;

/** Deterministic pseudo-random so the layout is identical on every render. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildBand(count: number, seed: number): Card[] {
  const random = seeded(seed);

  return Array.from({ length: count }, (_, index) => {
    // Progress along the diagonal decides how healthy a card looks.
    const t = random();
    const drift = (random() - 0.5) * 26;

    return {
      id: index,
      x: t * 118 - 12,
      y: 82 - t * 74 + drift,
      size: 8 + random() * 5,
      hue: 90 + random() * 180,
      broken: t < 0.45,
      bars: Math.floor(random() * 3) + 1,
      delay: random() * -40,
    };
  });
}

function CardTile({ card }: { card: Card }) {
  const background = card.broken
    ? "linear-gradient(150deg, var(--river-dead-1) 0%, var(--river-dead-2) 60%, var(--river-dead-3) 100%)"
    : `linear-gradient(150deg, hsl(${card.hue} 42% 62%) 0%, hsl(${card.hue + 40} 38% 44%) 55%, hsl(${card.hue + 70} 30% 30%) 100%)`;

  return (
    <div
      className="absolute overflow-hidden rounded-lg"
      style={{
        left: `${card.x}%`,
        top: `${card.y}%`,
        width: `${card.size}rem`,
        aspectRatio: "16 / 9",
        background,
        boxShadow: card.broken ? "none" : "0 8px 24px rgb(0 0 0 / 0.45)",
      }}
    >
      {card.broken
        ? Array.from({ length: card.bars }, (_, index) => (
            <span
              key={index}
              className="absolute left-0 w-full bg-[var(--river-bar)]"
              style={{ top: `${18 + index * 26}%`, height: "9%" }}
            />
          ))
        : null}
    </div>
  );
}

/**
 * Three depth bands drifting along a diagonal. Cards on the left are the file
 * that would not open; cards on the right are the same footage, playing.
 * Everything is CSS — no imagery is shipped and nothing is a photograph.
 */
export function HeroRiver() {
  const bands = useMemo(() => BANDS.map((band, index) => ({ ...band, cards: buildBand(band.count, 7 + index * 31) })), []);
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
          <div className="drift absolute inset-0" style={{ animationDelay: `${band.cards[0]?.delay ?? 0}s` }}>
            {band.cards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </div>
        </div>
      ))}

      {/* Keeps the headline on clean ground. */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_8%_55%,var(--backdrop)_0%,transparent_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--panel)] to-transparent" />
    </div>
  );
}
