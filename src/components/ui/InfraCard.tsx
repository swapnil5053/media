import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InfraCardProps {
  label: string;
  value: string | number | React.ReactNode;
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
    active: 'bg-[var(--bg-surface)] border-[var(--border)] border-l-2 border-l-[var(--accent)]',
    processing: 'bg-[var(--bg-surface)] border-[var(--border)] relative overflow-hidden',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'relative overflow-hidden rounded-xl p-4 flex flex-col justify-between min-h-[120px] transition-colors duration-200',
        variantStyles[variant],
        className
      )}
      style={{ boxShadow: 'var(--card-glow-subtle)' }}
    >
      {variant === 'processing' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] shimmer" />
      )}

      {/* Top row: label + icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] select-none">
          {label}
        </span>
        {icon && (
          <div className="text-[var(--text-tertiary)] opacity-50 select-none">
            {icon}
          </div>
        )}
      </div>

      {/* Value — large, dominant */}
      <div className="mt-auto">
        <div className="text-[26px] font-semibold text-[var(--text-primary)] leading-none tracking-tight select-none">
          {value}
        </div>

        {/* Subtext / trend */}
        {trend && (
          <span className={cn(
            'inline-block mt-2 font-mono text-[11px] px-1.5 py-0.5 rounded select-none',
            trend.positive
              ? 'text-[var(--status-ready)] bg-[var(--status-ready)]/5'
              : 'text-[var(--status-failed)] bg-[var(--status-failed)]/5'
          )}>
            {trend.value}
          </span>
        )}
        {subtext && (
          <div className="mt-2 text-[11px] font-mono text-[var(--text-tertiary)] select-none">
            {subtext}
          </div>
        )}
      </div>

      {/* Subtle corner accent — barely visible gradient */}
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full
                      bg-gradient-to-bl from-[rgba(255,255,255,0.012)] to-transparent
                      pointer-events-none" />
    </motion.div>
  );
}
