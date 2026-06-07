import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { listMedia, MediaItem, getMediaStatus } from '@/api/media';
import { getShareLinks } from '@/api/share';
import { formatBytes, formatRelativeTime } from '@/lib/utils';
import { UploadZone } from '@/components/UploadZone';
import { MediaCard } from '@/components/ui/MediaCard';
import { InfraCard } from '@/components/ui/InfraCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PipelineVisualization } from '@/components/pipeline/PipelineVisualization';
import { PageTransition, StaggerGrid, PulsingDot } from '@/components/common';
import { NumberTicker } from '@/components/NumberTicker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HardDrive, Activity, BarChart2, Film, Link, Search } from 'lucide-react';

interface ActivityItem {
  id: number;
  message: string;
  time: string;
}

function PipelineJobCard({ job, onClick }: { job: MediaItem; onClick: () => void }) {
  const [progress, setProgress] = useState(job.status === 'analyzing' ? 30 : 64);
  const [status, setStatus] = useState(job.status);

  useEffect(() => {
    if (status === 'ready' || status === 'failed') return;
    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await getMediaStatus(job.id);
        if (!mounted) return;
        setStatus(res.status as MediaItem['status']);
        setProgress(
          res.progress !== undefined ? res.progress
          : res.status === 'analyzing' ? 30
          : res.status === 'transcoding' ? 64
          : 100
        );
      } catch { /* ignore */ }
    }, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, [job.id, status]);

  const ext = job.filename.split('.').pop()?.toUpperCase() || '';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="flex-shrink-0 w-60 cursor-pointer group"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 12px',
        transition: 'border-color 150ms ease',
      }}
      whileHover={{ borderColor: 'var(--border-hover)' } as any}
    >
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <span className="font-mono text-[11.5px] text-[var(--text-primary)] truncate">{job.filename}</span>
        <StatusBadge status={status} />
      </div>
      <ProgressBar value={progress} height={1.5} color="amber" animated />
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[9.5px] text-[var(--text-tertiary)] uppercase tracking-[0.06em]">
          {status === 'analyzing' ? 'Analyzing' : `${progress}% encoded`}
        </span>
        <span className="font-mono text-[9.5px] text-[var(--text-tertiary)]">{ext}</span>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState('');
  const [activeLinks, setActiveLinks] = useState(0);
  const [savedBytes, setSavedBytes] = useState(0);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const navigate = useNavigate();

  // Parallax scroll ref
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY   = useTransform(scrollY, [0, 300], [0, -40]);
  const heroOp  = useTransform(scrollY, [0, 200], [1, 0.6]);

  // Cursor spotlight on grid
  const gridRef = useRef<HTMLDivElement>(null);
  const [spotPos, setSpotPos] = useState({ x: -999, y: -999 });
  const onGridMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  const onGridMouseLeave = () => setSpotPos({ x: -999, y: -999 });

  useEffect(() => {
    function handleActivity(event: CustomEvent<{ type: string; message: string }>) {
      setActivityFeed(prev => [{ id: Date.now(), message: event.detail.message, time: 'Just now' }, ...prev].slice(0, 8));
    }
    window.addEventListener('app-notification', handleActivity as EventListener);
    return () => window.removeEventListener('app-notification', handleActivity as EventListener);
  }, []);

  const fetchItems = async () => {
    try {
      const data = await listMedia();
      const mediaItems = data.items || [];
      setItems(mediaItems);
      setError(null);

      const linkResults = await Promise.allSettled(mediaItems.map(item => getShareLinks(item.id)));
      let totalActive = 0;
      linkResults.forEach(r => {
        if (r.status === 'fulfilled') totalActive += r.value.filter((l: { status: string }) => l.status === 'active').length;
      });
      setActiveLinks(totalActive);

      setSavedBytes(mediaItems.filter(i => i.codec === 'HEVC').reduce((acc, i) => acc + Math.round(i.size_bytes * 0.749), 0));

      setActivityFeed(prev => {
        if (prev.length > 0) return prev;
        return mediaItems.filter(i => i.status === 'ready').slice(0, 5).map((i, idx) => ({
          id: idx,
          message: `${i.filename} — ${i.codec} ${i.resolution}`,
          time: formatRelativeTime(i.created_at),
        }));
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeJobs = items.filter(i =>
    (i.status === 'analyzing' || i.status === 'transcoding') && i.id !== '24c57519-7f2e-406f-a303-1b4fce160c86'
  );
  const totalBytes = items.reduce((acc, i) => acc + (i.size_bytes || 0), 0);
  const filteredItems = query.trim()
    ? items.filter(i => i.filename.toLowerCase().includes(query.toLowerCase()) || (i.codec || '').toLowerCase().includes(query.toLowerCase()))
    : items;

  const hevcCount = items.filter(i => i.codec === 'HEVC').length;
  const compressionDisplay = savedBytes > 0 ? formatBytes(savedBytes) : '—';
  const compressionSubtext = savedBytes > 0 ? `${hevcCount} HEVC asset${hevcCount !== 1 ? 's' : ''}` : 'No optimized assets';

  return (
    <PageTransition>
      <ErrorBoundary onReset={fetchItems}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_332px] gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="min-w-0">

            {/* ── HERO ── */}
            <motion.div
              ref={heroRef}
              style={{ y: heroY, opacity: heroOp }}
              className="hero-lighting mb-7 pb-6"
              css-border-bottom="1px solid var(--border)"
            >
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 0 }}>
                {/* Parallax depth layer — sits behind text */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
                  background: 'radial-gradient(ellipse 50% 80% at 0% 50%, rgba(245,158,11,0.015) 0%, transparent 70%)',
                }} />
                <div className="flex items-baseline gap-3 mb-3">
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="font-sans font-semibold leading-none select-none"
                    style={{ fontSize: 26, letterSpacing: '-0.045em', color: 'var(--text-primary)' }}
                  >
                    AdaptFlow
                  </motion.h1>
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.12 }}
                    className="font-mono hidden sm:block select-none"
                    style={{ fontSize: 11.5, color: 'var(--text-tertiary)', letterSpacing: '-0.01em' }}
                  >
                    Media Infrastructure &amp; Secure Distribution
                  </motion.span>
                </div>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center gap-5 font-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}
                >
                  <span className="flex items-center gap-1.5"><PulsingDot color="emerald" />{items.length} assets</span>
                  <span className="flex items-center gap-1.5"><PulsingDot color="amber" />{activeJobs.length} processing</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--text-tertiary)', opacity: 0.5 }} />
                    {formatBytes(totalBytes)} managed
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* ── UPLOAD ZONE ── */}
            <div className="mb-7">
              <UploadZone />
            </div>

            {/* ── PIPELINE (mobile) ── */}
            <div className="lg:hidden mb-7">
              <PipelineVisualization items={items} />
            </div>

            {/* ── ACTIVE JOBS ── */}
            <AnimatePresence>
              {activeJobs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="section-label mb-3">
                    <span>In Pipeline</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {activeJobs.map(job => (
                      <React.Fragment key={job.id}>
                        <PipelineJobCard
                          job={job as MediaItem}
                          onClick={() => { navigate(`/media/${job.id}`); }}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── ASSET LIBRARY ── */}
            <div>
              {/* Library header */}
              <div className="flex items-center justify-between mb-3">
                <div className="section-label">
                  <span>Asset Library</span>
                </div>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  type="text"
                  placeholder="Search assets…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full rounded-lg pl-9 pr-10 py-2 text-[13px] font-mono outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-mono cursor-pointer transition-colors"
                    style={{ fontSize: 10, color: 'var(--text-tertiary)' }}
                  >
                    clear
                  </button>
                )}
              </div>

              {/* States */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array(4).fill(0).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl"
                      style={{ height: 196, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    />
                  ))}
                </div>
              ) : error ? (
                <div
                  className="flex flex-col items-center justify-center py-14 text-center rounded-xl"
                  style={{ border: '1px dashed rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.03)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <Activity size={16} className="text-red-400 animate-pulse" />
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-red-400 mb-1">Failed to load library</p>
                  <p className="font-sans text-[12px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {error.message || 'Connection error'}
                  </p>
                  <button onClick={fetchItems} className="btn-secondary text-[11px]">Retry</button>
                </div>
              ) : items.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 text-center rounded-xl"
                  style={{ border: '1px dashed var(--border)' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                  >
                    <Film size={16} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <p className="font-sans text-[14px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    No assets ingested
                  </p>
                  <p className="font-mono text-[11px] mb-5" style={{ color: 'var(--text-tertiary)' }}>
                    Upload a video file to begin
                  </p>
                  <button
                    onClick={() => document.querySelector<HTMLInputElement>('[data-upload-trigger]')?.click()}
                    className="btn-secondary text-[11px]"
                  >
                    Upload first asset
                  </button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-14 text-center rounded-xl"
                  style={{ border: '1px dashed var(--border)' }}
                >
                  <Search size={16} className="mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="font-sans text-[13px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                    No assets match{' '}
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>"{query}"</span>
                  </p>
                  <button onClick={() => setQuery('')} className="mt-2 font-mono cursor-pointer" style={{ fontSize: 11, color: 'var(--accent)' }}>
                    Clear search
                  </button>
                </div>
              ) : (
                <div
                  ref={gridRef}
                  onMouseMove={onGridMouseMove}
                  onMouseLeave={onGridMouseLeave}
                  style={{ position: 'relative' }}
                >
                  {/* Cursor spotlight on grid */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 12, zIndex: 0,
                    background: `radial-gradient(280px circle at ${spotPos.x}px ${spotPos.y}px, rgba(245,158,11,0.055) 0%, transparent 70%)`,
                    transition: 'background 80ms ease',
                  }} />
                  <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 gap-3" staggerDelay={0.035}>
                    {filteredItems.map(item => (
                      <div key={item.id} style={{ position: 'relative', zIndex: 1 }}>
                        <MediaCard item={item} onClick={() => navigate(`/media/${item.id}`)} />
                      </div>
                    ))}
                  </StaggerGrid>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div
            className="hidden lg:flex flex-col gap-4 overflow-y-auto pb-8"
            style={{ maxHeight: 'calc(100vh - 4rem)', scrollbarWidth: 'none' }}
          >
            {/* Pipeline */}
            <PipelineVisualization items={items} />

            {/* System metrics */}
            <div>
              <div className="section-label mb-3">
                <span>System Overview</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <InfraCard label="Total Assets" value={<NumberTicker value={items.length} />} icon={<HardDrive size={13} />} />
                <InfraCard label="Storage Used" value={formatBytes(totalBytes)} icon={<HardDrive size={13} />} />
                <InfraCard label="Compression Saved" value={compressionDisplay} subtext={compressionSubtext} icon={<BarChart2 size={13} />} />
                <InfraCard label="Active Links" value={<NumberTicker value={activeLinks} />} icon={<Link size={13} />} />
              </div>
            </div>

            {/* Activity feed */}
            <div>
              <div className="section-label mb-3">
                <span>System Activity</span>
              </div>
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {activityFeed.length === 0 ? (
                  <div className="px-4 py-6 text-center font-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    No activity yet
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {activityFeed.map((item, i) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 px-4 py-2.5"
                        style={{ borderBottom: i < activityFeed.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        <span className="font-sans flex-1 leading-snug" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          {item.message}
                        </span>
                        <span className="font-mono shrink-0 w-14 text-right" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
