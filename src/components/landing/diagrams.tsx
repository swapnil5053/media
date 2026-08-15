import type { ReactNode } from "react";
import { LockGlyph } from "@/components/landing/lock-glyph";

/**
 * A labelled note pinned to a corner of a diagram: a chip, a short stem, and
 * one line of plain language. The stem is what ties the claim to the drawing.
 */
function Callout({
  label,
  children,
  align = "start",
  className,
}: {
  label: string;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const end = align === "end";
  return (
    <div
      className={`flex max-w-[210px] flex-col gap-2 ${end ? "items-end text-right" : "items-start"} ${className ?? ""}`}
    >
      <span className="rounded-full border border-white/25 bg-raised/90 px-2.5 py-1 text-[12px] tracking-[0.08em] text-ink uppercase">
        {label}
      </span>
      <div className={`h-5 w-px bg-white/20 ${end ? "mr-[22px]" : "ml-[22px]"}`} />
      <p className="text-[13px] leading-[1.4] text-muted">{children}</p>
    </div>
  );
}

/** Step 1 — the compatibility pass, drawn as crates travelling up a conveyor. */
export function IsometricPipeline() {
  return (
    <div className="swap-in relative h-full min-h-[596px]">
      <svg
        viewBox="0 0 660 600"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 block h-full w-full"
        role="img"
        aria-label="Isometric pipeline: upload, probe, transcode, package, deliver"
      >
        <g className="wire">
          <path d="M46 470 L330 302 L620 138" />
          <path d="M46 524 L330 356 L620 192" />
          <path d="M46 470 L46 524 M330 302 L330 356 M620 138 L620 192" />
          <g transform="translate(54 396)">
            <path data-node d="M0 48 L52 18 L104 48 L52 78 Z" />
            <path d="M0 48 L0 76 L52 106 L52 78 Z" />
            <path d="M104 48 L104 76 L52 106 L52 78 Z" />
            <path className="wire-faint" d="M18 48 L52 28 L86 48" />
          </g>
          <g transform="translate(182 322)">
            <path data-node d="M0 48 L52 18 L104 48 L52 78 Z" />
            <path d="M0 48 L0 76 L52 106 L52 78 Z" />
            <path d="M104 48 L104 76 L52 106 L52 78 Z" />
          </g>
          <g transform="translate(300 236)">
            <path data-node d="M0 52 L70 12 L140 52 L70 92 Z" />
            <path d="M0 52 L0 90 L70 130 L70 92 Z" />
            <path d="M140 52 L140 90 L70 130 L70 92 Z" />
            <path className="wire-faint" d="M18 52 L70 22 L122 52 M0 70 L70 110 L140 70" />
          </g>
          <g transform="translate(438 176)">
            <path data-node d="M0 48 L52 18 L104 48 L52 78 Z" />
            <path d="M0 48 L0 76 L52 106 L52 78 Z" />
            <path d="M104 48 L104 76 L52 106 L52 78 Z" />
          </g>
          <g transform="translate(546 116)">
            <path data-node d="M0 48 L52 18 L104 48 L52 78 Z" />
            <path d="M0 48 L0 76 L52 106 L52 78 Z" />
            <path d="M104 48 L104 76 L52 106 L52 78 Z" />
            <path className="wire-faint" d="M18 48 L52 28 L86 48" />
          </g>
          <g className="wire-soft">
            <path d="M234 348 L234 300 L288 268" />
            <path d="M370 262 L370 214 L424 184" />
            <path d="M490 202 L490 158 L544 128" />
          </g>
        </g>

        {/* Frames climbing the belt. */}
        <g style={{ animation: "particles 9s linear infinite" }} opacity="0.9">
          <rect x="120" y="440" width="5" height="5" rx="1" fill="var(--mesh-mint)" />
          <rect x="176" y="408" width="4" height="4" rx="1" fill="var(--mesh-seafoam)" />
          <rect x="230" y="376" width="5" height="5" rx="1" fill="var(--mesh-citron)" />
          <rect x="286" y="344" width="4" height="4" rx="1" fill="var(--mesh-mint)" />
          <rect x="344" y="312" width="5" height="5" rx="1" fill="var(--mesh-seafoam)" />
          <rect x="400" y="278" width="4" height="4" rx="1" fill="var(--mesh-mint)" />
          <rect x="456" y="246" width="5" height="5" rx="1" fill="var(--mesh-citron)" />
        </g>

        <g className="wire-label" fontSize="17" letterSpacing="1.4">
          <text x="56" y="536">UPLOAD</text>
          <text x="184" y="462">PROBE</text>
          <text x="302" y="392">TRANSCODE</text>
          <text x="440" y="316">PACKAGE</text>
          <text x="548" y="256">DELIVER</text>
        </g>
      </svg>

      <Callout label="Speed" className="absolute top-0 left-0">
        A one-minute clip is ready in seconds.
      </Callout>
      <Callout label="Coverage" align="end" className="absolute top-0 right-0 max-w-[200px]">
        Six device families checked on every upload.
      </Callout>
      <Callout label="Accuracy" className="absolute bottom-0 left-0 max-w-[200px]">
        Scored against real playback targets, never a codec whitelist.
      </Callout>
      <Callout label="Reach" align="end" className="absolute right-0 bottom-0 max-w-[200px]">
        One link, delivered to whatever the viewer is holding.
      </Callout>
    </div>
  );
}

/** Step 2 — one source fanning out into the renditions and the sidecars. */
export function LadderDiagram() {
  return (
    <div className="swap-in flex h-full min-h-[596px] flex-col gap-[26px]">
      <div className="grid gap-[22px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <Callout label="Ladder">Three renditions, one pass.</Callout>
        <Callout label="Integrity">Perceptual hashing catches re-uploads.</Callout>
      </div>

      <svg
        viewBox="0 0 620 400"
        preserveAspectRatio="xMidYMid meet"
        className="block min-h-0 w-full flex-1"
        role="img"
        aria-label="One source branching into 1080p, 720p, 360p, poster and sprite outputs"
      >
        <g className="wire">
          <rect data-node x="20" y="176" width="128" height="48" rx="10" />
          <path d="M148 200 L214 200" />
          <path d="M214 200 L214 44 M214 200 L214 122 M214 200 L214 278 M214 200 L214 356" />
          <path d="M214 44 L276 44 M214 122 L276 122 M214 200 L276 200 M214 278 L276 278 M214 356 L276 356" />
          <rect data-node x="276" y="22" width="150" height="44" rx="10" />
          <rect data-node x="276" y="100" width="150" height="44" rx="10" />
          <rect data-node x="276" y="178" width="150" height="44" rx="10" />
          <rect data-node x="276" y="256" width="150" height="44" rx="10" />
          <rect data-node x="276" y="334" width="150" height="44" rx="10" />
          <path className="wire-soft" d="M426 44 L498 44 M426 122 L498 122 M426 200 L498 200" />
          <path className="wire-soft" d="M498 44 L556 44 M498 44 L498 200 M498 200 L556 200" />
          <rect className="wire-soft" x="556" y="100" width="44" height="44" rx="10" />
        </g>
        <g className="wire-dot">
          <circle cx="214" cy="44" r="3.5" />
          <circle cx="214" cy="122" r="3.5" />
          <circle cx="214" cy="200" r="3.5" />
          <circle cx="214" cy="278" r="3.5" />
          <circle cx="214" cy="356" r="3.5" />
        </g>
        <g className="wire-label" fontSize="13">
          <text x="38" y="205">SOURCE</text>
          <text x="296" y="49">1080p</text>
          <text x="296" y="127">720p</text>
          <text x="296" y="205">360p</text>
          <text x="296" y="283">POSTER</text>
          <text x="296" y="361">SPRITE</text>
        </g>
        <g className="wire-label-soft" fontSize="11">
          <text x="562" y="127">HLS</text>
        </g>
      </svg>
    </div>
  );
}

const SECURE_FLOW = [
  ["Link", "One share link per video, revocable at any time."],
  ["Password", "Hashed with bcrypt and checked server-side."],
  ["Expiry", "Time limit and view limit, both enforced on the server."],
  ["Scoped access", "Opening a link grants short-lived access to that one video."],
] as const;

/** Step 3 — what a share link actually checks, in the order it checks it. */
export function SharingDiagram() {
  return (
    <div className="swap-in flex h-full min-h-[596px] flex-col justify-center gap-[34px]">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/[0.28] text-ink">
        <LockGlyph size={24} />
      </div>

      <div className="flex flex-col">
        {SECURE_FLOW.map(([label, text]) => (
          <div key={label} className="flex items-start gap-[18px]">
            <div className="flex flex-col items-center pt-1.5">
              <span className="size-[7px] rounded-full bg-positive" />
              <span className="h-[76px] w-px bg-white/[0.18]" />
            </div>
            <div className="pb-3.5">
              <div className="text-[12px] tracking-[0.08em] text-subtle uppercase">{label}</div>
              <div className="mt-1 text-[15px] leading-[1.5] text-ink/[0.86]">{text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const WEBHOOK_EVENTS = [
  ["video.ready", "Renditions packaged and playable"],
  ["video.failed", "Job exhausted its attempts"],
] as const;

/** Step 4 — the same upload, done from a script. */
export function ApiDiagram() {
  return (
    <div className="swap-in flex h-full min-h-[596px] flex-col gap-[22px]">
      <div className="shrink-0 overflow-hidden rounded-[20px] border border-line bg-sunken">
        <div className="flex items-center gap-2.5 border-b border-line px-[18px] py-3.5">
          <span className="rounded-full border border-white/[0.16] px-3 py-1 text-[12px] tracking-[0.04em] text-muted">
            upload.sh
          </span>
        </div>
        <div className="flex overflow-x-auto px-[18px] py-5 font-mono text-[12.5px] leading-[1.6]">
          <div className="flex shrink-0 flex-col pr-4 text-right text-white/[0.28] select-none">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
          <div className="flex min-w-0 flex-col whitespace-pre text-ink/[0.86]">
            <div>
              curl -X POST <span className="text-code-string">https://adaptflow.app/api/media</span> \
            </div>
            <div>
              {"  "}-H <span className="text-code-string">"Authorization: Bearer af_live_..."</span> \
            </div>
            <div>
              {"  "}-F <span className="text-code-string">"file=@holiday.mov"</span>
            </div>
            <div className="h-[1.6em]" />
            <div className="text-code-comment"># → 202 Accepted</div>
            <div className="text-code-comment"># → webhook video.ready, HMAC-signed</div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[18px] rounded-[20px] border border-line bg-sunken p-[22px]">
        <div className="text-[12px] tracking-[0.08em] text-subtle uppercase">Webhook events</div>
        <div className="flex flex-col">
          {WEBHOOK_EVENTS.map(([event, meaning]) => (
            <div key={event} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
              <span className="font-mono text-[12.5px] text-ink/[0.86]">{event}</span>
              <span className="text-right text-[13px] text-muted">{meaning}</span>
            </div>
          ))}
        </div>
        <p className="mt-auto max-w-[420px] text-[13px] leading-[1.5] text-subtle">
          Every delivery is HMAC-signed. Retries use exponential backoff with jitter, so an endpoint that blinks does
          not lose an event.
        </p>
      </div>
    </div>
  );
}

function DiagramCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div data-lift className="rounded-[20px] border border-line bg-raised p-[clamp(24px,3vw,34px)]">
      <div className="text-[12px] tracking-[0.08em] text-subtle uppercase">{label}</div>
      {children}
    </div>
  );
}

/** What one upload turns into. */
function PipelineDiagram() {
  return (
    <svg
      viewBox="0 0 560 420"
      className="mt-6 block h-auto w-full"
      role="img"
      aria-label="Pipeline: source file, probe, transcode, package, branching to MP4, HLS ladder, poster, sprite and fingerprint"
    >
      <g className="wire">
        <rect data-node x="12" y="24" width="150" height="42" rx="10" />
        <rect data-node x="12" y="102" width="150" height="42" rx="10" />
        <rect data-node x="12" y="180" width="150" height="42" rx="10" />
        <rect data-node x="12" y="258" width="150" height="42" rx="10" />
        <path d="M87 66 L87 102 M87 144 L87 180 M87 222 L87 258" />
        <path d="M162 279 L232 279 M232 279 L232 45 M232 279 L232 123 M232 279 L232 201 M232 279 L232 357" />
        <path d="M232 45 L300 45 M232 123 L300 123 M232 201 L300 201 M232 279 L300 279 M232 357 L300 357" />
        <rect data-node x="300" y="24" width="150" height="42" rx="10" />
        <rect data-node x="300" y="102" width="150" height="42" rx="10" />
        <rect data-node x="300" y="180" width="150" height="42" rx="10" />
        <rect data-node x="300" y="258" width="150" height="42" rx="10" />
        <rect data-node x="300" y="336" width="150" height="42" rx="10" />
      </g>
      <g className="wire-dot">
        <circle cx="232" cy="45" r="3.5" />
        <circle cx="232" cy="123" r="3.5" />
        <circle cx="232" cy="201" r="3.5" />
        <circle cx="232" cy="279" r="3.5" />
        <circle cx="232" cy="357" r="3.5" />
      </g>
      <g className="wire-label" fontSize="14">
        <text x="28" y="50">SOURCE FILE</text>
        <text x="28" y="128">PROBE</text>
        <text x="28" y="206">TRANSCODE</text>
        <text x="28" y="284">PACKAGE</text>
        <text x="316" y="50">MP4</text>
        <text x="316" y="128">HLS LADDER</text>
        <text x="316" y="206">POSTER</text>
        <text x="316" y="284">SPRITE</text>
        <text x="316" y="362">FINGERPRINT</text>
      </g>
    </svg>
  );
}

/** What happens when one of those steps falls over. */
function QueueDiagram() {
  return (
    <svg
      viewBox="0 0 560 420"
      className="mt-6 block h-auto w-full"
      role="img"
      aria-label="Queue: enqueue, claim, run, with a retry arc through backoff and a cancel branch"
    >
      <g className="wire">
        <rect data-node x="24" y="40" width="140" height="42" rx="10" />
        <rect data-node x="24" y="150" width="140" height="42" rx="10" />
        <rect data-node x="24" y="260" width="140" height="42" rx="10" />
        <path d="M94 82 L94 150 M94 192 L94 260" />
        <rect data-node x="330" y="150" width="150" height="42" rx="10" />
        <path d="M164 281 C 300 281 405 260 405 192" />
        <path d="M405 150 C 405 90 300 61 168 61" />
        <path d="M168 61 L178 55 M168 61 L178 67" />
        <path d="M164 350 L250 350" />
        <rect className="wire-soft" x="250" y="329" width="140" height="42" rx="10" />
        <path className="wire-soft" d="M94 302 L94 350 L164 350" />
      </g>
      <g className="wire-dot">
        <circle cx="94" cy="116" r="3.5" />
        <circle cx="94" cy="226" r="3.5" />
        <circle cx="405" cy="226" r="3.5" />
        <circle cx="207" cy="350" r="3.5" />
      </g>
      <g className="wire-label" fontSize="14">
        <text x="40" y="66">ENQUEUE</text>
        <text x="40" y="176">CLAIM</text>
        <text x="40" y="286">RUN</text>
        <text x="346" y="176">BACKOFF</text>
        <text x="266" y="355">CANCEL</text>
      </g>
      <g className="wire-label-soft" fontSize="12">
        <text x="212" y="112">ATTEMPT 1 / 2 / 3</text>
      </g>
    </svg>
  );
}

export function ArchitectureDiagrams() {
  return (
    <div className="grid gap-[clamp(20px,3vw,32px)] [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
      <DiagramCard label="The pipeline">
        <PipelineDiagram />
      </DiagramCard>
      <DiagramCard label="The queue">
        <QueueDiagram />
      </DiagramCard>
    </div>
  );
}
