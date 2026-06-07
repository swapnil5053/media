import React from 'react';
import { cn } from '@/lib/utils';

type StatusValue =
  | 'pending' | 'analyzing' | 'transcoding'
  | 'ready' | 'failed'
  | 'active' | 'expired' | 'deactivated';

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const config: Record<StatusValue, { label: string; color: string; pulse: boolean }> = {
  pending:     { label: 'Pending',     color: '#71717A', pulse: false },
  analyzing:   { label: 'Analyzing',   color: '#F59E0B', pulse: true  },
  transcoding: { label: 'Transcoding', color: '#F59E0B', pulse: true  },
  ready:       { label: 'Ready',       color: '#10B981', pulse: false },
  failed:      { label: 'Failed',      color: '#EF4444', pulse: false },
  active:      { label: 'Active',      color: '#10B981', pulse: false },
  expired:     { label: 'Expired',     color: '#71717A', pulse: false },
  deactivated: { label: 'Deactivated', color: '#EF4444', pulse: false },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, color, pulse } = config[status] ?? config.pending;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 select-none', className)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: '2px 7px 2px 6px',
      }}
    >
      {/* Dot */}
      <span className="relative flex items-center justify-center" style={{ width: 6, height: 6 }}>
        {pulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: color, opacity: 0.45, animationDuration: '1.8s' }}
          />
        )}
        <span className="relative rounded-full block" style={{ width: 5, height: 5, background: color }} />
      </span>
      <span
        className="font-mono"
        style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.03em' }}
      >
        {label}
      </span>
    </span>
  );
}
