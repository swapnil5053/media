import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ScanSearch, Cpu, Zap, Globe } from 'lucide-react';
import type { MediaItem } from '@/api/media';

interface PipelineStage {
  id: string;
  icon: React.FC<{ className?: string }>;
  label: string;
}

const stages: PipelineStage[] = [
  { id: 'ingest', icon: Upload, label: 'INGEST' },
  { id: 'analyze', icon: ScanSearch, label: 'ANALYZE' },
  { id: 'transcode', icon: Cpu, label: 'TRANSCODE' },
  { id: 'optimize', icon: Zap, label: 'OPTIMIZE' },
  { id: 'deliver', icon: Globe, label: 'DELIVER' },
];

const statusToStage: Record<string, string> = {
  analyzing: 'analyze',
  transcoding: 'transcode',
};

const stageInfo: Record<string, { action: string; detail: string; avgTime: string; codec?: string }> = {
  ingest:    { action: 'File validation & format detection', detail: 'Checks container, streams, metadata', avgTime: '< 1s' },
  analyze:   { action: 'Stream analysis & fingerprinting', detail: 'Codec detection, resolution, FPS, HDR', avgTime: '~2s' },
  transcode: { action: 'Multi-pass H.265 encoding', detail: 'CRF 23 · 2-pass · HEVC Main Profile', avgTime: '~45s/min', codec: 'H.265 / HEVC' },
  optimize:  { action: 'Compression quality pass', detail: 'SSIM analysis · bitrate optimization', avgTime: '~15s/min', codec: 'CRF 23' },
  deliver:   { action: 'Edge CDN packaging', detail: 'HLS segmentation · MP4 fragmentation', avgTime: '< 5s' },
};

interface PipelineVisualizationProps {
  items?: MediaItem[];
}

export function PipelineVisualization({ items = [] }: PipelineVisualizationProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [diagStep, setDiagStep] = useState<number | null>(null);

  // Filter out any mock items that have been transcoded long ago (e.g. older than 5 minutes)
  // and specifically exclude the pre-seeded transcoding item so the diagram isn't permanently stuck
  const activeStages = new Set(
    items
      .filter(i => {
        // Exclude the pre-seeded mock transcoding item by its unique ID
        if (i.id === '24c57519-7f2e-406f-a303-1b4fce160c86') return false;

        const isProcessing = i.status === 'analyzing' || i.status === 'transcoding';
        if (!isProcessing) return false;
        
        const ageMs = Date.now() - new Date(i.created_at).getTime();
        return ageMs < 5 * 60 * 1000;
      })
      .map(i => statusToStage[i.status])
      .filter(Boolean)
  );

  // Cool diagnostic pass sequence when idle
  useEffect(() => {
    if (activeStages.size > 0) {
      setDiagStep(null);
      return;
    }

    const runDiagnostic = () => {
      let step = 0;
      setDiagStep(0);
      
      const interval = setInterval(() => {
        step++;
        if (step > 12) {
          clearInterval(interval);
          setDiagStep(null);
        } else {
          setDiagStep(step);
        }
      }, 1200); // 1200ms per step
    };

    // Run first diagnostics scan on mount
    runDiagnostic();

    // Repeat every 16 seconds
    const timer = setInterval(runDiagnostic, 16000);

    return () => {
      clearInterval(timer);
    };
  }, [activeStages.size]);

  const isStageGlowing = (stageId: string) => {
    if (activeStages.size > 0) {
      return activeStages.has(stageId);
    }
    if (diagStep === null) return false;

    const stageIndex = stages.findIndex(s => s.id === stageId);
    
    // Sequential pass (each gets on/off)
    if (diagStep >= 0 && diagStep <= 4) {
      return diagStep === stageIndex;
    }

    // Accumulative pass (sections get on and stay on)
    if (diagStep >= 6 && diagStep <= 11) {
      return stageIndex <= (diagStep - 6);
    }

    return false;
  };

  const isConnectorGlowing = (index: number) => {
    if (activeStages.size > 0) {
      return activeStages.has(stages[index].id);
    }
    if (diagStep === null) return false;

    // Sequential flow path check
    if (diagStep >= 0 && diagStep <= 4) {
      return diagStep === index;
    }

    // Accumulative flow path check
    if (diagStep >= 6 && diagStep <= 11) {
      return (index + 1) <= (diagStep - 6);
    }

    return false;
  };

  const hasActiveProcessing = items.some(i => i.status === 'analyzing' || i.status === 'transcoding');

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
            Processing Pipeline
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${hasActiveProcessing ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--status-ready)]'}`} />
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] select-none">
            {hasActiveProcessing ? 'Processing' : 'Operational'}
          </span>
        </div>
      </div>

      {/* Pipeline diagram */}
      <div className="relative flex min-h-[360px]">
        {/* Nodes column */}
        <div className="flex flex-col items-start pl-4 justify-between py-2 flex-1">
          {stages.map((stage, i) => {
            const isActive = isStageGlowing(stage.id);
            const isHovered = hoveredStage === stage.id;
            const IconComp = stage.icon;

            return (
              <React.Fragment key={stage.id}>
                {/* Node Row */}
                <div className="relative flex items-center">
                  <motion.div
                    onMouseEnter={() => setHoveredStage(stage.id)}
                    onMouseLeave={() => setHoveredStage(null)}
                    className="relative flex items-center cursor-pointer gap-3"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150"
                      style={{
                        border: `1.5px solid ${isActive ? 'var(--accent)' : isHovered ? 'rgba(245,158,11,0.5)' : 'var(--border)'}`,
                        background: isActive
                          ? 'rgba(245,158,11,0.06)'
                          : isHovered
                            ? 'rgba(245,158,11,0.04)'
                            : 'var(--bg-surface)',
                        boxShadow: isActive
                          ? '0 0 20px rgba(245,158,11,0.2)'
                          : isHovered
                            ? '0 0 0 4px rgba(245,158,11,0.08), 0 0 16px rgba(245,158,11,0.12)'
                            : 'none',
                      }}
                    >
                      <IconComp
                        className={`w-4 h-4 transition-colors duration-150 ${
                          isActive ? 'text-[var(--accent)]' : isHovered ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                        }`}
                      />
                    </motion.div>

                    <span className={`font-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-150 ${
                      isActive ? 'text-[var(--accent)]' : isHovered ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
                    }`}>
                      {stage.label}
                    </span>
                  </motion.div>
                </div>

                {/* Connector line (absolute positioned to align between node centers) */}
                {i < stages.length - 1 && (
                  <div 
                    className="absolute left-[35px] w-px bg-[var(--border)] overflow-hidden"
                    style={{
                      top: `${(i * 72) + 40 + 8}px`,
                      height: '34px',
                    }}
                  >
                    {isConnectorGlowing(i) && (
                      <div className="absolute inset-0 bg-[var(--accent)]/30 overflow-hidden">
                        <div 
                          className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-[var(--accent)] to-transparent"
                          style={{
                            animation: 'flowDown 2.4s linear infinite',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Hover info panel */}
        <AnimatePresence>
          {hoveredStage && (
            <motion.div
              key={hoveredStage}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute left-[130px] top-0 bottom-0 flex items-center pointer-events-none z-20"
            >
              <div className="w-[172px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 shadow-xl">
                <p className="text-[9px] font-mono uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-2">
                  {hoveredStage.toUpperCase()}
                </p>
                <div className="space-y-1.5">
                  {stageInfo[hoveredStage].codec && (
                    <div className="flex justify-between">
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Codec</span>
                      <span className="text-[10px] font-mono text-[var(--text-primary)]">{stageInfo[hoveredStage].codec}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Avg time</span>
                    <span className="text-[10px] font-mono text-[var(--text-primary)]">{stageInfo[hoveredStage].avgTime}</span>
                  </div>
                  <div className="pt-1 border-t border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                      {stageInfo[hoveredStage].action}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Keyframe definitions */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flowDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}} />
    </div>
  );
}
