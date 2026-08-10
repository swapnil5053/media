import { useEffect, useRef } from "react";

/**
 * Adds data-visible to elements marked with .reveal once they are scrolled to.
 * The CSS handles the rest, and honours prefers-reduced-motion.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return ref;
}

/** The single parallax moment on the site: the hero image drifts as you scroll past it. */
export function useHeroParallax<T extends HTMLElement>(strength = 0.06) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY, 600) * strength;
        element.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [strength]);

  return ref;
}
