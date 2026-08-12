const DEVICES = [
  { label: "iPhone Safari", rotate: -2, offset: 0, hue: 196 },
  { label: "Android Chrome", rotate: 1, offset: 44, hue: 158 },
  { label: "Smart TV", rotate: 3, offset: 88, hue: 38 },
];

/**
 * The same video, playing on three devices. Rendered rather than photographed —
 * nothing here pretends to be a real screenshot.
 */
export function DevicePostcards() {
  return (
    <div className="group relative h-[22rem] w-full max-w-md">
      {/* The halo is a blurred copy of the mesh sitting behind the stack. */}
      <div
        aria-hidden
        className="mesh absolute inset-8 rounded-[3rem] opacity-45 blur-[50px] transition-opacity duration-300 ease-[var(--ease)] group-hover:opacity-60"
      />

      {DEVICES.map((device, index) => (
        <figure
          key={device.label}
          className="absolute w-56 overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0d0d0d] p-2 shadow-[0_24px_60px_rgb(0_0_0/0.45)] transition-transform duration-300 ease-[var(--ease)]"
          style={{
            left: `${device.offset}px`,
            top: `${index * 58}px`,
            transform: `rotate(${device.rotate}deg)`,
            zIndex: index,
          }}
        >
          <div
            className="relative flex aspect-video items-center justify-center rounded-[1.5rem]"
            style={{
              background: `linear-gradient(150deg, hsl(${device.hue} 40% 58%) 0%, hsl(${device.hue + 30} 34% 38%) 60%, hsl(${device.hue + 60} 26% 24%) 100%)`,
            }}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="white" aria-hidden>
                <path d="M0 0v14l12-7z" />
              </svg>
            </span>
          </div>
          <figcaption className="px-2 py-2 text-[12px] text-subtle">{device.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
