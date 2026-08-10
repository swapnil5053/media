import { Link } from "react-router-dom";
import { BarChart3, Check, Lock, Smartphone, Zap } from "lucide-react";
import { PLANS } from "@shared/types";
import { useAccount } from "@/hooks/use-account";
import { useHeroParallax, useReveal } from "@/hooks/use-reveal";
import { DeviceProof } from "@/components/landing/device-proof";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

const STEPS = [
  {
    title: "Upload whatever you have",
    body: "Straight from your camera roll. MOV, MP4, MKV, AVI — we read the codecs inside it, not just the extension.",
  },
  {
    title: "We fix what would break",
    body: "If anything about the file would fail on a common device, it is re-encoded to H.264 in an MP4 and packaged for adaptive streaming.",
  },
  {
    title: "Share one link",
    body: "The person you send it to presses play. No app, no download, no 'this format is not supported'.",
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: "Plays on everything",
    body: "A compatibility report per video shows exactly which devices your original would have failed on, and proves the delivered copy reaches all of them.",
  },
  {
    icon: Zap,
    title: "Adaptive streaming",
    body: "Every video is packaged into an HLS ladder, so a phone on patchy mobile data gets a lower rendition instead of a spinner.",
  },
  {
    icon: Lock,
    title: "Links you control",
    body: "Set a password, an expiry, or a view limit. Revoke any link instantly. Rules are enforced on the server, not hidden in the page.",
  },
  {
    icon: BarChart3,
    title: "Honest analytics",
    body: "Views, unique viewers, completion rate and device mix — measured from real playback events, never estimated.",
  },
];

const FAQ = [
  {
    q: "Why won't videos from an iPhone play on my Android phone?",
    a: "iPhones record in HEVC inside a .MOV container. Plenty of Android phones, browsers and TVs cannot decode HEVC, and some will not open a .MOV at all — so you get a black screen or a download prompt instead of a video. AdaptFlow converts the file to H.264 in an MP4, which is the one combination that every mainstream device can play.",
  },
  {
    q: "Does converting ruin the quality?",
    a: "No. Files are encoded at CRF 23 and capped at 1080p, which is visually clean for anything you would share with friends or clients. The original is kept untouched, so nothing is lost.",
  },
  {
    q: "How long does processing take?",
    a: "A one-minute clip is usually ready in a few seconds. Files that already play everywhere skip re-encoding entirely and are only repackaged, which is close to instant.",
  },
  {
    q: "Can I self-host it?",
    a: "Yes. AdaptFlow runs from a single Docker container with SQLite and ffmpeg inside, so it can live on a small VPS with one volume mounted.",
  },
];

export function Landing() {
  const { data: account } = useAccount();
  const revealRef = useReveal<HTMLDivElement>();
  const heroRef = useHeroParallax<HTMLDivElement>();

  return (
    <div ref={revealRef} className="bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-5">
          <Logo />
          <nav className="ml-auto flex items-center gap-2">
            <a href="#how" className="hidden px-3 py-1.5 text-sm text-muted hover:text-ink sm:block">
              How it works
            </a>
            <a href="#pricing" className="hidden px-3 py-1.5 text-sm text-muted hover:text-ink sm:block">
              Pricing
            </a>
            {account ? (
              <ButtonLink to="/library" size="sm">
                Go to library
              </ButtonLink>
            ) : (
              <>
                <Link to="/signin" className="px-3 py-1.5 text-sm text-muted hover:text-ink">
                  Sign in
                </Link>
                <ButtonLink to="/signup" size="sm">
                  Get started
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-16 sm:pt-24">
          <div className="max-w-2xl">
            <p className="font-mono text-[13px] uppercase tracking-wide text-muted">Video delivery, minus the guesswork</p>
            <h1 className="display mt-4 text-5xl sm:text-6xl">
              Send a video.
              <br />
              It just plays.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              AdaptFlow takes the file your phone or camera produced, converts it to the one format every browser and
              device can decode, and gives you a single link to share.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to={account ? "/library" : "/signup"} size="lg">
                {account ? "Open your library" : "Upload your first video"}
              </ButtonLink>
              <a href="#story" className="px-2 py-2 text-sm text-muted hover:text-ink">
                Why this exists →
              </a>
            </div>
          </div>

          <div ref={heroRef} className="mt-14 will-change-transform">
            <DeviceProof />
          </div>
        </section>

        <section id="story" className="border-y border-line bg-sunken">
          <div className="reveal mx-auto max-w-3xl px-5 py-20">
            <h2 className="display text-3xl">The video that would not open</h2>
            <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-muted">
              <p>
                A friend on an iPhone sent me a video from a trip. My Samsung S23+ refused to open it — no preview, no
                player, just a file sitting there. Nothing was broken. The clip was recorded in HEVC inside a .MOV
                container, and my phone had no idea what to do with it.
              </p>
              <p>
                The fix is well understood by anyone who works with video, and completely invisible to everyone else.
                That gap is the whole product: <span className="text-ink">you should never have to know what a codec is
                to watch a video someone sent you.</span>
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-5xl px-5 py-20">
          <div className="reveal">
            <h2 className="display text-3xl">How it works</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title}>
                  <span className="font-mono text-[13px] text-accent">0{index + 1}</span>
                  <h3 className="mt-2 text-[15px] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="reveal mx-auto grid max-w-5xl gap-px bg-line px-0 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-canvas p-8">
                <feature.icon size={18} className="text-accent" aria-hidden />
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-t border-line">
          <div className="reveal mx-auto max-w-5xl px-5 py-20">
            <h2 className="display text-3xl">Pricing</h2>
            <p className="mt-2 text-sm text-muted">Start free. Upgrade when your library outgrows it.</p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {Object.values(PLANS).map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-card border p-6 ${plan.id === "pro" ? "border-accent bg-surface" : "border-line bg-surface"}`}
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[15px] font-semibold text-ink">{plan.name}</h3>
                    <p className="text-2xl font-semibold tabular-nums text-ink">
                      {plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}`}
                      {plan.priceMonthly > 0 ? <span className="text-sm font-normal text-muted">/month</span> : null}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-muted">
                        <Check size={15} className="mt-0.5 shrink-0 text-positive" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    to={account ? "/settings" : "/signup"}
                    variant={plan.id === "pro" ? "primary" : "secondary"}
                    className="mt-6 w-full"
                  >
                    {plan.id === "pro" ? "Go Pro" : "Start free"}
                  </ButtonLink>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-sunken">
          <div className="reveal mx-auto max-w-3xl px-5 py-20">
            <h2 className="display text-3xl">Questions</h2>
            <dl className="mt-8 divide-y divide-line">
              {FAQ.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="text-[15px] font-medium text-ink">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-5 py-8">
          <Logo />
          <p className="text-[13px] text-subtle">Built to solve one specific, very annoying problem.</p>
          <Link to="/signin" className="ml-auto text-[13px] text-muted hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
