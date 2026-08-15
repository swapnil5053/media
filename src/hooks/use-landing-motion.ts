import { useEffect } from "react";

/** Each river band drifts at its own rate — that difference is the depth. */
const BAND_FACTOR: Record<string, number> = { far: 0.06, mid: 0.14, near: 0.26 };
const CAP = 120;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/**
 * One rAF loop for every parallax layer on the marketing page: the hero's river
 * bands, the compatibility card counter-moving against them, the gradient blooms
 * behind the light sections, section headings, the footer wordmark, and the
 * panels themselves, which sink and fade as the next one covers them.
 *
 * Everything is transform and opacity, so it stays off the layout path.
 */
export function useLandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const applied = new WeakMap<Element, number>();
    const put = (el: HTMLElement, offset: number, extra = "") => {
      applied.set(el, offset);
      el.style.transform = `translate3d(0,${offset.toFixed(1)}px,0)${extra}`;
    };
    // A rect already carries the offset we last wrote; subtract it or the
    // element chases its own tail and drifts off screen.
    const rawTop = (el: Element, rect: DOMRect) => rect.top - (applied.get(el) ?? 0);

    const all = <T extends HTMLElement>(selector: string) => [...document.querySelectorAll<T>(selector)];
    let hero: HTMLElement | null = null;
    let compat: HTMLElement | null = null;
    let word: HTMLElement | null = null;
    let bands: HTMLElement[] = [];
    let blooms: HTMLElement[] = [];
    let heads: HTMLElement[] = [];
    let panels: HTMLElement[] = [];

    const collect = () => {
      hero = document.querySelector("[data-hero]");
      compat = document.querySelector("[data-hero-compat]");
      word = document.querySelector("[data-wordmark]");
      bands = all("[data-band]");
      blooms = all("[data-bloom]");
      heads = all("[data-head]");
      panels = all("[data-panel]");
    };

    let frame = 0;
    const measure = () => {
      frame = 0;
      const viewport = window.innerHeight;

      if (hero) {
        const travelled = -hero.getBoundingClientRect().top;
        for (const band of bands) {
          put(band, clamp(travelled * (BAND_FACTOR[band.dataset.band ?? ""] ?? 0.12), CAP));
        }
        if (compat) put(compat, clamp(travelled * -0.05, CAP));
      }

      for (const bloom of blooms) {
        const rect = bloom.getBoundingClientRect();
        put(bloom, clamp((viewport / 2 - (rawTop(bloom, rect) + rect.height / 2)) * 0.04, CAP));
      }

      for (const head of heads) {
        const rect = head.getBoundingClientRect();
        put(head, clamp((viewport / 2 - (rawTop(head, rect) + rect.height / 2)) * 0.04, 24));
      }

      if (word) {
        const rect = word.getBoundingClientRect();
        word.style.transform = `translate3d(${clamp((viewport / 2 - rect.top) * 0.03, 40).toFixed(1)}px,0,0)`;
      }

      for (const panel of panels) {
        const rect = panel.getBoundingClientRect();
        const past = Math.max(0, Math.min(1, -rawTop(panel, rect) / Math.max(1, rect.height * 0.55)));
        put(panel, -24 * past, ` scale(${(1 - 0.03 * past).toFixed(4)})`);
        panel.style.opacity = (1 - 0.35 * past).toFixed(3);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    const onResize = () => {
      collect();
      schedule();
    };

    collect();
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
    };
  }, []);
}
