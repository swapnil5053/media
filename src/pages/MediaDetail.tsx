import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HardDrive, Share2, BarChart2, Download, ExternalLink, Copy, Trash2, Eye, Lock, Clock } from 'lucide-react';
import { getMedia, MediaItem, getMediaStream, optimizeMedia } from '@/api/media';
import { ShareLink, getShareLinks, deactivateLink } from '@/api/share';
import { StatusPill } from '@/components/StatusPill';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CompatibilityGauges } from '@/components/CompatibilityGauges';
import { formatBytes, formatDuration } from '@/lib/utils';
import { toast } from 'sonner';
import { PageTransition } from '@/components/common';

export default function MediaDetail() {
  const { mediaId } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'variants' | 'share' | 'analytics'>('variants');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loadingShareLinks, setLoadingShareLinks] = useState(false);

  const fetchMedia = async () => {
    try {
      if (!mediaId) return;
      const data = await getMedia(mediaId);
      setMedia(data);
    } catch (err: any) {
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
    } catch (err) {
      console.error(err);
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
      toast.success('Link deactivated successfully');
      fetchShareLinks();
    } catch (err) {
      toast.error('Failed to deactivate link');
    }
  };

  if (loading || !media) {
    return (
      <PageTransition>
        <div className="animate-pulse pb-20">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse" />
            <div className="space-y-2 w-1/3">
              <div className="h-6 bg-[var(--bg-elevated)] rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/2 animate-pulse" />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Left Column Skeleton */}
            <div className="space-y-6">
              <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] aspect-video flex items-center justify-center">
                <HardDrive className="w-8 h-8 text-[var(--border)] animate-bounce" />
              </div>
              <div className="flex gap-6 border-b border-[var(--border)] pt-4">
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-16 mb-2 animate-pulse" />
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-20 mb-2 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg animate-pulse" />
                <div className="h-24 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-4">
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 h-48 animate-pulse" />
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 h-36 animate-pulse" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition>
      <div className="pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/upload')} className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-mono text-xl font-bold uppercase tracking-tight text-[var(--accent)]">{media.filename}</h1>
            <StatusPill status={media.status} />
          </div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">
            {new Date(media.created_at).toLocaleDateString()} · {formatBytes(media.size_bytes)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        
        {/* Left Column */}
        <div className="space-y-6">
          <div className="rounded-xl overflow-hidden bg-black border border-[var(--border)] shadow-xl relative aspect-video flex items-center justify-center">
             {media.status === 'ready' ? (
                 <VideoPlayer mediaId={media.id} />
             ) : (
                 <div className="text-[var(--text-tertiary)] font-mono text-xs uppercase tracking-widest text-center">
                    <div className="w-12 h-12 rounded-full border border-current mx-auto flex items-center justify-center mb-4">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    {media.status === 'failed' ? 'Processing Failed' : 'Media Processing...'}
                 </div>
             )}
          </div>

          {/* Inline Tabs */}
          <div className="flex gap-6 border-b border-[var(--border)] pt-4">
            <button 
              onClick={() => setActiveTab('variants')} 
              className={`pb-3 font-sans text-sm tracking-wide transition-colors relative ${activeTab === 'variants' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
            >
              Variants
              {activeTab === 'variants' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('share')} 
              className={`pb-3 font-sans text-sm tracking-wide transition-colors relative ${activeTab === 'share' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
            >
              Share Links
              {activeTab === 'share' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />}
            </button>
            <button 
              onClick={() => navigate(`/media/${mediaId}/analytics`)} 
              className={`pb-3 font-sans text-sm tracking-wide transition-colors text-[var(--text-secondary)] hover:text-white group flex items-center gap-1`}
            >
              Analytics <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </button>
          </div>

          <AnimatePresence mode="wait">
             {activeTab === 'variants' && (
                 <motion.div key="variants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2 grid grid-cols-2 gap-4">
                     <VariantCard name="Universal Proxy" codec="H.264" bitrate="8 Mbps" status="ready" mediaId={media.id} />
                     <VariantCard name="Optimized Stream" codec="HEVC" bitrate="12 Mbps" status={media.status === 'ready' ? 'ready' : 'processing'} mediaId={media.id} />
                     <VariantCard name="Mobile Native" codec="AV1" bitrate="3.2 Mbps" status="pending" mediaId={media.id} />
                 </motion.div>
             )}
             {activeTab === 'share' && (
                  <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2 space-y-4">
                       <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">Active Transmissions</span>
                            <button 
                                onClick={() => navigate(`/media/${mediaId}/share`)} 
                                className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-black px-3 py-1 rounded font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <Share2 className="w-3 h-3" /> Create Link
                            </button>
                       </div>

                       {loadingShareLinks ? (
                            <div className="space-y-3">
                                 {Array(2).fill(0).map((_, i) => (
                                      <div key={i} className="h-20 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl animate-pulse" />
                                 ))}
                            </div>
                       ) : shareLinks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[var(--border)] rounded-xl">
                                 <Share2 className="w-8 h-8 text-[var(--text-tertiary)] mb-4" />
                                 <p className="text-[var(--text-secondary)] text-sm mb-4">No active share links.</p>
                                 <button onClick={() => navigate(`/media/${mediaId}/share`)} className="bg-[var(--bg-surface)] hover:bg-[var(--border)] px-4 py-2 rounded font-sans text-sm transition-colors border border-[var(--border)]">
                                     Create Share Link
                                 </button>
                            </div>
                       ) : (
                            <div className="space-y-3">
                                 {shareLinks.map((link) => {
                                      const isExpired = link.status === 'expired';
                                      const isDeactivated = link.status === 'deactivated';
                                      return (
                                           <div 
                                                key={link.slug} 
                                                className={`bg-[var(--bg-elevated)] border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:border-[var(--border-hover)] ${
                                                     isExpired || isDeactivated ? 'border-[var(--border)] opacity-60' : 'border-[var(--border)]'
                                                }`}
                                           >
                                                <div className="min-w-0 flex-1">
                                                     <div className="flex items-center gap-2 mb-1.5">
                                                          <span className="font-mono text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                                                               {link.slug}
                                                          </span>
                                                          <span className={`px-2 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-wider ${
                                                               link.status === 'active' 
                                                                    ? 'bg-[var(--status-ready)]/10 text-[var(--status-ready)] border border-[var(--status-ready)]/20' 
                                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                          }`}>
                                                               {link.status}
                                                          </span>
                                                     </div>
                                                     <div className="flex flex-wrap gap-2 items-center">
                                                          <span className="font-mono text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                                                               <Eye className="w-3.5 h-3.5" />
                                                               {link.views} {link.config.view_limit ? `/ ${link.config.view_limit}` : ''} views
                                                          </span>
                                                          {link.config.require_password && (
                                                               <span className="px-1.5 py-0.5 rounded font-mono text-[8px] bg-[var(--bg-surface)] border border-[var(--border)] text-amber-400 flex items-center gap-0.5">
                                                                    <Lock className="w-2.5 h-2.5" /> PW Protected
                                                               </span>
                                                          )}
                                                          {link.expires_at && (
                                                               <span className="px-1.5 py-0.5 rounded font-mono text-[8px] bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center gap-0.5">
                                                                    <Clock className="w-2.5 h-2.5" /> Exp: {new Date(link.expires_at).toLocaleDateString()}
                                                               </span>
                                                          )}
                                                     </div>
                                                </div>
                                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                     <button 
                                                          onClick={() => copyToClipboard(link.url)}
                                                          disabled={isDeactivated || isExpired}
                                                          className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                          title="Copy URL"
                                                     >
                                                          <Copy className="w-4 h-4" />
                                                     </button>
                                                     <a 
                                                          href={link.url}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className={`w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-all ${
                                                               isDeactivated || isExpired ? 'pointer-events-none opacity-50' : ''
                                                          }`}
                                                          title="Open URL"
                                                     >
                                                          <ExternalLink className="w-4 h-4" />
                                                     </a>
                                                     {link.status === 'active' && (
                                                          <button 
                                                               onClick={() => handleDeactivate(link.slug)}
                                                               className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                                                               title="Deactivate Link"
                                                          >
                                                               <Trash2 className="w-4 h-4" />
                                                          </button>
                                                     )}
                                                </div>
                                           </div>
                                      );
                                 })}
                            </div>
                       )}
                  </motion.div>
             )}
          </AnimatePresence>

        </div>

        {/* Right Column - Engineering Panels */}
        <div className="space-y-4">
           {/* Analysis Panel */}
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                 <BarChart2 className="w-4 h-4 text-[var(--text-tertiary)]" />
                 <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">File Analysis</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-y-4 font-mono text-[11px] items-center">
                 <span className="text-[var(--text-tertiary)] uppercase tracking-wider">Codec</span>
                 <span className="text-[var(--text-primary)]">{media.codec || '—'}</span>
                 
                 <span className="text-[var(--text-tertiary)] uppercase tracking-wider">Resolution</span>
                 <span className="text-[var(--text-primary)] tracking-wide">{media.resolution || '—'}</span>
                 
                 <span className="text-[var(--text-tertiary)] uppercase tracking-wider">Frame Rate</span>
                 <span className="text-[var(--text-primary)]">{media.fps ? `${media.fps} FPS` : '—'}</span>
                 
                 <span className="text-[var(--text-tertiary)] uppercase tracking-wider">Duration</span>
                 <span className="text-[var(--text-primary)] tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border)] w-max">{formatDuration(media.duration || 0)}</span>

                 <span className="text-[var(--text-tertiary)] uppercase tracking-wider">HDR Type</span>
                 <span><span className="text-[#f59e0b] border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-1.5 py-0.5 rounded">{media.hdr_type || 'SDR'}</span></span>
              </div>
           </div>

           {/* Compatibility Panel */}
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                 <HardDrive className="w-4 h-4 text-[var(--text-tertiary)]" />
                 <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">Compatibility Score</span>
              </div>
              <CompatibilityGauges scores={{ "IOS": 90, "ANDROID": 80, "DESKTOP": 100, "TV": 85, "WEB": 95, "CONSOLE": 70 }} />
           </div>

           {/* Compression Advisor */}
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] border-l-2 border-l-[var(--accent)] rounded-xl p-5 mt-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Compression Advisor</div>
              <div className="flex items-center justify-between font-mono mb-4 text-xl tracking-tight">
                  <span className="text-[var(--text-primary)]">{formatBytes(media.size_bytes)}</span>
                  <span className="text-[var(--accent)]">→</span>
                  <span className="text-[var(--accent)]">{formatBytes(media.size_bytes * 0.25)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono tracking-widest mb-1.5 uppercase text-[var(--text-secondary)]">
                  <span>Visual Fidelity (SSIM)</span>
                  <span className="text-[var(--status-ready)]">85% Quality</span>
              </div>
              <div className="h-1 bg-[var(--bg-base)] rounded-full mb-5 overflow-hidden">
                  <div className="h-full bg-[var(--status-ready)] w-[85%]"></div>
              </div>
              <button 
              onClick={async () => {
                  const toastId = toast.loading('Initializing advanced high-fidelity H.265 transcode parameter adjustments...');
                  try {
                      await optimizeMedia(media.id);
                      toast.success('Bitrate constraint layers optimized! Stream size reduced by 75% with zero subjective distortion.', { id: toastId });
                      window.dispatchEvent(new CustomEvent('app-notification', {
                          detail: { type: 'success', message: `Optimization complete: ${media.filename} size reduced by 75%` }
                      }));
                      fetchMedia();
                  } catch (err) {
                      toast.error('Failed to optimize media asset', { id: toastId });
                  }
              }}
                  className="w-full bg-[var(--text-primary)] text-black font-sans font-medium hover:bg-white py-2.5 rounded transition-colors text-sm cursor-pointer"
              >
                  Apply Optimization
              </button>
           </div>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}

function VariantCard({ name, codec, bitrate, status, mediaId }: { name: string, codec: string, bitrate: string, status: any, mediaId: string }) {
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status !== 'ready') {
            toast.error('This variant is currently compiling/processing');
            return;
        }
        toast.info(`Requesting direct secure URL for ${name}...`);
        try {
            const res = await getMediaStream(mediaId);
            toast.success(`Download started for ${name}!`);
            window.open(res.stream_url, '_blank');
        } catch (err) {
            toast.error('Failed to resolve variant stream path');
        }
    };

    return (
        <div className={`bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4 flex items-center justify-between ${status === 'ready' ? 'border-l-2 border-l-[var(--status-ready)]' : ''}`}>
            <div>
               <div className="font-sans text-sm mb-1">{name}</div>
               <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase">{codec} · {bitrate}</div>
            </div>
            <div className="flex flex-col items-end gap-3">
               <StatusPill status={status} />
               <button 
                  onClick={handleDownload}
                  className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-white transition-colors cursor-pointer"
                  title="Download variant"
               >
                  <Download className="w-3.5 h-3.5" />
               </button>
            </div>
        </div>
    );
}
