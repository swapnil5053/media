import React from 'react';
import { cn } from '@/lib/utils';
import { PulsingDot } from './common';

interface StatusPillProps {
  status: 'pending' | 'analyzing' | 'transcoding' | 'ready' | 'failed';
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const styles = {
    pending: 'bg-[#374151] text-[#9ca3af]',
    analyzing: 'bg-[#78350f] text-[#fcd34d]',
    transcoding: 'bg-[#78350f] text-[#fcd34d]',
    ready: 'bg-[#064e3b] text-[#6ee7b7]',
    failed: 'bg-[#7f1d1d] text-[#fca5a5]',
  };

  const labels = {
    pending: 'Pending',
    analyzing: 'Analyzing',
    transcoding: 'Transcoding',
    ready: 'Ready',
    failed: 'Failed',
  };

  const showPulse = status === 'analyzing' || status === 'transcoding';

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider', styles[status], className)}>
      {showPulse && (
        <PulsingDot color="amber" />
      )}
      {labels[status]}
    </div>
  );
}
