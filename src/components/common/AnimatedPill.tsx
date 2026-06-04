import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPillProps {
  text: string;
  color?: 'blue' | 'amber' | 'emerald' | 'red' | 'stone';
  className?: string;
  onRemove?: () => void;
  key?: string;
}

export function AnimatedPill({ text, color = 'stone', className = '', onRemove }: AnimatedPillProps) {
  const colorStyles = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    stone: 'bg-stone-500/10 border-stone-500/30 text-stone-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-wider ${colorStyles[color]} ${className}`}
    >
      {text}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-white transition-colors cursor-pointer text-sm ml-1"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}
