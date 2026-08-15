import type { ReactNode } from "react";
import { useAccount } from "@/hooks/use-account";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { useReveal } from "@/hooks/use-reveal";
import { CompatCard } from "@/components/landing/compat-card";
import { DevicePostcards } from "@/components/landing/device-postcards";
import { ArchitectureDiagrams } from "@/components/landing/diagrams";
import { HeroRiver } from "@/components/landing/hero-river";
import { PipelineTabs } from "@/components/landing/pipeline-tabs";
import { Logo } from "@/components/logo";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { DOCS, REPO } from "@/lib/links";

/** Dark sections share a shell: a rounded panel with generous, capped gutters. */
const PANEL = "panel-section bg-panel px-[max(28px,calc((100%-1280px)/2))] py-[clamp(72px,8vw,96px)]";
const HEADING = "text-[clamp(36px,4.2vw,56px)] leading-[1.05] font-medium tracking-[-0.025em]";

/**
 * Three hairlines mark the header's column boundaries — the third sits at the
 * right edge with nothing after it, which is what keeps the grid from reading
 * as a two-column layout that ran out of content.
 */
function SectionHeader({ title, lead, action }: { title: string; lead: string; action: ReactNode }) {
  return (
    <div className="reveal stagger grid py-10 [grid-template-columns:minmax(0,1.15fr)_minmax(0,1fr)_0px] max-lg:[grid-template-columns:1fr] max-lg:gap-8">
      <div className="border-l border-line pr-10 pl-8">
        <h2 data-head className={`${HEADING} max-w-[16ch]`}>
          {title}
        </h2>
      </div>
      <div className="border-l border-line px-8">
        <p className="max-w-[400px] text-[17px] leading-[1.5] text-muted text-pretty">{lead}</p>
        <div className="mt-[26px]">{action}</div>
      </div>
      <div className="border-l border-line max-lg:hidden" />
    </div>
  );
}

const OUTLINE_PILL = "pill h-[46px] gap-3 border-white/20 px-6 text-[15px] hover:border-white/45 hover:bg-transparent";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Security", href: "#security" },
      { label: "Architecture", href: "#architecture" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API reference", href: DOCS.internals, external: true },
      { label: "Webhooks", href: DOCS.internals, external: true },
      { label: "Self-hosting", href: DOCS.selfHost, external: true },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub", href: REPO, external: true },
      { label: "Why I built this", href: DOCS.origin, external: true },
      { label: "Sign in", href: "/signin" },
    ],
  },
] as const;

export function Landing() {
  const { data: account } = useAccount();
  const revealRef = useReveal<HTMLDivElement>();
  useLandingMotion();

  return (
    <div ref={revealRef} className="flex flex-col gap-[14px] bg-backdrop p-[14px]">
      {/* 1 — Hero. The nav lives inside the panel, as in the design. */}
      <section
        data-hero
        className="panel-section flex flex-col"
        style={{
          background: "#0C0C0C",
          border: "1px solid rgb(255 255 255 / 0.06)",
          minHeight: "min(920px, max(700px, 94vh))",
        }}
      >
        <HeroRiver />

        <nav className="relative z-[3] flex items-center justify-between px-[clamp(22px,4vw,44px)] py-[26px]">
          <Logo size={17} />
          <div className="flex items-center gap-7 text-sm whitespace-nowrap text-muted">
            <a href="#how" className="underline-in hidden sm:block">
              How it works
            </a>
            <ButtonLink
              to={account ? "/library" : "/signup"}
              size="sm"
              arrow
              className="pill h-10 gap-2.5 px-5 text-sm"
            >
              {account ? "Your library" : "Get started"}
            </ButtonLink>
          </div>
        </nav>

        <div className="relative z-[2] flex flex-1 items-center px-[clamp(22px,4vw,60px)] pb-[clamp(60px,8vh,110px)]">
          <div className="max-w-[420px]">
            <h1 className="max-w-[16ch] text-[clamp(44px,6vw,76px)] leading-[1.02] font-medium tracking-[-0.03em] text-ink">
              Send a video.
              <br />
              It just plays.
            </h1>
            <p className="mt-7 max-w-[400px] text-[17px] leading-[1.5] text-muted text-pretty">
              Your phone records in a format half the world can't open. AdaptFlow rebuilds it into one that plays on
              every browser, phone and TV — then gives you a single link to share.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to={account ? "/library" : "/signup"} arrow className="pill h-[46px] gap-3 px-6 text-[15px]">
                {account ? "Open your library" : "Upload your first video"}
              </ButtonLink>
              <ButtonAnchor href="#how" arrow className={OUTLINE_PILL}>
                See how it works
              </ButtonAnchor>
            </div>
          </div>
        </div>

        <div data-hero-compat className="absolute right-[clamp(16px,3vw,44px)] bottom-[clamp(20px,4vh,44px)] z-[3]">
          <CompatCard />
        </div>
      </section>

      {/* 2 — How it works */}
      <section id="how" data-panel className={PANEL}>
        <SectionHeader
          title="Ready in seconds."
          lead="Video infrastructure that turns whatever came off your phone into something every browser can decode — and packages it for streaming while it's at it."
          action={
            <ButtonAnchor href={DOCS.features} arrow className={OUTLINE_PILL}>
              Read the docs
            </ButtonAnchor>
          }
        />
        <PipelineTabs />
      </section>

      {/* 3 — Sharing */}
      <section
        id="security"
        data-panel
        className="panel-section mesh px-[max(28px,calc((100%-1280px)/2))] py-[clamp(72px,8vw,96px)] text-on-mesh"
      >
        <div className="relative z-[1] grid items-center gap-[clamp(36px,5vw,64px)] [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
          <div className="reveal">
            <DevicePostcards />
          </div>
          <div className="reveal border-l border-on-mesh/10 py-6 pl-8">
            <h2 data-head className={`${HEADING} max-w-[11ch]`}>
              Locked down by default.
            </h2>
            <p className="mt-6 max-w-[460px] text-[15px] leading-[1.55] text-on-mesh/70 text-pretty">
              Passwords are hashed, expiry and view limits are enforced on the server, and share links hand out
              short-lived access scoped to a single video. Knowing the URL is never enough.
            </p>
            <ButtonAnchor
              href={DOCS.features}
              arrow
              className="pill mt-7 h-[46px] gap-3 border-on-mesh/25 px-6 text-[15px] text-on-mesh hover:border-on-mesh/60 hover:bg-transparent"
            >
              See how sharing works
            </ButtonAnchor>
          </div>
        </div>
      </section>

      {/* 4 — Under the hood */}
      <section id="architecture" data-panel className={PANEL}>
        <SectionHeader
          title="Built like infrastructure, not a weekend project."
          lead="A durable job queue, a worker pool, and a pipeline that survives being restarted mid-job."
          action={
            <ButtonAnchor href={DOCS.architecture} arrow className={OUTLINE_PILL}>
              Read the architecture
            </ButtonAnchor>
          }
        />
        <div className="reveal mt-[clamp(40px,6vw,72px)]">
          <ArchitectureDiagrams />
        </div>
      </section>

      {/* 5 — Closing */}
      <section id="start" data-panel className="panel-section bg-[#F4F4F1] p-[14px]">
        <div className="mesh relative flex min-h-[min(520px,60vh)] items-center justify-center overflow-hidden rounded-[36px] text-center text-on-mesh">
          <div className="relative z-[1] flex flex-col items-center gap-[18px] px-[clamp(24px,4vw,56px)] py-[clamp(44px,6vw,88px)]">
            <h2 data-head className={`${HEADING} max-w-[16ch]`}>
              Stop asking people what phone they have.
            </h2>
            {/* No button here on purpose — the nav pill is pinned above it and
                the hero already asked. A third ask in the same words is noise. */}
            <p className="max-w-[44ch] text-[17px] leading-[1.5] text-on-mesh/70 text-pretty">
              Upload a video, share one link, and let them press play.
            </p>
          </div>
        </div>
      </section>

      <footer data-panel className="panel-section bg-[#F4F4F1] text-on-mesh">
        <div className="reveal stagger grid justify-start px-[clamp(22px,4vw,60px)] py-[clamp(48px,6vw,88px)] [grid-template-columns:repeat(auto-fit,minmax(200px,240px))]">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3 border-l border-on-mesh/10 px-6">
              <span className="text-[13px] font-medium">{column.heading}</span>
              {column.links.map((link) =>
                "external" in link && link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-in self-start text-[15px] whitespace-nowrap text-on-mesh/70"
                  >
                    {link.label}
                  </a>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="underline-in self-start text-[15px] whitespace-nowrap text-on-mesh/70"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden px-[clamp(22px,4vw,60px)] pt-[clamp(20px,3vw,36px)]">
          <div aria-hidden data-bloom className="wordmark-bloom absolute -inset-[40%]" />
          <div
            data-wordmark
            className="relative z-[1] mb-[-0.14em] text-[clamp(72px,17vw,240px)] leading-[0.86] font-medium tracking-[-0.045em] whitespace-nowrap"
          >
            AdaptFlow
          </div>
        </div>
      </footer>
    </div>
  );
}
