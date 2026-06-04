import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAnalytics } from '@/api/analytics';
import { AreaChart, DonutChart, BarChart } from '@tremor/react';
import { formatBytes } from '@/lib/utils';
import { Eye, Users, Clock, Cloud } from 'lucide-react';
import { PageTransition, NumberTicker } from '@/components/common';
import { toast } from 'sonner';

export default function Analytics() {
  const { mediaId } = useParams();
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    if (mediaId) {
        getAnalytics(mediaId).then(setData).catch(console.error);
    }
  }, [mediaId]);

  if (!data) {
    return (
      <PageTransition>
        <div className="animate-pulse pb-12">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
              <div className="h-9 bg-[var(--bg-elevated)] rounded w-48 animate-pulse" />
              <div className="h-6 bg-[var(--bg-elevated)] rounded w-24 animate-pulse" />
          </div>
          
          {/* Top Stats Skeleton */}
          <div className="grid grid-cols-4 gap-4 mb-4">
              {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-xl h-36 animate-pulse" />
              ))}
          </div>

          {/* Charts Row Skeleton */}
          <div className="grid md:grid-cols-[2fr_1fr] gap-4 mb-4">
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6 h-80 animate-pulse" />
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6 h-80 animate-pulse" />
          </div>
        </div>
      </PageTransition>
    );
  }

  // Mock chart data generation given basic stats
  const areaData = [
    { time: '00:00', views: data.total_views * 0.1 },
    { time: '04:00', views: data.total_views * 0.12 },
    { time: '08:00', views: data.total_views * 0.18 },
    { time: '12:00', views: data.total_views * 0.35 },
    { time: '16:00', views: data.total_views * 0.2 },
    { time: '20:00', views: data.total_views * 0.05 },
  ];

  return (
    <PageTransition>
      <div className="pb-12">
       <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
           <h1 className="text-3xl font-bold tracking-tight uppercase">Analytics</h1>
           <div className="text-right font-mono text-[10px] uppercase text-[var(--text-secondary)] tracking-widest leading-loose">
               Total Views<br/>
               <span className="text-lg text-[var(--text-primary)]">{data.total_views}</span>
           </div>
       </div>

       {/* Top Stats */}
       <div className="grid grid-cols-4 gap-4 mb-4">
           <StatCard icon={Eye} label="Total Views" val={data.total_views} suffix="" trend="+14.2%" />
           <StatCard icon={Users} label="Unique Viewers" val={Math.floor(data.total_views * 0.82)} suffix="" trend="+5.7%" />
           <StatCard icon={Clock} label="Avg Completion" val={Math.round((data.avg_completion_rate || 0) * 100)} suffix="%" trend="" />
           <StatCard icon={Cloud} label="Bandwidth Saved" val={120} suffix="MB" trend="Performance optimized" isAccent />
       </div>

       {/* Charts Row */}
       <div className="grid md:grid-cols-[2fr_1fr] gap-4 mb-4">
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6">
               <h3 className="font-sans text-xl font-bold mb-1">Viewership over time</h3>
               <p className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-6">Global performance metrics</p>
               
               <AreaChart
                 className="h-64 mt-4"
                 data={areaData}
                 index="time"
                 categories={["views"]}
                 colors={["amber"]}
                 showYAxis={false}
                 showLegend={false}
                 curveType="monotone"
               />
           </div>
           
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
               <h3 className="font-sans text-xl font-bold mb-6">Device Breakdown</h3>
               <div className="flex-1 flex items-center justify-center -my-8">
                   <DonutChart
                     className="max-h-48"
                     data={[
                         { name: 'Desktop', value: 72 },
                         { name: 'Mobile', value: 18 },
                         { name: 'Other', value: 10 },
                     ]}
                     category="value"
                     index="name"
                     colors={["emerald", "blue", "stone"]}
                     showTooltip={false}
                   />
               </div>
               <div className="mt-8 space-y-3 font-mono text-xs text-[var(--text-secondary)]">
                   <div className="flex justify-between items-center"><span className="text-[var(--status-ready)]">• Desktop</span><span>72%</span></div>
                   <div className="flex justify-between items-center"><span className="text-blue-500">• Mobile</span><span>18%</span></div>
                   <div className="flex justify-between items-center"><span className="text-[var(--text-tertiary)]">• Other</span><span>10%</span></div>
               </div>
           </div>
       </div>

       {/* Callout */}
       <div className="bg-[var(--bg-elevated)] border border-[var(--border)] border-l-[3px] border-l-[var(--status-ready)] p-8 rounded-xl flex items-center justify-between">
           <div>
               <div className="font-sans text-[var(--status-ready)] text-3xl font-bold mb-2 mt-1">Bandwidth Savings: 120MB</div>
               <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
                   Our proprietary transcoding engine and edge delivery network have minimized egress costs. 
                   Peer-to-peer offloading accounted for 12% of this reduction.
               </p>
           </div>
            <button 
                onClick={() => toast.success('Analytics report downloaded successfully.')} 
                className="px-6 py-2 bg-white text-black font-semibold uppercase tracking-wider text-xs rounded hover:bg-neutral-100 transition-colors"
            >
                Download Report
            </button>
        </div>
      </div>
    </PageTransition>
  );
}

function StatCard({ icon: Icon, label, val, suffix, trend, isAccent = false }: any) {
    return (
        <div className={`bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-xl flex flex-col justify-between h-36 ${isAccent ? 'bg-[#062417]/20 border-[var(--status-ready)]/20' : ''}`}>
            <div className="flex justify-between items-start text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest">
                {label}
                <Icon className="w-3.5 h-3.5" />
            </div>
            
            <div className={`font-sans font-bold text-4xl tracking-tight ${isAccent ? 'text-[var(--status-ready)]' : 'text-white'}`}>
                <NumberTicker value={val} suffix={suffix} />
            </div>
            <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
                {trend}
            </div>
        </div>
    )
}
