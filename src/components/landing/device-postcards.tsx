import { useRef, type PointerEvent, type ReactNode } from "react";

/** The frame, mid-playback: a play glyph over a still and a part-filled scrubber. */
function Screen({ radius, children }: { radius: string; children?: ReactNode }) {
  return (
    <div className={`device-still relative size-full overflow-hidden ${radius}`}>
      <div
        className="absolute top-1/2 left-1/2 size-0 -translate-x-1/2 -translate-y-1/2"
        style={{
          borderLeft: "11px solid rgb(255 255 255 / 0.92)",
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
        }}
      />
      <div className="absolute right-2 bottom-[9px] left-2 h-0.5 rounded-full bg-white/30">
        <div className="h-full w-[58%] rounded-full bg-ink" />
      </div>
      {children}
    </div>
  );
}

function LockGlyph() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <rect x="1" y="9" width="18" height="12" rx="3" />
      <path d="M5 9V6a5 5 0 0 1 10 0v3" />
      <circle cx="10" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

const CARD = "absolute h-[60%] w-[45%] overflow-hidden rounded-[36px] border border-white/10 bg-[#121212] transition-transform duration-150 ease-[var(--ease)]";
const LABEL = "text-[13px] text-muted";

/**
 * The same video, playing on three devices that would each have rejected the
 * original. The stack fans apart under the pointer and tilts toward it.
 */
export function DevicePostcards() {
  const stackRef = useRef<HTMLDivElement>(null);

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    const stack = stackRef.current;
    if (!stack) return;
    const rect = stack.getBoundingClientRect();
    const x = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    stack.style.transform = `perspective(1200px) rotateY(${(x * 3).toFixed(2)}deg) rotateX(${(-y * 3).toFixed(2)}deg)`;
  };

  const reset = () => {
    if (stackRef.current) stackRef.current.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg)";
  };

  return (
    <div className="relative flex min-h-[540px] items-center justify-center">
      {/* The lock, tethered to the stack it protects. */}
      <div className="absolute top-0 left-[clamp(8px,6vw,80px)] flex flex-col items-center text-on-mesh">
        <div className="flex size-14 items-center justify-center rounded-[14px] border border-on-mesh/35">
          <LockGlyph />
        </div>
        <div className="h-16 w-px bg-on-mesh/35" />
      </div>

      <div
        ref={stackRef}
        data-stack
        className="relative mt-16 aspect-[460/396] w-[min(460px,100%)] transition-transform duration-200 ease-[var(--ease)]"
        onPointerMove={tilt}
        onPointerLeave={reset}
      >
        <div aria-hidden className="halo absolute top-[6%] -left-[6%] h-[96%] w-[112%] rounded-[80px] blur-[50px]" />

        <div data-pc="a" className={`${CARD} top-0 left-0 flex flex-col items-start pt-3.5 pb-[18px]`} style={{ transform: "rotate(-2deg)" }}>
          <div className={`${LABEL} pb-2.5 pl-4`}>iPhone Safari</div>
          <div className="relative min-h-0 w-[104px] flex-1 self-center overflow-hidden rounded-[22px] border border-white/[0.22] bg-[#0C0C0C] p-1">
            <div className="absolute top-[7px] left-1/2 z-[2] h-[5px] w-[34px] -translate-x-1/2 rounded-full bg-white/[0.22]" />
            <Screen radius="rounded-[18px]" />
          </div>
        </div>

        <div data-pc="b" className={`${CARD} top-[17.7%] left-[27.5%] flex flex-col items-start pt-3.5 pb-[18px]`} style={{ transform: "rotate(1.5deg)" }}>
          <div className={`${LABEL} pb-2.5 pl-4`}>Android Chrome</div>
          <div className="relative min-h-0 w-[104px] flex-1 self-center overflow-hidden rounded-[18px] border border-white/[0.22] bg-[#0C0C0C] p-1">
            <div className="absolute top-2 left-1/2 z-[2] size-1.5 -translate-x-1/2 rounded-full bg-white/[0.24]" />
            <Screen radius="rounded-[14px]" />
          </div>
        </div>

        <div
          data-pc="c"
          className={`${CARD} top-[37.9%] left-[55%] flex flex-col items-center justify-center gap-3 px-4 pt-3.5 pb-[18px]`}
          style={{ transform: "rotate(3deg)" }}
        >
          <div className={`${LABEL} self-start pl-1`}>Smart TV</div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px] border border-white/[0.22] bg-[#0C0C0C] p-1">
            <Screen radius="rounded-[7px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
