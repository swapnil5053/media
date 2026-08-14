
import { useAccount } from "@/hooks/use-account";
import { useReveal } from "@/hooks/use-reveal";
import { CompatCard } from "@/components/landing/compat-card";
import { DevicePostcards } from "@/components/landing/device-postcards";
import { ArchitectureDiagrams } from "@/components/landing/diagrams";
import { HeroRiver } from "@/components/landing/hero-river";
import { PipelineTabs } from "@/components/landing/pipeline-tabs";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

function SectionHeader({ title, lead, action }: { title: string; lead: string; action?: React.ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,24rem)] md:gap-12">
      <h2 className="max-w-[14ch] text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] text-ink">{title}</h2>
      <div className="rule md:pl-10">
        <p className="text-sm text-muted">{lead}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export function Landing() {
  const { data: account } = useAccount();
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div ref={revealRef} className="bg-backdrop pb-4">
      <main className="space-y-4">
        {/* 1 — Hero. The nav lives inside the panel, as in the design. */}
        <section
          className="panel-section flex flex-col"
          style={{
            background: "#0C0C0C",
            border: "1px solid rgb(255 255 255 / 0.06)",
            minHeight: "min(920px, max(700px, 94vh))",
          }}
        >
          <HeroRiver />

          <nav className="relative z-30 flex items-center justify-between px-[clamp(22px,4vw,44px)] py-[26px]">
            <Logo />
            <div className="flex items-center gap-7 text-sm text-muted">
              <a href="#how" className="underline-in hidden sm:block">
                How it works
              </a>
              <a href="#pricing" className="underline-in hidden sm:block">
                Pricing
              </a>
              {account ? (
                <ButtonLink to="/library" size="sm" arrow className="h-10 px-5">
                  Your library
                </ButtonLink>
              ) : (
                <ButtonLink to="/signup" size="sm" arrow className="h-10 px-5 text-sm">
                  Get started
                </ButtonLink>
              )}
            </div>
          </nav>

          <div className="relative z-20 flex flex-1 items-center px-[clamp(22px,4vw,60px)] pb-[clamp(60px,8vh,110px)]">
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
                <ButtonLink to={account ? "/library" : "/signup"} arrow className="h-[46px] px-6 text-[15px]">
                  {account ? "Open your library" : "Upload your first video"}
                </ButtonLink>
                <ButtonLink to="#how" variant="secondary" arrow className="h-[46px] px-6 text-[15px]">
                  See how it works
                </ButtonLink>
              </div>
            </div>
          </div>

          {/* Anchored to the panel's lower right, overlapping the river. */}
          <div className="absolute right-[clamp(16px,3vw,44px)] bottom-[clamp(20px,4vh,44px)] z-30">
            <CompatCard />
          </div>
        </section>

        {/* 2 — How it works */}
        <section id="how" className="panel-section bg-panel">
          <div className="reveal mx-auto max-w-6xl px-5 py-24">
            <SectionHeader
              title="Ready in seconds."
              lead="Video infrastructure that turns whatever came off your phone into something every browser can decode — and packages it for streaming while it's at it."
            />
            <div className="mt-16">
              <PipelineTabs />
            </div>
          </div>
        </section>

        {/* 3 — Sharing */}
        <section className="panel-section mesh">
          <div className="reveal relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 lg:grid-cols-2">
            <DevicePostcards />
            <div className="rule lg:pl-12">
              <h2 className="max-w-[12ch] text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] text-on-mesh">
                Locked down by default.
              </h2>
              <p className="mt-5 max-w-md text-sm text-on-mesh/70">
                Passwords are hashed, expiry and view limits are enforced on the server, and every share link hands out
                short-lived access to a single video. Knowing the URL is never enough.
              </p>
              <ButtonLink
                to="/signup"
                variant="secondary"
                arrow
                className="mt-8 border-on-mesh/20 text-on-mesh hover:border-on-mesh/40 hover:bg-white/40"
              >
                Start sharing
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* 4 — Under the hood */}
        <section className="panel-section bg-panel">
          <div className="reveal mx-auto max-w-6xl px-5 py-24">
            <SectionHeader
              title="Built like infrastructure."
              lead="A durable job queue, a worker pool, and a pipeline that survives being restarted mid-job. Work that fails is retried with backoff, not dropped."
            />
            <div className="mt-16">
              <ArchitectureDiagrams />
            </div>
          </div>
        </section>

        {/* 5 — Pricing, closing, footer */}
        <section id="pricing" className="panel-section mesh">
          <div className="reveal relative mx-auto max-w-6xl px-5 py-24 text-on-mesh">
            <div className="text-center">
              <h2 className="mx-auto max-w-[16ch] text-[clamp(2rem,4vw,3.25rem)] leading-[1.05]">
                Stop asking people what phone they have.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-sm text-on-mesh/70">
                Free for your first five videos. No card needed.
              </p>
              <ButtonLink
                to="/signup"
                size="lg"
                arrow
                className="mt-9 bg-on-mesh text-on-mesh-invert hover:opacity-90"
              >
                Get started, free
              </ButtonLink>
            </div>

            <footer className="mt-24 border-t border-on-mesh/10 pt-10">
              <div className="grid gap-8 sm:grid-cols-3">
                {[
                  ["Product", [["How it works", "#how"], ["Pricing", "#pricing"], ["Sign in", "/signin"]]],
                  ["Developers", [["API reference", "/signup"], ["Webhooks", "/signup"], ["Self-hosting", "/signup"]]],
                  ["Project", [["GitHub", "https://github.com/swapnil5053/AdaptFlow"]]],
                ].map(([heading, links]) => (
                  <div key={heading as string}>
                    <p className="text-[13px] font-medium">{heading as string}</p>
                    <ul className="mt-3 space-y-2">
                      {(links as string[][]).map(([label, href]) => (
                        <li key={label}>
                          <a href={href} className="text-[13px] text-on-mesh/65 transition-colors hover:text-on-mesh">
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="mt-16 text-[clamp(3rem,13vw,9rem)] leading-[0.85] font-medium tracking-tighter">
                AdaptFlow
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
