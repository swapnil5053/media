import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMedia, MediaItem, getMediaStatus } from '@/api/media';
import { formatBytes } from '@/lib/utils';
import { UploadZone } from '@/components/UploadZone';
import { MediaCard } from '@/components/ui/MediaCard';
import { InfraCard } from '@/components/ui/InfraCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PipelineVisualization } from '@/components/pipeline/PipelineVisualization';
import { PageTransition, StaggerGrid, PulsingDot } from '@/components/common';
import { NumberTicker } from '@/components/NumberTicker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HardDrive, Activity, BarChart2, Film, Link } from 'lucide-react';

interface ActivityItem {
  id: number;
  message: string;
  time: string;
}

function PipelineJobCard({ job, onClick }: { job: MediaItem; onClick: () => void; key?: any }) {
  const [progress, setProgress] = useState(job.status === 'analyzing' ? 30 : 64);
  const [status, setStatus] = useState(job.status);

  useEffect(() => {
    if (status === 'ready' || status === 'failed') return;

    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await getMediaStatus(job.id);
        if (!mounted) return;
        setStatus(res.status as any);
        if (res.progress !== undefined) {
          setProgress(res.progress);
        } else {
          setProgress(res.status === 'analyzing' ? 30 : res.status === 'transcoding' ? 64 : 100);
        }
      } catch (err) {
        console.error("Failed to fetch job status:", err);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [job.id, status]);

  const ext = job.filename.split('.').pop()?.toUpperCase() || '';
  const labelText = status === 'analyzing' 
    ? 'ANALYZING' 
    : `${progress}% TRANSCODED`;

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-64 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 cursor-pointer hover:border-[var(--border-hover)] transition-colors"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[12px] text-[var(--text-primary)] truncate pr-2">
          {job.filename}
        </span>
        <StatusBadge status={status} />
      </div>
      <div className="mt-2.5">
        <ProgressBar value={progress} height={2} color="amber" animated={true} className="rounded-full" />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{labelText}</span>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{ext}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  // Activity feed — separate listener from AppLayout notifications
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([
    { id: 1, message: 'demo_video.mp4 transcoding complete', time: '2m ago' },
    { id: 2, message: 'Optimization pipeline started', time: '15m ago' },
    { id: 3, message: 'Secure link generated', time: '1h ago' },
  ]);

  useEffect(() => {
    function handleActivity(event: CustomEvent<{ type: string; message: string }>) {
      setActivityFeed(prev => {
        const next = [
          { id: Date.now(), message: event.detail.message, time: 'Just now' },
          ...prev,
        ];
        return next.slice(0, 8);
      });
    }
    window.addEventListener('app-notification', handleActivity as EventListener);
    return () => window.removeEventListener('app-notification', handleActivity as EventListener);
  }, []);

  const fetchItems = async () => {
    try {
      const data = await listMedia();
      setItems(data.items || []);
      setError(null);
    } catch (e: any) {
      console.error("Dashboard failed to listMedia:", e);
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

  const activeJobs = items.filter(i => (i.status === 'analyzing' || i.status === 'transcoding') && i.id !== '24c57519-7f2e-406f-a303-1b4fce160c86');
  const totalBytes = items.reduce((acc, i) => acc + (i.size_bytes || 0), 0);

  // Compute values for InfraCards
  const totalAssets = items.length;
  const storageUsed = formatBytes(totalBytes);
  const compressionSaved = items.filter(i => i.codec === 'HEVC').length;
  const activeLinks = 0; // Mocked links count or unknown '—'

  return (
    <PageTransition>
      <ErrorBoundary onReset={fetchItems}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

          {/* ── Left Column ── */}
          <div>
            {/* Hero */}
            <div className="hero-lighting mb-8">
              <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] leading-none">
                AdaptFlow
              </h1>
              <p className="text-[15px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                Media Infrastructure &amp; Secure Video Distribution
              </p>
              <div className="flex items-center gap-5 mt-5 font-mono text-[11px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-2">
                  <PulsingDot color="emerald" /> {items.length} Assets
                </span>
                <span className="flex items-center gap-2">
                  <PulsingDot color="amber" /> {activeJobs.length} Processing
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
                  {formatBytes(totalBytes)} Managed
                </span>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="mb-8">
              <UploadZone />
            </div>

            {/* Pipeline Visualization — mobile only (stacks below upload) */}
            <div className="lg:hidden mb-8">
              <PipelineVisualization items={items} />
            </div>

            {/* Processing Queue */}
            {activeJobs.length > 0 && (
              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">
                  In Pipeline
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {activeJobs.map(job => (
                    <PipelineJobCard
                      key={job.id}
                      job={job}
                      onClick={() => navigate(`/media/${job.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Asset Library */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Asset Library
                </span>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl h-[200px] animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-500/30 bg-red-500/5 rounded-xl text-[var(--text-tertiary)]">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                    <Activity className="w-5 h-5 text-red-400 animate-pulse" />
                  </div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-red-400">Failed to load asset library</p>
                  <p className="font-sans text-[13px] text-[var(--text-tertiary)] mt-1 mb-4">
                    {error.message || 'Check connection to the infrastructure node.'}
                  </p>
                  <button
                    onClick={fetchItems}
                    className="text-[12px] font-medium text-[var(--accent)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)] px-4 py-1.5 rounded-md transition-colors"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border border-dashed border-[var(--border)] rounded-xl">
                  <div className="w-14 h-14 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mb-4">
                    <Film size={18} className="text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-[14px] text-[var(--text-secondary)] font-medium">No assets ingested</p>
                  <p className="text-[12px] font-mono text-[var(--text-tertiary)] mt-1 mb-5">
                    Upload a video file to begin processing
                  </p>
                  <button
                    onClick={() => document.querySelector<HTMLInputElement>('[data-upload-trigger]')?.click()}
                    className="text-[12px] font-medium text-[var(--accent)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)] px-4 py-1.5 rounded-md transition-colors"
                  >
                    Upload first asset
                  </button>
                </div>
              ) : (
                <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.04}>
                  {items.map(item => (
                    <div key={item.id}>
                      <MediaCard
                        item={item}
                        onClick={() => navigate(`/media/${item.id}`)}
                      />
                    </div>
                  ))}
                </StaggerGrid>
              )}
            </div>
          </div>

          {/* ── Right Column (sticky + independently scrollable on desktop) ── */}
          <div className="hidden lg:block overflow-y-auto max-h-[calc(100vh-4rem)] pr-2" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-4 pb-8">
              {/* Pipeline Visualization — desktop */}
              <PipelineVisualization items={items} />

              {/* System Overview */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">
                  System Overview
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfraCard
                    label="Total Assets"
                    value={<NumberTicker value={totalAssets} />}
                    icon={<HardDrive className="w-3.5 h-3.5" />}
                  />
                  <InfraCard
                    label="Storage Used"
                    value={storageUsed}
                    icon={<HardDrive className="w-3.5 h-3.5" />}
                  />
                  <InfraCard
                    label="Compression Saved"
                    value={<NumberTicker value={compressionSaved} />}
                    subtext="HEVC optimized"
                    icon={<BarChart2 className="w-3.5 h-3.5" />}
                  />
                  <InfraCard
                    label="Active Links"
                    value={activeLinks === 0 ? '0' : '—'}
                    icon={<Link className="w-3.5 h-3.5" />}
                  />
                </div>
              </div>

              {/* Activity Feed */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">
                  System Activity
                </div>
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
                  <div className="max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {activityFeed.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0"
                      >
                        <span className="font-sans text-[13px] text-[var(--text-secondary)] flex-1 leading-snug">
                          {item.message}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-tertiary)] whitespace-nowrap shrink-0 w-[55px] text-right">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
