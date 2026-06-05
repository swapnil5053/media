import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PillTabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
}

export function PillTabs({ tabs, active, onChange, size = 'md' }: PillTabsProps) {
  return (
    <div className="inline-flex items-center gap-0.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-0.5">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative font-mono uppercase tracking-[0.08em] rounded-sm transition-colors cursor-pointer',
              size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[12px] px-3 py-1',
              isActive
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="pill-tab-indicator"
                className="absolute inset-0 bg-[var(--bg-elevated)] border border-[var(--border-hover)] rounded-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
