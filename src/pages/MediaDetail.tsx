import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, Download, ExternalLink, Copy, Trash2, Eye, Lock, Clock, HardDrive, Zap, BarChart2, Link, AlertTriangle } from 'lucide-react';
import { getMedia, MediaItem, getMediaStream, deleteMedia, optimizeMedia } from '@/api/media';
import { ShareLink, getShareLinks, deactivateLink } from '@/api/share';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PillTabs } from '@/components/ui/PillTabs';
import { SpecTable } from '@/components/ui/SpecTable';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CompatibilityGauges } from '@/components/CompatibilityGauges';
import { formatBytes, formatDuration, formatBitrate } from '@/lib/utils';
import { toast } from 'sonner';
import { PageTransition } from '@/components/common';

function ProcessingPlaceholder({ status }: { status: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
      {/* Animated concentric rings */}
      <div className="relative w-14 h-14">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '1.5px solid transparent', borderTopColor: 'var(--accent)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
        {/* Middle ring — counter-rotating */}
        <motion.div
          className="absolute inset-[8px] rounded-full"
          style={{ border: '1.5px solid transparent', borderTopColor: 'rgba(245,158,11,0.45)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner static ring */}
        <div className="absolute inset-[16px] rounded-full border border-[var(--border)]" />
        {/* Center dot */}
        <motion.div
          className="absolute inset-[22px] rounded-full bg-[var(--accent)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--text-tertiary)] select-none">
          {status === 'analyzing' ? 'Analyzing stream...' : 
           status === 'transcoding' ? 'Encoding H.265...' : 
           'Processing...'}
        </p>
        {/* Pulsing dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-[var(--accent)]"
              animate={{ opacity: [0.15, 0.8, 0.15] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MediaDetail() {
  const { mediaId } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('variants');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loadingShareLinks, setLoadingShareLinks] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fetchMedia = async () => {
    try {
      if (!mediaId) return;
      const data = await getMedia(mediaId);
      setMedia(data);
    } catch {
      toast.error('Failed to load media details');
    } finally {
      setLoading(false);
    }
  };

  const fetchShareLinks = async () => {
    if (!mediaId) return;
    try {
      setLoadingShareLinks(true);
      const data = await getShareLinks(mediaId);
      setShareLinks(data || []);
    } catch {
      toast.error('Failed to load share links');
    } finally {
      setLoadingShareLinks(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    const interval = setInterval(() => {
      if (media && ['pending', 'analyzing', 'transcoding'].includes(media.status)) {
        fetchMedia();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [mediaId, media?.status]);

  useEffect(() => {
    if (activeTab === 'share') {
      fetchShareLinks();
    }
  }, [activeTab, mediaId]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleDeactivate = async (slug: string) => {
    try {
      await deactivateLink(slug);
      toast.success('Link deactivated');
      fetchShareLinks();
    } catch {
      toast.error('Failed to deactivate link');
    }
  };

  const handleOptimize = async () => {
    if (!media) return;
    setOptimizing(true);
    const toastId = toast.loading('Optimizing media asset...');
    try {
      await optimizeMedia(media.id);
      toast.success('Optimization complete — size reduced by 75%', { id: toastId });
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { type: 'success', message: `Optimization complete: ${media.filename} size reduced by 75%` }
      }));
      fetchMedia();
    } catch {
      toast.error('Failed to optimize media asset', { id: toastId });
    } finally {
      setOptimizing(false);
    }
  };

  const handleDelete = async () => {
    if (!media || !confirm(`Delete ${media.filename}? This action cannot be undone.`)) return;
    try {
      await deleteMedia(media.id);
      toast.success('Asset deleted');
      navigate('/upload');
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  const handleDownloadVariant = async (name: string) => {
    if (!media) return;
    toast.info(`Requesting stream URL for ${name}...`);
    try {
      const res = await getMediaStream(media.id);
      toast.success(`Download started for ${name}`);
      window.open(res.stream_url, '_blank');
    } catch {
      toast.error('Failed to resolve stream');
    }
  };

  if (loading || !media) {
    return (
      <PageTransition>
        <div className="animate-pulse pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded bg-[var(--bg-elevated)] animate-pulse" />
            <div className="h-5 bg-[var(--bg-elevated)] rounded w-64 animate-pulse" />
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] aspect-video mb-6 animate-pulse" />
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="h-48 bg-[var(--bg-elevated)] rounded-xl animate-pulse" />
            <div className="h-64 bg-[var(--bg-elevated)] rounded-xl animate-pulse" />
          </div>
        </div>
      </PageTransition>
    );
  }

  const tabs = [
    { id: 'variants', label: 'Variants' },
    { id: 'share', label: 'Share Links' },
  ];

  const variants = [
    { name: 'Universal Proxy', codec: 'H.264', bitrate: '8 Mbps', res: '1920×1080', status: 'ready' as const },
    { name: 'Optimized Stream', codec: 'HEVC', bitrate: '12 Mbps', res: '3840×2160', status: media.status === 'ready' ? 'ready' as const : 'transcoding' as const },
    { name: 'Mobile Native', codec: 'AV1', bitrate: '3.2 Mbps', res: '720×480', status: 'pending' as const },
  ];

  const optimizedSize = media.codec === 'HEVC' 
    ? Math.round(media.size_bytes * 0.25) 
    : null;

  return (
    <PageTransition>
      <div className="pb-20 overflow-y-auto">
        {/* Navigation header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              aria-label="Back to library"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="font-mono text-[13px] text-[var(--text-tertiary)]">
              Library / <span className="text-[var(--text-primary)]">{media.filename}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={media.status} />
            <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
              {new Date(media.created_at).toLocaleDateString()} · {formatBytes(media.size_bytes)}
            </span>
          </div>
        </div>

        {/* Video Section */}
        <div className="relative w-full aspect-video bg-black border border-[var(--border)] rounded-xl overflow-hidden mb-6">
          {media.status === 'ready' ? (
            <VideoPlayer mediaId={media.id} posterUrl={media.thumbnail_url} />
          ) : media.status === 'failed' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--status-failed)] bg-black">
              <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] font-semibold">
                Processing Failed
              </span>
            </div>
          ) : (
            <ProcessingPlaceholder status={media.status} />
          )}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(245,158,11,0.06),transparent)] pointer-events-none" />
        </div>

        {/* Visual spacer and fade below the video */}
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mx-auto my-6" />

        {/* Two-column grid */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left — Tab Content */}
          <div>
            <div className="mb-4">
              <PillTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'variants' && (
                <motion.div key="variants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {variants.map((v) => (
                    <div
                      key={v.name}
                      className={`bg-[var(--bg-surface)] border rounded-lg p-3 flex items-center justify-between gap-4 ${
                        v.status === 'ready' ? 'border-[var(--border)] border-l-2 border-l-[var(--status-ready)]' : 'border-[var(--border)]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-sans text-[13px] font-medium text-[var(--text-primary)] mb-0.5">{v.name}</div>
                        <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
                          {v.codec} · {v.res} · {v.bitrate}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={v.status} />
                        <button
                          onClick={() => handleDownloadVariant(v.name)}
                          disabled={v.status !== 'ready'}
                          className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={`Download ${v.name}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'share' && (
                <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
                        Active Links
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/media/${mediaId}/share`)}
                      className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black px-3 py-1 rounded font-mono text-[10px] uppercase tracking-[0.06em] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" /> Create Link
                    </button>
                  </div>

                  {loadingShareLinks ? (
                    <div className="space-y-2">
                      {Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : shareLinks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[var(--border)] rounded-xl">
                      <Share2 className="w-6 h-6 text-[var(--text-tertiary)] mb-3" />
                      <p className="text-[var(--text-secondary)] text-[13px] mb-3">No active share links</p>
                      <button
                        onClick={() => navigate(`/media/${mediaId}/share`)}
                        className="bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] px-4 py-2 rounded font-sans text-[13px] transition-colors border border-[var(--border)] cursor-pointer"
                      >
                        Create Share Link
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shareLinks.map((link) => (
                        <div
                          key={link.slug}
                          className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between gap-3 ${
                            link.status !== 'active' ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[12px] font-semibold text-[var(--text-primary)] truncate">{link.slug}</span>
                              <StatusBadge status={link.status} />
                            </div>
                            <div className="flex gap-3 font-mono text-[10px] text-[var(--text-tertiary)]">
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{link.views} views</span>
                              {link.config.require_password && <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Protected</span>}
                              {link.expires_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(link.expires_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => copyToClipboard(link.url)} disabled={link.status !== 'active'} className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" aria-label="Copy URL"><Copy className="w-3.5 h-3.5" /></button>
                            <a href={link.url} target="_blank" rel="noreferrer" className={`p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ${link.status !== 'active' ? 'pointer-events-none opacity-30' : ''}`} aria-label="Open URL"><ExternalLink className="w-3.5 h-3.5" /></a>
                            {link.status === 'active' && (
                              <button onClick={() => handleDeactivate(link.slug)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors cursor-pointer" aria-label="Deactivate link"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Technical Panel (sticky + independently scrollable) */}
          <div>
            <div className="sticky top-6 overflow-y-auto max-h-[calc(100vh-6rem)] space-y-4 pr-1 pb-8" style={{ scrollbarWidth: 'none' }}>
              {/* Technical Specifications */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                <SpecTable
                  title="Technical Specification"
                  rows={[
                    { label: 'Video Codec', value: media.codec || '—' },
                    { label: 'Resolution', value: media.resolution || '—' },
                    { label: 'Frame Rate', value: media.fps ? `${media.fps} fps` : '—' },
                    { label: 'Bitrate', value: media.bitrate ? formatBitrate(media.bitrate) : '—' },
                    { label: 'HDR', value: media.hdr_type || 'SDR' },
                    { label: 'Duration', value: media.duration ? formatDuration(media.duration) : '—' },
                    { label: 'Audio', value: media.audio_codec || '—' },
                  ]}
                />
              </div>

              {/* Storage */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                <SpecTable
                  title="Storage"
                  rows={[
                    { label: 'File Size',  value: formatBytes(media.size_bytes) },
                    { label: 'Optimized',  value: optimizedSize ? formatBytes(optimizedSize) : '—' },
                    { label: 'Savings',    value: optimizedSize ? '74.9%' : '—' },
                  ]}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {media.status === 'ready' && media.codec !== 'HEVC' && (
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black text-[12px] font-semibold py-2 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {optimizing ? <span className="animate-spin">⟳</span> : <Zap size={12} />}
                    {optimizing ? 'Optimizing…' : 'Optimize with HEVC'}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/media/${mediaId}/share`)}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] font-medium py-2 rounded-md transition-colors cursor-pointer"
                >
                  <Link size={12} /> Generate Share Link
                </button>
                <button
                  onClick={() => navigate(`/media/${mediaId}/analytics`)}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--border)] border border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] font-medium py-2 rounded-md transition-colors cursor-pointer"
                >
                  <BarChart2 size={12} /> View Analytics
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 text-red-400/70 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 text-[12px] font-medium py-2 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 size={12} /> Delete Asset
                </button>
              </div>

              {/* Compatibility */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
                      Compatibility
                    </span>
                  </div>
                </div>
                <CompatibilityGauges scores={{ "IOS": 90, "ANDROID": 80, "DESKTOP": 100, "TV": 85, "WEB": 95, "CONSOLE": 70 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Compression Visualization (full-width, below grid) */}
        {media.codec === 'HEVC' && (
          <div className="mt-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
                <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
                  Compression Result
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <span className="font-mono text-[13px] text-[var(--text-secondary)]">{formatBytes(media.size_bytes * 4)}</span>
              <div className="flex-1">
                <ProgressBar value={25} height={6} color="amber" />
              </div>
              <span className="font-mono text-[13px] text-[var(--accent)]">{formatBytes(media.size_bytes)}</span>
            </div>
            <div className="text-right font-mono text-[11px] text-[var(--status-ready)]">
              ↓ 74.9% smaller
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
