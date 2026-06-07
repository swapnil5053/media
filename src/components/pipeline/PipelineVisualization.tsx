import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ScanSearch, Cpu, Zap, Globe } from 'lucide-react';
import type { MediaItem } from '@/api/media';

const STAGES = [
  { id: 'ingest',    Icon: Upload,     label: 'Ingest',    info: { action: 'Container validation & stream detection', time: '< 1s' } },
  { id: 'analyze',   Icon: ScanSearch, label: 'Analyze',   info: { action: 'Codec fingerprinting, FPS, HDR detection', time: '~2s' } },
  { id: 'transcode', Icon: Cpu,        label: 'Transcode', info: { action: 'Multi-pass H.265 encode · CRF 23', time: '~45s/min', codec: 'HEVC' } },
  { id: 'optimize',  Icon: Zap,        label: 'Optimize',  info: { action: 'SSIM quality pass · bitrate normalization', time: '~15s/min', codec: 'CRF 23' } },
  { id: 'deliver',   Icon: Globe,      label: 'Deliver',   info: { action: 'HLS segmentation · MP4 fragmentation', time: '< 5s' } },
];

const STATUS_MAP: Record<string, string> = { analyzing: 'analyze', transcoding: 'transcode' };

export function PipelineVisualization({ items = [] }: { items?: MediaItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [diagStep, setDiagStep] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeStages = new Set(
    items
      .filter(i => i.id !== '24c57519-7f2e-406f-a303-1b4fce160c86'
        && (i.status === 'analyzing' || i.status === 'transcoding')
        && Date.now() - new Date(i.created_at).getTime() < 5 * 60 * 1000)
      .map(i => STATUS_MAP[i.status]).filter(Boolean)
  );

  // Idle diagnostic sweep
  useEffect(() => {
    if (activeStages.size > 0) { setDiagStep(null); return; }
    let timer: ReturnType<typeof setInterval>;
    const run = () => {
      let s = 0; setDiagStep(0);
      const t = setInterval(() => {
        s++;
        if (s > 11) { clearInterval(t); setDiagStep(null); } else setDiagStep(s);
      }, 1100);
      return t;
    };
    const t1 = run();
    timer = setInterval(run, 16000);
    return () => { clearInterval(t1); clearInterval(timer); };
  }, [activeStages.size]);

  const stageActive = (id: string) => {
    if (activeStages.size > 0) return activeStages.has(id);
    if (diagStep === null) return false;
    const idx = STAGES.findIndex(s => s.id === id);
    return diagStep <= 4 ? diagStep === idx : diagStep >= 6 ? idx <= diagStep - 6 : false;
  };

  const connActive = (i: number) => {
    if (activeStages.size > 0) return activeStages.has(STAGES[i].id);
    if (diagStep === null) return false;
    return diagStep <= 4 ? diagStep === i : diagStep >= 6 ? (i + 1) <= diagStep - 6 : false;
  };

  const hasLive = items.some(i => i.status === 'analyzing' || i.status === 'transcoding');

  // Layout constants
  const NODE_D = 38;        // node circle diameter
  const CONN_H = 28;        // connector height between node centres
  const ROW_H = NODE_D + CONN_H; // total vertical step

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 16px 18px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.025)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-label"><span>Processing Pipeline</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: hasLive ? 'var(--accent)' : 'var(--status-ready)',
            boxShadow: hasLive ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
            animation: hasLive ? 'pulseGlow 2s ease-in-out infinite' : 'none',
          }} />
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {hasLive ? 'Active' : 'Nominal'}
          </span>
        </div>
      </div>

      {/* Stage list — flex column, fully visible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>

        {/* Vertical rail behind all nodes */}
        <div style={{
          position: 'absolute',
          left: NODE_D / 2 - 1,
          top: NODE_D,
          width: 1,
          height: `calc(100% - ${NODE_D}px)`,
          background: 'var(--border)',
          zIndex: 0,
        }} />

        {STAGES.map((stage, i) => {
          const active = stageActive(stage.id);
          const hov = hovered === stage.id;
          const { Icon } = stage;

          return (
            <div key={stage.id} style={{ position: 'relative', zIndex: 1 }}>
              {/* Row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, height: NODE_D, cursor: 'pointer' }}
                onMouseEnter={() => setHovered(stage.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Node circle */}
                <div style={{
                  width: NODE_D, height: NODE_D, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${active ? 'var(--accent)' : hov ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
                  background: active ? 'rgba(245,158,11,0.08)' : hov ? 'rgba(245,158,11,0.04)' : 'var(--bg-elevated)',
                  boxShadow: active ? '0 0 16px rgba(245,158,11,0.25), inset 0 1px 0 rgba(245,158,11,0.1)' : 'none',
                  transition: 'all 200ms ease',
                }}>
                  <Icon size={14} style={{
                    color: active ? 'var(--accent)' : hov ? 'rgba(245,158,11,0.75)' : 'var(--text-tertiary)',
                    transition: 'color 180ms ease',
                  }} />
                </div>

                {/* Label + status */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="font-mono" style={{
                    fontSize: 11, letterSpacing: '0.04em',
                    color: active ? 'var(--accent)' : hov ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    transition: 'color 180ms ease',
                    display: 'block',
                  }}>
                    {stage.label}
                  </span>
                  {active && activeStages.has(stage.id) && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="font-mono"
                      style={{ fontSize: 9, color: 'var(--accent)', opacity: 0.7, letterSpacing: '0.06em' }}
                    >
                      RUNNING
                    </motion.span>
                  )}
                </div>

                {/* Inline tooltip on hover — replaces absolute panel */}
                <AnimatePresence>
                  {hov && (
                    <motion.div
                      initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        background: 'var(--bg-overlay)',
                        border: '1px solid var(--border-hover)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        pointerEvents: 'none',
                        flexShrink: 0,
                        maxWidth: 160,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                    >
                      {stage.info.codec && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}>Codec</span>
                          <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--text-primary)' }}>{stage.info.codec}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}>Time</span>
                        <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--text-primary)' }}>{stage.info.time}</span>
                      </div>
                      <p className="font-sans" style={{ fontSize: 9.5, color: 'var(--text-tertiary)', lineHeight: 1.5, marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                        {stage.info.action}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Connector segment between stages */}
              {i < STAGES.length - 1 && (
                <div style={{
                  position: 'relative', height: CONN_H, width: NODE_D,
                  display: 'flex', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {/* Animated flow particle */}
                  {connActive(i) && (
                    <div style={{
                      position: 'absolute', width: 1,
                      top: 0, bottom: 0,
                      background: 'rgba(245,158,11,0.15)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', width: '3px', left: '-1px',
                        height: 12,
                        background: 'linear-gradient(to bottom, transparent, var(--accent), transparent)',
                        animation: 'flowDown 1.4s linear infinite',
                      }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
