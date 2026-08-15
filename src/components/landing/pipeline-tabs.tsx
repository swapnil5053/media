import { useId, useState, type KeyboardEvent } from "react";
import { ApiDiagram, IsometricPipeline, LadderDiagram, SharingDiagram } from "@/components/landing/diagrams";
import { ButtonAnchor } from "@/components/ui/button";
import { DOCS } from "@/lib/links";

const STEPS = [
  {
    title: "Compatibility engine",
    body: "Every file is probed with ffprobe and scored against six real playback targets. You see exactly which devices your original would have failed on, and why.",
    panel: <IsometricPipeline />,
  },
  {
    title: "Adaptive delivery",
    body: "One ffmpeg pass builds an HLS ladder at 1080p, 720p and 360p, skipping anything above the source height. Native HLS on Safari, hls.js everywhere else, progressive MP4 as the floor.",
    panel: <LadderDiagram />,
  },
  {
    title: "Secure sharing",
    body: "Passwords, expiry and view limits enforced on the server. Opening a link grants short-lived access scoped to one video, so knowing the URL is never enough.",
    panel: <SharingDiagram />,
  },
  {
    title: "Developer API",
    body: "Upload with a bearer token. Get an HMAC-signed webhook when it's ready. Retries use exponential backoff with jitter.",
    panel: <ApiDiagram />,
  },
] as const;

export function PipelineTabs() {
  const [open, setOpen] = useState(0);
  const id = useId();

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = STEPS.length - 1;
    const moves: Record<string, number | undefined> = {
      ArrowDown: (index + 1) % STEPS.length,
      ArrowRight: (index + 1) % STEPS.length,
      ArrowUp: (index + last) % STEPS.length,
      ArrowLeft: (index + last) % STEPS.length,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setOpen(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className="mt-[clamp(40px,5vw,64px)] flex flex-wrap items-stretch gap-[clamp(28px,4vw,56px)]">
      <div
        role="tablist"
        aria-label="How it works"
        aria-orientation="vertical"
        className="flex min-w-[280px] flex-[0_1_360px] flex-col gap-1.5 border-l border-line pl-8"
      >
        {STEPS.map((step, index) => {
          const selected = index === open;
          return (
            <div key={step.title} className="py-0.5">
              <button
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                tabIndex={selected ? 0 : -1}
                data-acc-head={String(selected)}
                onClick={() => setOpen(index)}
                onKeyDown={onKeyDown(index)}
                className="flex w-full cursor-pointer items-center gap-3.5 rounded-[10px] px-[18px] py-3.5 text-left text-[16px]"
              >
                <span className="tabular-nums">{index + 1}.</span>
                <span>{step.title}</span>
              </button>

              {selected ? (
                <div className="max-w-[380px] px-[18px] pt-1.5 pb-[22px]">
                  <p className="text-[15px] leading-[1.55] text-muted text-pretty">{step.body}</p>
                  <ButtonAnchor
                    href={DOCS.internals}
                    arrow
                    className="pill mt-5 h-10 gap-2.5 border-white/20 px-5 text-sm hover:border-white/45 hover:bg-transparent"
                  >
                    Learn more
                  </ButtonAnchor>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        data-lift
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${open}`}
        className="relative min-h-[640px] min-w-[300px] flex-[1_1_520px] overflow-hidden rounded-[20px] border border-line bg-raised p-[clamp(22px,2.4vw,32px)]"
      >
        {STEPS[open]?.panel}
      </div>
    </div>
  );
}
