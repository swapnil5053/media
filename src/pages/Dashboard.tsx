import React, { useEffect, useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { StatusPill } from '@/components/StatusPill';
import { UploadCloud } from 'lucide-react';
import { listMedia, MediaItem } from '@/api/media';
import { formatBytes } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { PageTransition, StaggerGrid } from '@/components/common';

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 h-[140px] animate-pulse flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="h-4 bg-[var(--bg-surface)] rounded w-1/2"></div>
        <div className="h-5 bg-[var(--bg-surface)] rounded-full w-16"></div>
      </div>
      <div>
         <div className="h-3 bg-[var(--bg-surface)] rounded w-1/4 mb-4"></div>
         <div className="border-t border-[var(--border)] pt-3 flex justify-between">
            <div className="h-3 bg-[var(--bg-surface)] rounded w-16"></div>
            <div className="h-3 bg-[var(--bg-surface)] rounded w-20"></div>
         </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  return (
    <PageTransition>
      <div className="mb-10 lg:grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Ingest Hub</h1>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">Initialize your workflow by deploying new video assets to the processing cluster.</p>
            <UploadZone />
        </div>
        
        <div className="mt-8 lg:mt-0">
          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-4">
             <span>Processing Queue</span>
             <span className="text-[var(--accent)]">{activeJobs.length} Active</span>
          </div>
          
          <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-4 min-h-[360px] flex flex-col">
             {activeJobs.length === 0 ? (
                 <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-full border border-[var(--status-ready)]/30 flex items-center justify-center mb-4 text-[var(--status-ready)]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="font-sans text-lg mb-1">All caught up</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Cluster is currently in low-power standby mode.</p>
                 </div>
             ) : (
                 <div className="space-y-4">
                    {activeJobs.map(job => (
                        <div key={job.id} className="text-xs">
                           <div className="flex justify-between text-[var(--accent)] font-mono mb-1">
                               <span>Transcoding</span>
                               <span>{job.status === 'analyzing' ? 'META' : '64%'}</span>
                           </div>
                           <div className="font-mono text-[var(--text-secondary)] mb-2 truncate">{job.filename}</div>
                           <div className="h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                               <div className="h-full bg-[var(--accent)] w-[64%]"></div>
                           </div>
                        </div>
                    ))}
                 </div>
             )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-baseline justify-between">
         <h2 className="text-xl font-bold tracking-tight">Archive</h2>
      </div>

      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
      ) : items.length === 0 ? (
          <div className="py-16 text-center border border-[var(--border)] border-dashed rounded-xl flex flex-col items-center text-[var(--text-tertiary)]">
             <UploadCloud className="w-8 h-8 mb-3 opacity-50" />
             <p className="font-mono text-xs uppercase tracking-widest">Repository empty</p>
          </div>
      ) : (
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.06}>
             {items.map(item => (
                 <div 
                    key={item.id}
                    onClick={() => navigate(`/media/${item.id}`)}
                    className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-hover)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col h-full group"
                 >
                    <div className="flex justify-between items-start mb-4">
                        <div className="font-mono text-sm text-[var(--text-primary)] truncate pr-4">{item.filename}</div>
                        <StatusPill status={item.status} className="shrink-0" />
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        {item.codec && (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] uppercase">{item.codec}</span>
                        )}
                        {item.resolution && (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">{item.resolution}</span>
                        )}
                    </div>

                    <div className="mt-auto border-t border-[var(--border)] pt-3 flex justify-between font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                        <span>{formatBytes(item.size_bytes)}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                 </div>
             ))}
          </StaggerGrid>
      )}
    </PageTransition>
  );
}
