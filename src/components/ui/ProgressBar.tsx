import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  height?: number;
  color?: 'amber' | 'green' | 'red' | 'gray';
  animated?: boolean;
  className?: string;
}

const colorMap = {
  amber: 'bg-[var(--accent)]',
  green: 'bg-[var(--status-ready)]',
  red: 'bg-[var(--status-failed)]',
  gray: 'bg-[var(--status-pending)]',
};

export function ProgressBar({ value, height = 3, color = 'amber', animated = false, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn('w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden', className)}
      style={{ height: `${height}px` }}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          colorMap[color],
          animated && 'shimmer'
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
