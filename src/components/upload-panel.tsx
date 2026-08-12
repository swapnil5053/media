import { useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { useUploadMedia } from "@/hooks/use-media";
import { Button } from "./ui/button";
import { Progress } from "./ui/feedback";

const ACCEPT = ".mp4,.mov,.m4v,.mkv,.avi,.webm,.mts,.3gp";

export function UploadPanel({ storageHint }: { storageHint: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const upload = useUploadMedia();

  function send(file: File | undefined) {
    if (!file) return;

    upload.mutate(file, {
      onSuccess: () => toast.success(`${file.name} uploaded`, { description: "Checking what it needs to play everywhere." }),
      onError: (error) =>
        toast.error("Upload failed", { description: error instanceof ApiError ? error.message : "Please try again." }),
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    send(event.dataTransfer.files[0]);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-card border border-dashed px-5 py-6 transition-colors duration-150 ${
        isDragging ? "border-line-strong bg-raised" : "border-line bg-panel"
      }`}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-raised text-muted">
          <UploadCloud size={18} aria-hidden />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-ink">Drop a video here, straight off your phone</p>
          <p className="mt-0.5 text-[13px] text-muted">
            iPhone .MOV, Android .MP4, camera .MKV — {storageHint}
          </p>
        </div>

        <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? "Uploading…" : "Choose file"}
        </Button>
      </div>

      {upload.isPending ? (
        <div className="mt-4">
          <Progress value={upload.uploadProgress} label="Upload progress" />
          <p className="mt-1.5 text-[13px] text-muted">
            {Math.round(upload.uploadProgress * 100)}% uploaded
            {upload.variables ? ` · ${formatBytes(upload.variables.size)}` : ""}
          </p>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          send(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
