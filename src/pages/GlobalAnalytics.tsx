import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMedia, MediaItem } from '@/api/media';
import { getAnalytics } from '@/api/analytics';
import { Eye, Film, Clock, ChevronRight, BarChart2 } from 'lucide-react';
import { PageTransition, NumberTicker } from '@/components/common';
import { toast } from 'sonner';

interface MediaWithAnalytics extends MediaItem {
  views: number;
  completion: number;
}

export default function GlobalAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MediaWithAnalytics[]>([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalViews: 0,
    avgCompletion: 0,
  });

  useEffect(() => {
    const loadGlobalStats = async () => {
      try {
        setLoading(true);
        const mediaList = await listMedia();
        const items = mediaList.items || [];

        // Fetch analytics for each media in parallel
        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const analytics = await getAnalytics(item.id);
              return {
                ...item,
                views: analytics.total_views || 0,
                completion: analytics.avg_completion_rate || 0,
              };
            } catch {
              return {
                ...item,
                views: 0,
                completion: 0,
              };
            }
          })
        );

        const totalViews = enrichedItems.reduce((acc, item) => acc + item.views, 0);
        const avgCompletion = enrichedItems.length > 0 
          ? enrichedItems.reduce((acc, item) => acc + item.completion, 0) / enrichedItems.length 
          : 0;

        setData(enrichedItems);
        setStats({
          totalAssets: enrichedItems.length,
          totalViews,
          avgCompletion: Math.round(avgCompletion * 100),
        });
      } catch (err) {
        toast.error('Failed to load system analytics');
      } finally {
        setLoading(false);
      }
    };

    loadGlobalStats();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="animate-pulse pb-12">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
            <div className="h-9 bg-[var(--bg-elevated)] rounded w-64 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl h-64 animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="pb-12">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
          <h1 className="text-3xl font-bold tracking-tight uppercase">System Overview</h1>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-xl flex flex-col justify-between h-32">
            <div className="flex justify-between items-start text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest">
              Total Managed Assets
              <Film className="w-3.5 h-3.5" />
            </div>
            <div className="font-sans font-bold text-4xl tracking-tight text-white">
              <NumberTicker value={stats.totalAssets} />
            </div>
            <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
              Active in cluster repositories
            </div>
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-xl flex flex-col justify-between h-32">
            <div className="flex justify-between items-start text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest">
              Aggregate Playback Sessions
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div className="font-sans font-bold text-4xl tracking-tight text-white">
              <NumberTicker value={stats.totalViews} />
            </div>
            <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
              Edge delivery network hits
            </div>
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-xl flex flex-col justify-between h-32">
            <div className="flex justify-between items-start text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest">
              Avg Watch Completion
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="font-sans font-bold text-4xl tracking-tight text-[var(--accent)]">
              <NumberTicker value={stats.avgCompletion} suffix="%" />
            </div>
            <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
              Retention score ratio
            </div>
          </div>
        </div>

        {/* Media Asset List */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">Analytics Registry</span>
          </div>

          {data.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)] font-mono text-xs uppercase tracking-widest">
              No assets in repository
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {data.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/media/${item.id}/analytics`)}
                  className="py-4 flex items-center justify-between hover:bg-[var(--bg-surface)] px-4 -mx-4 rounded-lg cursor-pointer transition-all group"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="font-mono text-sm font-semibold text-white truncate mb-1">
                      {item.filename}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">
                      {item.resolution || 'RAW'} · {item.codec || 'UNKNOWN'}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-white">{item.views}</div>
                      <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">Views</div>
                    </div>
                    <div className="text-right w-20">
                      <div className="font-mono text-sm font-bold text-[var(--accent)]">{Math.round(item.completion * 100)}%</div>
                      <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--text-secondary)]">Comp. Rate</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
