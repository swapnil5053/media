import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { label: 'Library', path: '/upload', icon: LayoutDashboard },
  { label: 'Analytics', path: '/analytics', icon: BarChart2 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <motion.nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      animate={{ width: expanded ? 224 : 56 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col h-screen overflow-hidden relative z-30"
    >
      {/* Logo */}
      <div className="h-12 flex items-center px-4 border-b border-[var(--border)] shrink-0">
        <span className="font-sans text-[14px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] whitespace-nowrap">
          <span className="text-[var(--accent)]">A</span>
          <motion.span
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
            transition={{ duration: 0.12, delay: expanded ? 0.06 : 0 }}
            className="overflow-hidden inline-block"
          >
            dapt<span className="text-[var(--accent)]">Flow</span>
          </motion.span>
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/upload' && (location.pathname === '/' || location.pathname.startsWith('/media')));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="block"
            >
              <div
                className={`
                  flex items-center gap-3 h-9 rounded-lg transition-colors duration-100 relative
                  ${expanded ? 'px-3' : 'px-0 justify-center'}
                  ${isActive
                    ? 'bg-[rgba(245,158,11,0.06)]'
                    : 'hover:bg-[rgba(255,255,255,0.03)]'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1 bottom-1 w-[2px] bg-[var(--accent)] rounded-r"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}
                />
                <motion.span
                  animate={{
                    opacity: expanded ? 1 : 0,
                    x: expanded ? 0 : -4,
                  }}
                  transition={{ duration: 0.12, delay: expanded ? 0.08 : 0 }}
                  className={`
                    font-sans text-[13px] whitespace-nowrap overflow-hidden
                    ${isActive ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-secondary)]'}
                  `}
                >
                  {item.label}
                </motion.span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom status */}
      <div className="px-3 py-3 border-t border-[var(--border)] flex items-center gap-2 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-ready)] shrink-0" />
        <motion.span
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.1, delay: expanded ? 0.08 : 0 }}
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] whitespace-nowrap overflow-hidden"
        >
          Systems OK
        </motion.span>
      </div>
    </motion.nav>
  );
}
