import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line px-6 py-4">
        <Logo />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[13px] text-subtle">404</p>
        <h1 className="display mt-2 text-3xl">There is nothing here</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          The page you were looking for may have moved, or the link was mistyped.
        </p>
        <ButtonLink to="/" className="mt-6">
          Go to the homepage
        </ButtonLink>
      </main>
    </div>
  );
}
