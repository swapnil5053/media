import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMedia, MediaItem } from '@/api/media';
import { formatBytes } from '@/lib/utils';
import { UploadZone } from '@/components/UploadZone';
import { MediaCard } from '@/components/ui/MediaCard';
import { InfraCard } from '@/components/ui/InfraCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PipelineVisualization } from '@/components/pipeline/PipelineVisualization';
import { PageTransition, StaggerGrid, PulsingDot } from '@/components/common';
import { NumberTicker } from '@/components/NumberTicker';
import { HardDrive, Activity, Link2, BarChart2 } from 'lucide-react';

interface ActivityItem {
  id: number;
  message: string;
  time: string;
}

export default function Dashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeJobs = items.filter(i => i.status === 'analyzing' || i.status === 'transcoding');
  const readyItems = items.filter(i => i.status === 'ready');
  const totalBytes = items.reduce((acc, i) => acc + (i.size_bytes || 0), 0);

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

        {/* ── Left Column ── */}
        <div>
          {/* Hero */}
          <div className="hero-lighting mb-8">
            <h1 className="font-sans text-[32px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              AdaptFlow
            </h1>
            <p className="font-sans text-[18px] text-[var(--text-secondary)] tracking-[-0.01em] mt-1">
              Media Infrastructure & Secure Video Distribution
            </p>
            <div className="flex gap-6 mt-4 font-mono text-[12px] text-[var(--text-tertiary)]">
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
                  <div
                    key={job.id}
                    onClick={() => navigate(`/media/${job.id}`)}
                    className="flex-shrink-0 w-64 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 cursor-pointer hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[12px] text-[var(--text-primary)] truncate pr-2">
                        {job.filename}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                    <ProgressBar
                      value={job.status === 'analyzing' ? 30 : 64}
                      height={2}
                      color="amber"
                      animated
                    />
                    <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-1.5 uppercase tracking-[0.08em]">
                      {job.status === 'analyzing' ? 'Metadata extraction' : '64% transcoded'}
                    </div>
                  </div>
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
            ) : items.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center text-[var(--text-tertiary)]">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-20 mb-4">
                  <rect x="4" y="8" width="40" height="32" rx="2" stroke="var(--border-hover)" strokeWidth="1.5" strokeDasharray="4 3" />
                  <circle cx="24" cy="24" r="6" stroke="var(--border-hover)" strokeWidth="1.5" />
                  <polygon points="22,21 22,27 27,24" fill="var(--border-hover)" />
                </svg>
                <p className="font-mono text-[12px] uppercase tracking-[0.08em]">No assets ingested</p>
                <p className="font-sans text-[13px] text-[var(--text-tertiary)] mt-1">Drop a video file above to get started</p>
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

        {/* ── Right Column (sticky on desktop) ── */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
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
                  value={<NumberTicker value={items.length} />}
                  icon={<HardDrive className="w-3.5 h-3.5" />}
                />
                <InfraCard
                  label="Storage"
                  value={formatBytes(totalBytes)}
                  icon={<HardDrive className="w-3.5 h-3.5" />}
                />
                <InfraCard
                  label="Processing"
                  value={<NumberTicker value={activeJobs.length} />}
                  variant={activeJobs.length > 0 ? 'processing' : 'default'}
                  icon={<Activity className="w-3.5 h-3.5" />}
                />
                <InfraCard
                  label="Compressed"
                  value={formatBytes(totalBytes * 0.25)}
                  subtext="↓ 75% avg"
                  icon={<BarChart2 className="w-3.5 h-3.5" />}
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
    </PageTransition>
  );
}
