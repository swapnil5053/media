import { Check, X } from "lucide-react";
import type { CompatibilityReport as Report } from "@shared/types";
import { Card } from "./ui/card";

function Row({ label, supported, reason }: { label: string; supported: boolean; reason: string }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
          supported ? "bg-positive-soft text-positive" : "bg-critical-soft text-critical"
        }`}
      >
        {supported ? <Check size={11} aria-hidden /> : <X size={11} aria-hidden />}
      </span>
      <span className="min-w-0 text-[13px]">
        <span className="text-ink">{label}</span>
        {!supported ? <span className="text-muted"> — {reason}</span> : null}
      </span>
    </li>
  );
}

/**
 * The screen that explains the whole product: what the original file could not
 * reach, and what the delivered copy can.
 */
export function CompatibilityReport({ report, wasConverted }: { report: Report; wasConverted: boolean }) {
  const blocked = report.targets.filter((target) => !target.supported);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">Where this video plays</h2>
        <p className="mt-1 text-[13px] text-muted">{report.summary}</p>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-2">
        <div className="bg-surface px-5 py-4">
          <p className="text-[13px] font-medium text-muted">You uploaded</p>
          <p className="mt-1 font-mono text-[13px] text-ink">{report.sourceLabel}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
            {report.sourceScore}
            <span className="text-base font-normal text-muted"> / 100 devices</span>
          </p>
          <ul className="mt-3">
            {report.targets.map((target) => (
              <Row key={target.id} label={target.label} supported={target.supported} reason={target.reason} />
            ))}
          </ul>
        </div>

        <div className="bg-surface px-5 py-4">
          <p className="text-[13px] font-medium text-muted">We deliver</p>
          <p className="mt-1 font-mono text-[13px] text-ink">{report.deliveryLabel}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-positive">
            {report.deliveryScore}
            <span className="text-base font-normal text-muted"> / 100 devices</span>
          </p>
          <p className="mt-3 text-[13px] text-muted">
            {wasConverted
              ? `Everyone you share this with gets the converted copy${
                  blocked.length > 0 ? `, including people on ${blocked.map((target) => target.label).join(" and ")}` : ""
                }.`
              : "Your original already worked everywhere, so nothing was re-encoded — we only packaged it for streaming."}
          </p>
        </div>
      </div>
    </Card>
  );
}
