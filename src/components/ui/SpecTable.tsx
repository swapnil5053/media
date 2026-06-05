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
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-2">
          {title}
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
            <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{row.label}</span>
            <span className="font-mono text-[13px] text-[var(--text-primary)] text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
