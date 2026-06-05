import React from 'react';
import { cn } from '@/lib/utils';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingRow({ label, description, children, className }: SettingRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0', className)}>
      <div className="pr-4">
        <div className="font-sans text-[14px] font-medium text-[var(--text-primary)] tracking-[-0.005em]">
          {label}
        </div>
        {description && (
          <div className="font-sans text-[12px] text-[var(--text-tertiary)] mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
