import type { ReactNode } from "react";

const STROKE = "var(--line-strong)";

function Node({ x, y, w = 92, h = 30, label }: { x: number; y: number; w?: number; h?: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={7} fill="none" stroke={STROKE} />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill="var(--muted)"
        style={{ fontSize: 10, letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </text>
    </g>
  );
}

const Edge = ({ d }: { d: string }) => <path d={d} fill="none" stroke={STROKE} strokeDasharray="2 3" />;

export function Callout({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <span className="inline-block rounded-md border border-line px-2 py-0.5 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
        {label}
      </span>
      <p className="mt-2 max-w-[16rem] text-[13px] text-muted">{value}</p>
    </div>
  );
}

export function DiagramFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[22rem] rounded-card border border-line bg-raised p-6">{children}</div>
  );
}

/** upload → probe → transcode → package → deliver */
export function PipelineDiagram() {
  return (
    <DiagramFrame>
      <Callout label="Speed" value="A one-minute clip is ready in seconds." className="absolute top-6 left-6" />
      <Callout
        label="Coverage"
        value="Six device families checked on every upload."
        className="absolute top-6 right-6 text-right"
      />

      <svg viewBox="0 0 520 120" className="absolute inset-x-6 top-1/2 -translate-y-1/2" role="img" aria-label="Upload, probe, transcode, package, deliver">
        <Node x={0} y={45} label="UPLOAD" />
        <Edge d="M92 60 H124" />
        <Node x={124} y={45} label="PROBE" />
        <Edge d="M216 60 H248" />
        <Node x={248} y={45} label="TRANSCODE" />
        <Edge d="M340 60 H372" />
        <Node x={372} y={45} label="PACKAGE" />
        <Edge d="M464 60 H496" />
        <circle cx={504} cy={60} r={5} fill="none" stroke={STROKE} />
      </svg>

      <p className="absolute right-6 bottom-6 text-[13px] text-subtle">One link, delivered to whatever opens it.</p>
    </DiagramFrame>
  );
}

/** source → three renditions → one playlist */
export function LadderDiagram() {
  return (
    <DiagramFrame>
      <Callout label="Ladder" value="Three renditions, built in a single pass." className="absolute top-6 left-6" />

      <svg viewBox="0 0 460 200" className="absolute inset-x-6 top-1/2 -translate-y-1/2" role="img" aria-label="Source splits into 1080p, 720p and 360p, then one playlist">
        <Node x={0} y={85} label="SOURCE" />
        <Edge d="M92 100 H140 M140 40 V160 M140 40 H176 M140 100 H176 M140 160 H176" />
        <Node x={176} y={25} label="1080p" />
        <Node x={176} y={85} label="720p" />
        <Node x={176} y={145} label="360p" />
        <Edge d="M268 40 H312 M268 100 H312 M268 160 H312 M312 40 V160 M312 100 H352" />
        <Node x={352} y={85} w={80} label="HLS" />
      </svg>

      <p className="absolute right-6 bottom-6 max-w-[15rem] text-right text-[13px] text-subtle">
        Nothing above the source height is ever upscaled.
      </p>
    </DiagramFrame>
  );
}

const SHARING = [
  ["Link", "One share link per video, revocable at any time."],
  ["Password", "Hashed, and checked on the server."],
  ["Expiry", "Time limit and view limit, both enforced server-side."],
  ["Scope", "Opening a link grants access to that one video only."],
];

export function SharingDiagram() {
  return (
    <DiagramFrame>
      <div className="mb-6 flex size-9 items-center justify-center rounded-lg border border-line text-muted">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </div>

      <dl className="space-y-4">
        {SHARING.map(([term, detail]) => (
          <div key={term} className="border-l border-line pl-4">
            <dt className="font-mono text-[11px] tracking-[0.08em] text-subtle uppercase">{term}</dt>
            <dd className="mt-1 text-[13px] text-muted">{detail}</dd>
          </div>
        ))}
      </dl>
    </DiagramFrame>
  );
}

const CODE = `curl -X POST https://adaptflow.app/api/media \\
  -H "Authorization: Bearer af_live_..." \\
  -F "file=@holiday.mov"

# 202 Accepted
# webhook video.ready, HMAC-signed`;

export function ApiDiagram() {
  return (
    <DiagramFrame>
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-2">
          <span className="font-mono text-[11px] text-subtle">upload.sh</span>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed text-muted">{CODE}</pre>
      </div>

      <div className="mt-5 space-y-2">
        {[
          ["video.ready", "Renditions packaged and playable"],
          ["video.failed", "Delivered after the final retry"],
        ].map(([event, detail]) => (
          <div key={event} className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
            <span className="font-mono text-[12.5px] text-ink">{event}</span>
            <span className="text-[13px] text-subtle">{detail}</span>
          </div>
        ))}
      </div>
    </DiagramFrame>
  );
}

/** The two hairline graphs in the infrastructure section. */
export function ArchitectureDiagrams() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-card border border-line bg-raised p-6">
        <p className="font-mono text-[11px] tracking-[0.08em] text-subtle uppercase">The pipeline</p>
        <svg viewBox="0 0 300 210" className="mt-5 w-full" role="img" aria-label="Source file becomes MP4, HLS ladder, poster, sprite and fingerprint">
          {["SOURCE FILE", "PROBE", "TRANSCODE", "PACKAGE"].map((label, index) => (
            <Node key={label} x={0} y={index * 50} w={104} h={30} label={label} />
          ))}
          <Edge d="M104 15 H150 M150 15 V180 M150 15 H196 M150 65 H196 M150 115 H196 M150 165 H196" />
          {["MP4", "HLS LADDER", "POSTER", "SPRITE"].map((label, index) => (
            <Node key={label} x={196} y={index * 50} w={104} h={30} label={label} />
          ))}
        </svg>
      </div>

      <div className="rounded-card border border-line bg-raised p-6">
        <p className="font-mono text-[11px] tracking-[0.08em] text-subtle uppercase">The queue</p>
        <svg viewBox="0 0 300 210" className="mt-5 w-full" role="img" aria-label="Enqueue, claim, run, done, with a backoff retry loop">
          <Node x={0} y={90} w={90} label="ENQUEUE" />
          <Edge d="M90 105 H115" />
          <Node x={115} y={90} w={70} label="CLAIM" />
          <Edge d="M185 105 H210" />
          <Node x={210} y={90} w={70} label="RUN" />
          <path d="M245 90 C245 40 150 40 150 85" fill="none" stroke={STROKE} strokeDasharray="2 3" />
          <text x={198} y={35} textAnchor="middle" fill="var(--subtle)" style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
            BACKOFF · 1 / 2 / 3
          </text>
          <Edge d="M245 120 V160 H150" />
          <Node x={60} y={145} w={90} label="DONE" />
        </svg>
      </div>
    </div>
  );
}
