import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InfraCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'active' | 'processing';
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function InfraCard({ label, value, subtext, icon, variant = 'default', trend, className }: InfraCardProps) {
  const variantStyles = {
    default: 'bg-[var(--bg-surface)] border-[var(--border)]',
    elevated: 'bg-[var(--bg-elevated)] border-[var(--border-hover)]',
    active: 'bg-[var(--bg-elevated)] border-[var(--border)] border-l-2 border-l-[var(--accent)]/30',
    processing: 'bg-[var(--bg-elevated)] border-[var(--border)] relative overflow-hidden',
  };

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'border rounded-xl p-4 flex flex-col justify-between min-h-[120px]',
        variantStyles[variant],
        className
      )}
    >
      {variant === 'processing' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] shimmer" />
      )}

      <div className="flex justify-between items-start">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          {label}
        </span>
        {icon && (
          <span className="text-[var(--text-tertiary)]">{icon}</span>
        )}
      </div>

      <div className="mt-auto">
        <div className="font-sans text-[26px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] leading-tight">
          {value}
        </div>
        {trend && (
          <span className={cn(
            'inline-block mt-1.5 font-mono text-[11px] px-1.5 py-0.5 rounded',
            trend.positive
              ? 'text-[var(--status-ready)] bg-[var(--status-ready)]/5'
              : 'text-[var(--status-failed)] bg-[var(--status-failed)]/5'
          )}>
            {trend.value}
          </span>
        )}
        {subtext && (
          <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-1">
            {subtext}
          </div>
        )}
      </div>
    </motion.div>
  );
}
