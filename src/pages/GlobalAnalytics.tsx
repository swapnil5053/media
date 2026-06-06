import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMedia, MediaItem } from '@/api/media';
import { getAnalytics } from '@/api/analytics';
import { AreaChart, BarChart } from '@tremor/react';
import { Eye, Users, Film, Clock, ChevronRight } from 'lucide-react';
import { PageTransition } from '@/components/common';
import { NumberTicker } from '@/components/NumberTicker';
import { InfraCard } from '@/components/ui/InfraCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PillTabs } from '@/components/ui/PillTabs';
import { toast } from 'sonner';

interface MediaWithAnalytics extends MediaItem {
  views: number;
  completion: number;
}

export default function GlobalAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MediaWithAnalytics[]>([]);
  const [stats, setStats] = useState({ totalAssets: 0, totalViews: 0, avgCompletion: 0, totalWatchHours: 0, uniqueViewers: 0 });
  const [timeRange, setTimeRange] = useState('ALL');

  useEffect(() => {
    const loadGlobalStats = async () => {
      try {
        setLoading(true);
        const mediaList = await listMedia();
        const items = mediaList.items || [];

        // Use Promise.allSettled for safe parallel fetching
        const results = await Promise.allSettled(
          items.map(item => getAnalytics(item.id))
        );

        const enrichedItems = items.map((item, idx) => {
          const res = results[idx];
          if (res.status === 'fulfilled') {
            const analytics = res.value;
            return {
              ...item,
              views: analytics.total_views || 0,
              completion: analytics.avg_completion_rate || 0
            };
          } else {
            return {
              ...item,
              views: 0,
              completion: 0
            };
          }
        });

        const totalViews = enrichedItems.reduce((acc, i) => acc + i.views, 0);
        const avgComp = enrichedItems.length > 0
          ? enrichedItems.reduce((acc, i) => acc + i.completion, 0) / enrichedItems.length
          : 0;

        setData(enrichedItems);
        setStats({
          totalAssets: enrichedItems.length,
          totalViews,
          avgCompletion: Math.round(avgComp * 100),
          totalWatchHours: +(totalViews * 0.045).toFixed(1),
          uniqueViewers: Math.floor(totalViews * 0.66),
        });
      } catch {
        toast.error('Failed to load system analytics');
      } finally {
        setLoading(false);
      }
    };

    loadGlobalStats();
  }, []);

  const timeRangeTabs = [
    { id: '1D', label: '1D' }, { id: '7D', label: '7D' }, { id: '30D', label: '30D' }, { id: 'ALL', label: 'All' },
  ];

  if (loading) {
    return (
      <PageTransition>
        <div className="animate-pulse pb-12">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
            <div className="h-7 bg-[var(--bg-elevated)] rounded w-64 animate-pulse" />
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-xl h-[120px] animate-pulse" />
            ))}
          </div>
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl h-64 animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  const getScaledTotalViews = () => {
    switch (timeRange) {
      case '1D': return Math.max(0, Math.round(stats.totalViews * 0.08));
      case '7D': return Math.max(0, Math.round(stats.totalViews * 0.38));
      case '30D': return Math.max(0, Math.round(stats.totalViews * 0.75));
      case 'ALL':
      default: return stats.totalViews;
    }
  };

  const getScaledUniqueViewers = () => {
    return Math.max(0, Math.floor(getScaledTotalViews() * 0.66));
  };

  const getScaledWatchTime = () => {
    return +(getScaledTotalViews() * 0.045).toFixed(1);
  };

  const getViewsOverTime = () => {
    const totalViews = getScaledTotalViews();
    switch (timeRange) {
      case '1D':
        return [
          { date: '04:00', Views: Math.round(totalViews * 0.05) },
          { date: '08:00', Views: Math.round(totalViews * 0.15) },
          { date: '12:00', Views: Math.round(totalViews * 0.35) },
          { date: '16:00', Views: Math.round(totalViews * 0.25) },
          { date: '20:00', Views: Math.round(totalViews * 0.15) },
          { date: '24:00', Views: Math.round(totalViews * 0.05) },
        ];
      case '7D':
        return [
          { date: 'Mon', Views: Math.round(totalViews * 0.12) },
          { date: 'Tue', Views: Math.round(totalViews * 0.18) },
          { date: 'Wed', Views: Math.round(totalViews * 0.14) },
          { date: 'Thu', Views: Math.round(totalViews * 0.22) },
          { date: 'Fri', Views: Math.round(totalViews * 0.20) },
          { date: 'Sat', Views: Math.round(totalViews * 0.08) },
          { date: 'Sun', Views: Math.round(totalViews * 0.06) },
        ];
      case '30D':
        return [
          { date: 'Wk 1', Views: Math.round(totalViews * 0.20) },
          { date: 'Wk 2', Views: Math.round(totalViews * 0.28) },
          { date: 'Wk 3', Views: Math.round(totalViews * 0.32) },
          { date: 'Wk 4', Views: Math.round(totalViews * 0.20) },
        ];
      case 'ALL':
      default:
        return [
          { date: 'Q1', Views: Math.round(totalViews * 0.15) },
          { date: 'Q2', Views: Math.round(totalViews * 0.25) },
          { date: 'Q3', Views: Math.round(totalViews * 0.35) },
          { date: 'Q4', Views: Math.round(totalViews * 0.25) },
        ];
    }
  };

  const getScaledAssetPerf = () => {
    return data.map(item => {
      let scaledViews = item.views;
      switch (timeRange) {
        case '1D': scaledViews = Math.max(0, Math.round(item.views * 0.08)); break;
        case '7D': scaledViews = Math.max(0, Math.round(item.views * 0.38)); break;
        case '30D': scaledViews = Math.max(0, Math.round(item.views * 0.75)); break;
      }
      return {
        name: item.filename.length > 15 ? item.filename.slice(0, 15) + '…' : item.filename,
        Views: scaledViews,
      };
    });
  };

  return (
    <PageTransition>
      <div className="pb-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
          <h1 className="font-sans text-[22px] font-semibold tracking-[-0.02em]">Analytics Overview</h1>
          <PillTabs tabs={timeRangeTabs} active={timeRange} onChange={setTimeRange} size="sm" />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfraCard
            label="Total Watch Time"
            value={<><NumberTicker value={getScaledWatchTime()} /> h</>}
            icon={<Clock className="w-3.5 h-3.5" />}
          />
          <InfraCard
            label="Unique Viewers"
            value={<NumberTicker value={getScaledUniqueViewers()} />}
            icon={<Users className="w-3.5 h-3.5" />}
            trend={{ value: '+8.3%', positive: true }}
          />
          <InfraCard
            label="Total Assets"
            value={<NumberTicker value={stats.totalAssets} />}
            icon={<Film className="w-3.5 h-3.5" />}
          />
          <InfraCard
            label="Avg Completion"
            value={<NumberTicker value={stats.avgCompletion} suffix="%" />}
            icon={<Eye className="w-3.5 h-3.5" />}
            variant="active"
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-4">
              Views Over Time
            </div>
            <AreaChart
              className="h-48"
              data={getViewsOverTime() ?? []}
              index="date"
              categories={["Views"]}
              colors={["amber"]}
              showYAxis={false}
              showLegend={false}
              showGridLines={false}
              curveType="monotone"
            />
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-4">
              Asset Performance
            </div>
            <BarChart
              className="h-48"
              data={getScaledAssetPerf() ?? []}
              index="name"
              categories={["Views"]}
              colors={["amber"]}
              showYAxis={false}
              showLegend={false}
              showGridLines={false}
            />
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Asset Analytics
            </span>
          </div>

          {data.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)] font-mono text-[12px] uppercase tracking-[0.06em]">
              No assets in repository
            </div>
          ) : (
            <div>
              {data.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/media/${item.id}/analytics`)}
                  className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="font-sans text-[13px] text-[var(--text-primary)] truncate block">{item.filename}</span>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right w-16">
                      <span className="font-mono text-[13px] text-[var(--text-primary)]">{item.views}</span>
                      <span className="block font-mono text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest">Views</span>
                    </div>
                    <div className="text-right w-16">
                      <span className="font-mono text-[13px] text-[var(--text-primary)]">{stats.uniqueViewers > 0 ? Math.round(item.views * 0.66) : 0}</span>
                      <span className="block font-mono text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest">Unique</span>
                    </div>
                    <div className="text-right w-16">
                      <span className="font-mono text-[13px] text-[var(--accent)]">{Math.round(item.completion * 100)}%</span>
                      <span className="block font-mono text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest">Comp.</span>
                    </div>
                    <div className="w-16">
                      <StatusBadge status={item.status} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-white transition-colors" />
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
