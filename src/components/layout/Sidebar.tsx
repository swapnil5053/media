import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { label: 'Library',   path: '/upload',    icon: LayoutDashboard },
  { label: 'Analytics', path: '/analytics', icon: BarChart2 },
  { label: 'Settings',  path: '/settings',  icon: Settings },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <motion.nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      animate={{ width: expanded ? 220 : 52 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 flex flex-col h-screen overflow-hidden relative z-30"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <Link
        to="/upload"
        className="h-11 flex items-center px-3 gap-3 shrink-0 cursor-pointer select-none"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Wordmark logo mark — two overlapping rectangles */}
        <div className="shrink-0 w-[26px] h-[26px] relative flex items-center justify-center">
          <div
            className="absolute"
            style={{
              width: 14, height: 18,
              background: 'var(--accent)',
              borderRadius: 2,
              left: 0, top: 4,
              opacity: 0.9,
            }}
          />
          <div
            className="absolute"
            style={{
              width: 14, height: 18,
              background: 'var(--text-primary)',
              borderRadius: 2,
              right: 0, top: 4,
              opacity: 0.15,
            }}
          />
        </div>

        <motion.div
          animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
          transition={{ duration: 0.14, delay: expanded ? 0.07 : 0 }}
          className="overflow-hidden whitespace-nowrap"
        >
          <span className="font-sans text-[13px] font-semibold tracking-[-0.04em] text-[var(--text-primary)] select-none">
            adapt<span style={{ color: 'var(--accent)' }}>flow</span>
          </span>
        </motion.div>
      </Link>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-px p-1.5 mt-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/upload' &&
              (location.pathname === '/' || location.pathname.startsWith('/media')));

          return (
            <NavLink key={item.path} to={item.path} className="block">
              <div
                className="relative flex items-center h-8 rounded-[6px] transition-colors duration-100"
                style={{
                  padding: expanded ? '0 10px' : '0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  gap: 10,
                  background: isActive ? 'rgba(245,158,11,0.07)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute left-0 top-[6px] bottom-[6px] w-[2px] rounded-r-full"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                  />
                )}
                <item.icon
                  size={15}
                  className="shrink-0 transition-colors duration-100"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
                />
                <motion.span
                  animate={{ opacity: expanded ? 1 : 0 }}
                  transition={{ duration: 0.12, delay: expanded ? 0.09 : 0 }}
                  className="font-sans text-[12.5px] whitespace-nowrap overflow-hidden select-none"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </motion.span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="p-3 flex items-center gap-2.5 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="relative shrink-0">
          <span className="block w-[7px] h-[7px] rounded-full" style={{ background: 'var(--status-ready)' }} />
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'var(--status-ready)', opacity: 0.3, animationDuration: '2.5s' }}
          />
        </div>
        <motion.span
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.1, delay: expanded ? 0.09 : 0 }}
          className="font-mono text-[10px] uppercase tracking-[0.1em] whitespace-nowrap overflow-hidden select-none"
          style={{ color: 'var(--text-tertiary)' }}
        >
          All systems OK
        </motion.span>
      </div>
    </motion.nav>
  );
}
