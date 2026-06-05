import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ScanSearch, Cpu, Zap, Globe } from 'lucide-react';
import type { MediaItem } from '@/api/media';

interface PipelineStage {
  id: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  desc: string;
  specs: { key: string; value: string }[];
}

const stages: PipelineStage[] = [
  {
    id: 'ingest',
    icon: Upload,
    label: 'INGEST',
    desc: 'File ingestion & validation',
    specs: [
      { key: 'Protocol', value: 'HTTP/2 Multipart' },
      { key: 'Max Size', value: '2 GB' },
      { key: 'Validation', value: 'MIME + Header' },
    ],
  },
  {
    id: 'analyze',
    icon: ScanSearch,
    label: 'ANALYZE',
    desc: 'Format & codec detection',
    specs: [
      { key: 'Parser', value: 'FFprobe v6' },
      { key: 'Detect', value: 'Codec / HDR / Audio' },
      { key: 'Output', value: 'MediaItem metadata' },
    ],
  },
  {
    id: 'transcode',
    icon: Cpu,
    label: 'TRANSCODE',
    desc: 'H.265 encoding pipeline',
    specs: [
      { key: 'Codec Target', value: 'H.265 / HEVC' },
      { key: 'Bitrate Mode', value: 'CRF 23' },
      { key: 'Resolution', value: '1920×1080' },
      { key: 'Audio', value: 'AAC 192kbps' },
    ],
  },
  {
    id: 'optimize',
    icon: Zap,
    label: 'OPTIMIZE',
    desc: 'Compression & quality pass',
    specs: [
      { key: 'Method', value: 'Two-pass ABR' },
      { key: 'Target', value: '75% reduction' },
      { key: 'Quality', value: 'SSIM ≥ 0.85' },
    ],
  },
  {
    id: 'deliver',
    icon: Globe,
    label: 'DELIVER',
    desc: 'Edge CDN distribution',
    specs: [
      { key: 'Format', value: 'HLS / m3u8' },
      { key: 'CDN', value: 'Multi-region edge' },
      { key: 'DRM', value: 'Token auth + PWD' },
    ],
  },
];

const statusToStage: Record<string, string> = {
  analyzing: 'analyze',
  transcoding: 'transcode',
};

interface PipelineVisualizationProps {
  items?: MediaItem[];
}

export function PipelineVisualization({ items = [] }: PipelineVisualizationProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const activeStages = new Set(
    items
      .filter(i => i.status === 'analyzing' || i.status === 'transcoding')
      .map(i => statusToStage[i.status])
      .filter(Boolean)
  );

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Processing Pipeline
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-ready)]" />
          <span className="font-mono text-[10px] text-[var(--text-tertiary)]">Operational</span>
        </div>
      </div>

      {/* Pipeline diagram */}
      <div className="relative flex">
        {/* Nodes column */}
        <div className="flex flex-col items-center flex-1">
          {stages.map((stage, i) => {
            const isActive = activeStages.has(stage.id);
            const isHovered = hovered === stage.id;
            const IconComp = stage.icon;

            return (
              <React.Fragment key={stage.id}>
                {/* Node */}
                <motion.div
                  onMouseEnter={() => setHovered(stage.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative flex flex-col items-center cursor-pointer"
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
                        isActive ? 'text-white' : isHovered ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                      }`}
                    />
                  </motion.div>

                  <span className={`mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-150 ${
                    isActive ? 'text-[var(--accent)]' : isHovered ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
                  }`}>
                    {stage.label}
                  </span>
                </motion.div>

                {/* Connector */}
                {i < stages.length - 1 && (
                  <svg width="2" height="32" className="my-1" viewBox="0 0 2 32">
                    <line
                      x1="1" y1="0" x2="1" y2="32"
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                      className={isActive ? 'pipeline-connector-active' : ''}
                      style={isActive ? { stroke: 'var(--accent)' } : undefined}
                    />
                  </svg>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Info panel */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.12 }}
              className="absolute left-[72px] top-0 w-[180px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 z-10"
              style={{
                top: `${stages.findIndex(s => s.id === hovered) * 76}px`,
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--accent)] mb-2">
                {stages.find(s => s.id === hovered)?.label}
              </div>
              <div className="font-sans text-[11px] text-[var(--text-secondary)] mb-3">
                {stages.find(s => s.id === hovered)?.desc}
              </div>
              <div className="space-y-1.5">
                {stages.find(s => s.id === hovered)?.specs.map((spec) => (
                  <div key={spec.key} className="flex justify-between items-baseline">
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{spec.key}</span>
                    <span className="font-mono text-[10px] text-[var(--text-primary)]">{spec.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
