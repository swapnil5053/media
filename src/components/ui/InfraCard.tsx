import React from 'react';
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
  const isActive = variant === 'active';
  const isProcessing = variant === 'processing';

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl flex flex-col', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: isActive ? '2px solid var(--accent)' : undefined,
        padding: '14px 16px 16px',
        minHeight: 108,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Processing shimmer bar */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-[1.5px] shimmer" />
      )}

      {/* Corner micro-glow */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 64, height: 64,
          background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.018) 0%, transparent 70%)',
        }}
      />

      {/* Label row */}
      <div className="flex items-center justify-between mb-auto">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.1em] select-none"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}>
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-3">
        <div
          className="font-sans leading-none tracking-tight select-none"
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}
        >
          {value}
        </div>

        {/* Trend */}
        {trend && (
          <span
            className="inline-block mt-1.5 font-mono text-[10px] px-1.5 py-0.5 rounded select-none"
            style={{
              color: trend.positive ? 'var(--status-ready)' : 'var(--status-failed)',
              background: trend.positive ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            }}
          >
            {trend.value}
          </span>
        )}

        {/* Subtext */}
        {subtext && (
          <div
            className="mt-1.5 font-mono text-[10px] select-none"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
