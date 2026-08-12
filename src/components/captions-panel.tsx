import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CaptionTrack } from "@shared/types";
import { ApiError } from "@/lib/api";
import { useAddCaption, useDeleteCaption } from "@/hooks/use-media";
import { Button } from "./ui/button";
import { Card, CardHeader } from "./ui/card";
import { Input } from "./ui/input";

export function CaptionsPanel({ mediaId, captions }: { mediaId: string; captions: CaptionTrack[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("English");
  const [language, setLanguage] = useState("en");
  const addCaption = useAddCaption(mediaId);
  const deleteCaption = useDeleteCaption(mediaId);

  return (
    <Card>
      <CardHeader
        title="Captions"
        description="Upload a .srt or .vtt file. SubRip is converted to WebVTT so browsers can render it."
      />

      {captions.length > 0 ? (
        <ul className="divide-y divide-line border-b border-line">
          {captions.map((caption) => (
            <li key={caption.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-sm text-ink">{caption.label}</span>
              <span className="font-mono text-[13px] text-muted">{caption.language}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                aria-label={`Remove ${caption.label} captions`}
                onClick={() => deleteCaption.mutate(caption.id)}
              >
                <Trash2 size={15} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 px-5 py-4">
        <div className="w-32">
          <label className="mb-2 block text-[13px] text-muted" htmlFor="caption-label">
            Label
          </label>
          <Input id="caption-label" value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        <div className="w-20">
          <label className="mb-2 block text-[13px] text-muted" htmlFor="caption-language">
            Code
          </label>
          <Input id="caption-language" value={language} onChange={(event) => setLanguage(event.target.value)} />
        </div>

        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={addCaption.isPending}>
          {addCaption.isPending ? "Uploading…" : "Add caption file"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".srt,.vtt,text/vtt"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;

            addCaption.mutate(
              { file, label, language },
              {
                onSuccess: () => toast.success(`${label} captions added`),
                onError: (error) =>
                  toast.error("Could not add captions", {
                    description: error instanceof ApiError ? error.message : "Please try again.",
                  }),
              },
            );
          }}
        />
      </div>
    </Card>
  );
}
