import React from 'react';
import { motion } from 'framer-motion';

interface PulsingDotProps {
  color?: 'amber' | 'emerald' | 'red' | 'gray';
  className?: string;
}

export function PulsingDot({ color = 'gray', className = '' }: PulsingDotProps) {
  const colorMap = {
    amber: 'bg-[#f59e0b]',
    emerald: 'bg-[#10b981]',
    red: 'bg-[#ef4444]',
    gray: 'bg-[#6b7280]',
  };

  return (
    <span className={`relative flex h-2 w-2 items-center justify-center ${className}`}>
      <motion.span
        animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inline-flex h-full w-full rounded-full ${colorMap[color]}`}
      />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colorMap[color]}`} />
    </span>
  );
}
