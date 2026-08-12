import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "../ui/button";
import { ApiDiagram, LadderDiagram, PipelineDiagram, SharingDiagram } from "./diagrams";

interface Item {
  title: string;
  body: string;
  panel: ReactNode;
}

const ITEMS: Item[] = [
  {
    title: "Compatibility engine",
    body: "Every file is read and scored against six real playback targets. You see exactly which devices your original would have failed on, and why.",
    panel: <PipelineDiagram />,
  },
  {
    title: "Adaptive delivery",
    body: "One pass builds a 1080p, 720p and 360p ladder, skipping anything above the source height. Phones on patchy data get a smaller rendition instead of a spinner.",
    panel: <LadderDiagram />,
  },
  {
    title: "Secure sharing",
    body: "Passwords, expiry and view limits are enforced on the server. Opening a link grants short-lived access to that one video, so knowing the URL is never enough.",
    panel: <SharingDiagram />,
  },
  {
    title: "Developer API",
    body: "Upload with a bearer token and get a signed webhook when the video is ready. Failed deliveries retry on their own.",
    panel: <ApiDiagram />,
  },
];

/**
 * Numbered list on the left, a panel on the right that swaps entirely. The swap
 * is deliberately fast — anything slower than about 120ms reads as sluggish.
 */
export function PipelineTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
      <div role="tablist" aria-label="How AdaptFlow works" className="space-y-1">
        {ITEMS.map((item, index) => {
          const selected = index === active;
          return (
            <div key={item.title}>
              <button
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`pipeline-panel-${index}`}
                id={`pipeline-tab-${index}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") setActive((current) => (current + 1) % ITEMS.length);
                  if (event.key === "ArrowUp") setActive((current) => (current - 1 + ITEMS.length) % ITEMS.length);
                }}
                className={cn(
                  "flex w-full items-baseline gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors duration-150 ease-[var(--ease)]",
                  selected ? "bg-raised text-ink" : "text-subtle hover:text-ink",
                )}
              >
                <span className="font-mono text-[13px] tabular-nums">{index + 1}.</span>
                <span className="text-[15px]">{item.title}</span>
              </button>

              {selected ? (
                <div className="px-3.5 pt-2 pb-4">
                  <p className="max-w-sm text-sm text-muted">{item.body}</p>
                  <Button variant="secondary" size="sm" arrow className="mt-4">
                    Learn more
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        key={active}
        id={`pipeline-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`pipeline-tab-${active}`}
        className="animate-[enter_100ms_var(--ease)]"
      >
        {ITEMS[active]?.panel}
      </div>
    </div>
  );
}
