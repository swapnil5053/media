import React, { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface NumberTickerProps {
  value: number;
  className?: string;
  suffix?: string;
}

export function NumberTicker({ value, className, suffix = '' }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  useEffect(() => {
    if (!isInView || !ref.current) return;
    
    let startTimestamp: number | null = null;
    const duration = 2000;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      if (ref.current) {
        let currentVal = easeProgress * value;
        // Formatting to 1 decimal if over 1000 and "k" suffix might be needed?
        // Let's just output integers for now or format cleanly based on magnitude
        let displayVal = currentVal > 999 && suffix === 'k' 
            ? (currentVal/1000).toFixed(1)
            : Math.floor(currentVal).toString();
            
        ref.current.textContent = displayVal + suffix;
      }
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value, isInView, suffix]);

  return <span ref={ref} className={className}>0</span>;
}
