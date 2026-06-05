import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type StatusValue = 'pending' | 'analyzing' | 'transcoding' | 'ready' | 'failed' | 'active' | 'expired' | 'deactivated';

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const config: Record<StatusValue, { label: string; color: string; pulse: boolean }> = {
  pending:      { label: 'Pending',      color: 'var(--status-pending)',    pulse: false },
  analyzing:    { label: 'Analyzing',    color: 'var(--status-processing)', pulse: true },
  transcoding:  { label: 'Transcoding',  color: 'var(--status-processing)', pulse: true },
  ready:        { label: 'Ready',        color: 'var(--status-ready)',      pulse: false },
  failed:       { label: 'Failed',       color: 'var(--status-failed)',     pulse: false },
  active:       { label: 'Active',       color: 'var(--status-ready)',      pulse: false },
  expired:      { label: 'Expired',      color: 'var(--status-pending)',    pulse: false },
  deactivated:  { label: 'Deactivated',  color: 'var(--status-failed)',     pulse: false },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, color, pulse } = config[status] ?? config.pending;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-2 py-0.5',
      className
    )}>
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {pulse && (
          <motion.span
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inline-flex h-full w-full rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-1.5 w-1.5"
          style={{ backgroundColor: color }}
        />
      </span>
      <span className="font-mono text-[11px] text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}
