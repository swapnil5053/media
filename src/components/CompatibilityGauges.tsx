import React from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
  score: number;
  label: string;
}

export const Gauge: React.FC<GaugeProps> = ({ score, label }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  
  let color = 'var(--status-ready)';
  if (score < 60) color = 'var(--status-failed)';
  else if (score < 80) color = 'var(--status-processing)';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="28" cy="28" r={radius} 
            className="stroke-[var(--bg-surface)] fill-none stroke-[3px]"
          />
          <motion.circle 
            cx="28" cy="28" r={radius} 
            className="fill-none stroke-[3px]"
            style={{ stroke: color }}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute font-mono text-[10px] tracking-wide" style={{ color: 'var(--text-primary)' }}>
          {score}%
        </span>
      </div>
      <span className="mt-2 text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </span>
    </div>
  );
}

export function CompatibilityGauges({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="grid grid-cols-3 gap-y-6 gap-x-2 py-2">
      {Object.entries(scores).map(([label, score], i) => (
        <Gauge key={label} score={score} label={label} />
      ))}
    </div>
  );
}
