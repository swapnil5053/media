import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

interface TopBarProps {
  unreadCount: number;
  onBellClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/upload': 'Library',
  '/analytics': 'Analytics Overview',
  '/settings': 'Configuration',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/media/') && pathname.endsWith('/share')) return 'Share Link Builder';
  if (pathname.startsWith('/media/') && pathname.endsWith('/analytics')) return 'Asset Analytics';
  if (pathname.startsWith('/media/')) return 'Asset Detail';
  return 'AdaptFlow';
}

export function TopBar({ unreadCount, onBellClick }: TopBarProps) {
  const location = useLocation();
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtc(now.toISOString().slice(11, 19) + ' UTC');
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const title = getPageTitle(location.pathname);

  return (
    <header className="h-12 flex-shrink-0 bg-[var(--bg-surface)]/80 backdrop-blur-sm border-b border-[var(--border)] flex items-center justify-between px-4">
      {/* Left: page title */}
      <span className="font-sans text-[13px] font-medium text-[var(--text-secondary)] tracking-[-0.005em]">
        {title}
      </span>

      {/* Right: status + clock + bell */}
      <div className="flex items-center gap-3">
        {/* System status */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-ready)]" />
          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">Healthy</span>
        </div>

        <div className="hidden md:block w-px h-4 bg-[var(--border)]" />

        {/* UTC clock */}
        <span className="hidden sm:block font-mono text-[12px] text-[var(--text-tertiary)] tabular-nums">
          {utc}
        </span>

        <div className="w-px h-4 bg-[var(--border)]" />

        {/* Bell */}
        <button
          onClick={onBellClick}
          className="relative p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
}
