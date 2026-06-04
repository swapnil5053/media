import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getDelivery } from '@/api/delivery';
import { reportPlayback } from '@/api/analytics';
import { API_BASE } from '@/api/client';
import { Lock, Clock, EyeOff, AlertTriangle } from 'lucide-react';
import { PageTransition } from '@/components/common';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function Viewer() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number, message: string } | null>(null);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<{ stream_url: string, media_id: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const sessionActive = useRef(false);

  const fetchContent = async (overridePwd?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDelivery(slug!, overridePwd || undefined);
      setData(res);
      sessionActive.current = true;
    } catch (err: any) {
      if (err.status === 401) {
          setError({ status: 401, message: 'Password required' });
      } else if (err.status === 410) {
          setError({ status: 410, message: 'This link has expired.' });
      } else if (err.status === 429) {
          setError({ status: 429, message: 'View limit reached.' });
      } else {
          setError({ status: 404, message: 'Link not found or unavailable.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    
    return () => {
        // Report final playback time on unmount if session active
        if (sessionActive.current && data && playerRef.current) {
            const time = playerRef.current.currentTime();
            const dur = playerRef.current.duration();
            const completion = dur > 0 ? time / dur : 0;
            // Best effort reporting
            navigator.sendBeacon(
                `${API_BASE}/media/${data.media_id}/playback-event`,
                JSON.stringify({ slug, duration: time, completion })
            );
        }
    };
  }, [slug]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContent(password);
  };

  // Setup Player
  useEffect(() => {
    if (!data || !videoRef.current) return;
    
    playerRef.current = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        aspectRatio: '16:9',
        sources: [{ src: data.stream_url, type: data.stream_url.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }]
    });

    playerRef.current.on('ended', () => {
        reportPlayback(data.media_id, slug!, playerRef.current.duration(), 1.0).catch(console.error);
    });

    return () => {
        if (playerRef.current) playerRef.current.dispose();
    };
  }, [data]);

  if (loading) {
     return (
       <PageTransition>
         <div className="min-h-screen bg-black flex flex-col items-center justify-center text-[var(--text-primary)]">
           <div className="flex flex-col items-center gap-4">
             <div className="relative w-12 h-12">
               <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
               <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent)] animate-spin" />
             </div>
             <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] animate-pulse">
               Connecting to node...
             </div>
           </div>
         </div>
       </PageTransition>
     );
  }

  if (error) {
      if (error.status === 401) {
          return (
              <PageTransition>
                  <div className="min-h-screen bg-black flex items-center justify-center text-[var(--text-primary)] px-4">
                      <form onSubmit={handlePasswordSubmit} className="bg-[var(--bg-elevated)] border border-[var(--border)] p-8 rounded-xl max-w-sm w-full text-center shadow-2xl transition-all duration-300 hover:border-[var(--border-hover)]">
                         <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-6 h-6 text-[var(--accent)]" />
                         </div>
                         <h2 className="font-sans text-xl font-bold mb-2 tracking-tight">Security Protocol</h2>
                         <p className="text-[var(--text-secondary)] text-sm mb-6">This transmission is encrypted. Please enter the access credential.</p>
                         <input 
                           type="password" autoFocus required value={password} onChange={e=>setPassword(e.target.value)}
                           className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded px-4 py-2.5 mb-4 text-center font-mono placeholder:font-sans focus:border-[var(--accent)] outline-none transition-colors"
                           placeholder="Access Key"
                         />
                         <button type="submit" className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-black font-semibold rounded py-2.5 transition-colors cursor-pointer uppercase tracking-wider font-mono text-xs">Unlock Stream</button>
                      </form>
                  </div>
              </PageTransition>
          );
      }
      
      const IconBase = error.status === 410 ? Clock : error.status === 429 ? EyeOff : AlertTriangle;
      const statusTitle = error.status === 410 ? 'Link Expired' : error.status === 429 ? 'Access Limit Exceeded' : 'Transmission Offline';
      
      return (
          <PageTransition>
              <div className="min-h-screen bg-black flex items-center justify-center text-[var(--text-primary)] px-4">
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-8 rounded-xl max-w-md w-full text-center shadow-2xl transition-all duration-300 hover:border-[var(--border-hover)]">
                     <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                        <IconBase className="w-6 h-6 text-red-400" />
                     </div>
                     <h2 className="font-sans text-xl font-bold mb-2 tracking-tight">{statusTitle}</h2>
                     <p className="text-[var(--text-secondary)] text-sm mb-8">{error.message}</p>
                     <div className="border-t border-[var(--border)] pt-6">
                        <p className="text-[var(--text-tertiary)] text-[9px] font-mono uppercase tracking-widest">AdaptFlow Delivery Network</p>
                     </div>
                  </div>
              </div>
          </PageTransition>
      );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-black flex flex-col justify-center items-center py-12 px-6">
         <div className="w-full max-w-5xl">
            <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-2xl relative mb-4">
               <video ref={videoRef} className="video-js vjs-adaptflow" />
            </div>
            <div className="flex justify-center mt-6">
                <div className="px-4 py-1.5 rounded-full border border-[var(--status-ready)]/20 bg-[var(--status-ready)]/5 text-[var(--status-ready)] font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-ready)] animate-pulse"></div>
                   Optimized for your device · Universal HD
                </div>
            </div>
         </div>
         <div className="flex w-full max-w-5xl justify-between items-end mt-auto pt-16 uppercase font-mono text-[10px] text-[var(--text-tertiary)] tracking-widest">
             <div className="flex gap-8 text-[var(--status-ready)]">
                 <div>Latency<br/><span className="text-[var(--text-secondary)]">14ms (Edge)</span></div>
                 <div>Environment<br/><span className="text-[var(--text-secondary)]">Native Decoder</span></div>
             </div>
             <div className="opacity-50">AdaptFlow v2.4.0</div>
         </div>
      </div>
    </PageTransition>
  );
}
