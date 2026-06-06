import React from 'react';
import { cn } from '@/lib/utils';

interface SpecTableProps {
  rows: { label: string; value: string | React.ReactNode }[];
  title?: string;
  className?: string;
}

export function SpecTable({ rows, title, className }: SpecTableProps) {
  return (
    <div className={cn('', className)}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
              {title}
            </span>
          </div>
        </div>
      )}
      <div>
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex justify-between items-baseline py-2',
              i < rows.length - 1 && 'border-b border-[var(--border)]'
            )}
          >
            <span className="font-mono text-[11px] text-[var(--text-tertiary)] select-none">{row.label}</span>
            <span className="font-mono text-[13px] text-[var(--text-primary)] text-right select-none">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

