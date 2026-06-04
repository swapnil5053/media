import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Film, BarChart2, Settings, HardDrive, Bell } from 'lucide-react';

export function AppLayout() {
  const location = useLocation();
  const isViewer = location.pathname.startsWith('/view/');

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([
    { id: 1, type: 'success', message: 'Asset demo_video.mp4 has completed transcoding', time: '2 mins ago', unread: true },
    { id: 2, type: 'warning', message: 'Disk space on node us-east-4 at 78% capacity', time: '1 hour ago', unread: true },
    { id: 3, type: 'info', message: 'System security policy verified successfully', time: '5 hours ago', unread: true },
  ]);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  React.useEffect(() => {
    function handleNewNotification(event: any) {
      const { type, message } = event.detail;
      setNotifications(prev => [
        {
          id: Date.now(),
          type,
          message,
          time: 'Just now',
          unread: true
        },
        ...prev
      ]);
    }
    window.addEventListener('app-notification', handleNewNotification);
    return () => {
      window.removeEventListener('app-notification', handleNewNotification);
    };
  }, []);

  if (isViewer) {
    return <Outlet />;
  }

  const navItems = [
    { label: 'Dashboard', path: '/upload', icon: LayoutDashboard },
    { label: 'Media', path: '/media', icon: Film },
    { label: 'Analytics', path: '/analytics', icon: BarChart2 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Sidebar */}
      <div className="w-[240px] flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col pt-6">
        <div className="px-6 mb-8 font-sans font-bold text-xl tracking-tight">
          Adapt<span className="text-[var(--accent)]">Flow</span>
          <div className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-normal mt-1">Infrastructure Console</div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive ? 'bg-[var(--bg-elevated)] text-[var(--accent)]' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'}
              `}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 bg-[var(--bg-base)] border-b border-[var(--border)] flex items-center justify-between px-8">
            <div className="flex items-center gap-3 text-xs font-mono text-[var(--status-ready)] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[var(--status-ready)] relative">
                    <span className="absolute inset-0 rounded-full bg-[var(--status-ready)] animate-ping opacity-50"></span>
                </span>
                System Online
            </div>
            
            <div className="relative flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)]" ref={dropdownRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition-all cursor-pointer flex items-center justify-center"
                  title="Notifications"
                >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <span className="absolute top-[5px] right-[5px] w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl z-50 p-4 font-sans text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-[var(--border)] mb-3">
                            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-white">System Alerts</span>
                            {notifications.length > 0 && (
                                <div className="flex gap-3 text-[10px] font-mono uppercase tracking-wider text-[var(--accent)]">
                                    <button onClick={markAllRead} className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit">Read All</button>
                                    <button onClick={clearNotifications} className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit">Clear</button>
                                </div>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="py-6 text-center text-[var(--text-tertiary)] font-mono text-xs uppercase tracking-wider">
                                No active alerts
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-2.5 rounded-lg border transition-all ${n.unread ? 'bg-[#92400e]/5 border-[var(--accent)]/20' : 'bg-[var(--bg-surface)] border-[var(--border)]'}`}>
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                                                n.type === 'success' ? 'bg-[var(--status-ready)]' :
                                                n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                            <p className="text-[var(--text-primary)] text-xs flex-1 leading-normal text-left">{n.message}</p>
                                        </div>
                                        <div className="text-[9px] font-mono text-[var(--text-tertiary)] text-right">{n.time}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
