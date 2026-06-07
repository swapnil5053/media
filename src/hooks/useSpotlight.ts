import { useEffect, useRef } from 'react';

/**
 * Mounts a soft amber spotlight that follows the cursor.
 * Cleans up on unmount.
 */
export function useSpotlight() {
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'spotlight-cursor';
    el.style.width = '320px';
    el.style.height = '320px';
    el.style.opacity = '0';
    document.body.appendChild(el);
    dotRef.current = el;

    let raf = 0;
    let mx = -999, my = -999;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.left = mx + 'px';
        el.style.top  = my + 'px';
        el.style.opacity = '1';
      });
    };
    const onLeave = () => { el.style.opacity = '0'; };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
      el.remove();
    };
  }, []);
}
