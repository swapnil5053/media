import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import type { WatchPayload } from "@shared/types";
import { ApiError, api } from "@/lib/api";
import { VideoPlayer } from "@/components/video-player";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/feedback";

type State =
  | { kind: "loading" }
  | { kind: "password"; message: string }
  | { kind: "ready"; video: WatchPayload }
  | { kind: "error"; message: string };

export function Watch() {
  const { slug = "" } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);

  async function open(withPassword?: string) {
    try {
      const video = await api.post<WatchPayload>(`/shares/${slug}/open`, { password: withPassword });
      setState({ kind: "ready", video });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setState({ kind: "password", message: withPassword ? error.message : "" });
        return;
      }
      setState({ kind: "error", message: error instanceof ApiError ? error.message : "This link could not be opened." });
    }
  }

  useEffect(() => {
    void open();
    // The slug is the only input; re-running on every render would burn a view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setChecking(true);
    await open(password);
    setChecking(false);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line px-6 py-4">
        <Logo />
      </header>

      <main className="page-enter mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        {state.kind === "loading" ? <Skeleton className="aspect-video w-full" /> : null}

        {state.kind === "password" ? (
          <form onSubmit={submitPassword} className="mx-auto w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-sunken text-muted">
              <Lock size={18} aria-hidden />
            </div>
            <h1 className="display text-2xl">This video is protected</h1>
            <p className="mt-1.5 text-sm text-muted">Enter the password you were given.</p>

            <div className="mt-6 text-left">
              <Field label="Password" error={state.message || undefined}>
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                )}
              </Field>
            </div>

            <Button type="submit" className="mt-4 w-full" disabled={checking || !password}>
              {checking ? "Checking…" : "Watch video"}
            </Button>
          </form>
        ) : null}

        {state.kind === "error" ? (
          <div className="mx-auto max-w-md text-center">
            <h1 className="display text-2xl">This link is not available</h1>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        ) : null}

        {state.kind === "ready" ? (
          <div>
            <VideoPlayer
              mediaId={state.video.mediaId}
              title={state.video.title}
              mp4Url={state.video.mp4Url}
              hlsUrl={state.video.hlsUrl}
              posterUrl={state.video.posterUrl}
              captions={state.video.captions}
            />
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="text-lg font-semibold text-ink">{state.video.title}</h1>
              {state.video.convertedFrom ? (
                <p className="text-[13px] text-muted">
                  Converted from {state.video.convertedFrom} so it plays on this device
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-line px-6 py-5 text-center text-[13px] text-subtle">
        Shared with AdaptFlow
      </footer>
    </div>
  );
}
