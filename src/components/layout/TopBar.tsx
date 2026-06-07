import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

interface TopBarProps {
  unreadCount: number;
  onBellClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/upload':    'Library',
  '/analytics': 'Analytics',
  '/settings':  'Settings',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/media/') && pathname.endsWith('/share'))     return 'Share Link Builder';
  if (pathname.startsWith('/media/') && pathname.endsWith('/analytics')) return 'Asset Analytics';
  if (pathname.startsWith('/media/')) return 'Asset Detail';
  return 'AdaptFlow';
}

export function TopBar({ unreadCount, onBellClick }: TopBarProps) {
  const location = useLocation();
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const tick = () => setUtc(new Date().toISOString().slice(11, 19) + ' UTC');
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="h-11 flex-shrink-0 flex items-center justify-between px-5"
      style={{
        background: 'rgba(15,15,17,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <span
          className="font-sans text-[13px] font-medium tracking-[-0.02em] select-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          {getPageTitle(location.pathname)}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--status-ready)' }}
          />
          <span
            className="font-mono text-[11px] select-none"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Healthy
          </span>
        </div>

        <div
          className="hidden md:block w-px h-3.5"
          style={{ background: 'var(--border)' }}
        />

        <span
          className="hidden sm:block font-mono text-[11px] tabular-nums select-none"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {utc}
        </span>

        <div className="w-px h-3.5" style={{ background: 'var(--border)' }} />

        <button
          onClick={onBellClick}
          className="relative flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)';
          }}
          aria-label="Notifications"
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
          )}
        </button>
      </div>
    </header>
  );
}
