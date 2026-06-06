import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full items-center transition-colors duration-150',
        checked ? 'bg-[var(--accent)] border border-transparent' : 'bg-[var(--bg-elevated)] border border-[var(--border)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className={cn(
          'pointer-events-none block h-3 w-3 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-colors',
          checked ? 'bg-black ml-5' : 'bg-[var(--text-tertiary)] ml-1'
        )}
      />
    </button>
  );
}
