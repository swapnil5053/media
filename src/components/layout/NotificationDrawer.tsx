import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
  unread: boolean;
}

interface NotificationDrawerProps {
  notifications: Notification[];
  onClose: () => void;
  onReadAll: () => void;
  onClear: () => void;
}

const dotColor: Record<string, string> = {
  success: 'bg-[var(--status-ready)]',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function NotificationDrawer({ notifications, onClose, onReadAll, onClear }: NotificationDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        exit={{ x: 320 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 bottom-0 w-80 bg-[var(--bg-surface)] border-l border-[var(--border)] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
          <span className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">
            Notifications
          </span>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={onReadAll}
                  className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Read All
                </button>
                <button
                  onClick={onClear}
                  className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Clear
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em]">No notifications</span>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 items-start transition-colors ${
                    n.unread ? 'bg-[rgba(245,158,11,0.02)]' : ''
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dotColor[n.type] || 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13px] text-[var(--text-primary)] leading-snug">
                      {n.message}
                    </p>
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)] mt-0.5 block">
                      {n.time}
                    </span>
                  </div>
                  {n.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
