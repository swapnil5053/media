import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./logo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line px-6 py-4">
        <Logo />
      </header>

      <main className="page-enter flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="display text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

          <div className="mt-7 space-y-4">{children}</div>

          <p className="mt-6 text-sm text-muted">{footer}</p>
        </div>
      </main>

      <footer className="px-6 py-6 text-[13px] text-subtle">
        <Link to="/" className="hover:text-ink">
          Back to adaptflow.app
        </Link>
      </footer>
    </div>
  );
}
