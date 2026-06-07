import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { NotificationDrawer } from '@/components/layout/NotificationDrawer';
import { useSpotlight } from '@/hooks/useSpotlight';

interface AppNotification {
  id: number;
  type: string;
  message: string;
  time: string;
  unread: boolean;
}

export function AppLayout() {
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  useSpotlight();
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 1, type: 'success', message: 'Asset demo_video.mp4 has completed transcoding', time: '2 mins ago', unread: true },
    { id: 2, type: 'warning', message: 'Disk space on node us-east-4 at 78% capacity', time: '1 hour ago', unread: true },
    { id: 3, type: 'info', message: 'System security policy verified successfully', time: '5 hours ago', unread: true },
  ]);

  // Bypass layout completely for the Viewer page route
  if (location.pathname.startsWith('/view/')) {
    return <Outlet />;
  }

  // Preserve the custom event listener exactly
  useEffect(() => {
    function handleNewNotification(event: CustomEvent<{ type: string; message: string }>) {
      const { type, message } = event.detail;
      setNotifications(prev => [
        {
          id: Date.now(),
          type,
          message,
          time: 'Just now',
          unread: true,
        },
        ...prev,
      ]);
    }
    window.addEventListener('app-notification', handleNewNotification as EventListener);
    return () => {
      window.removeEventListener('app-notification', handleNewNotification as EventListener);
    };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Ambient background glow layer */}
      <div className="bg-ambient" aria-hidden="true" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar
          unreadCount={unreadCount}
          onBellClick={() => setNotifOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-7">
            <Outlet />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {notifOpen && (
          <NotificationDrawer
            notifications={notifications}
            onClose={() => setNotifOpen(false)}
            onReadAll={() => setNotifications(n => n.map(x => ({ ...x, unread: false })))}
            onClear={() => setNotifications([])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
