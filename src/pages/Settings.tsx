import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { PageTransition } from '@/components/common';
import { SettingRow } from '@/components/ui/SettingRow';
import { Toggle } from '@/components/ui/Toggle';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    defaultProfile: 'HEVC',
    enableCDN: true,
    bucketOriginals: 'media-originals',
    bucketVariants: 'media-variants',
    defaultViewLimit: 50,
    defaultExpiry: '24h',
    forceHttps: true,
    logEvents: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adaptflow_config');
    if (saved) {
      try {
        setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch { /* ignore corrupt data */ }
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('adaptflow_config', JSON.stringify(config));
      setSaving(false);
      toast.success('Platform configurations saved successfully!');
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="pb-12 max-w-2xl">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
          <h1 className="font-sans text-[22px] font-semibold tracking-[-0.02em] flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-[var(--accent)]" /> Configuration
          </h1>
        </div>

        <div className="space-y-4">
          {/* Processing Configuration */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
                <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
                  Processing Configuration
                </span>
              </div>
            </div>
            <SettingRow label="Default Codec Target" description="Applied to new uploads unless overridden">
              <select
                className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-[13px] font-mono text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
                value={config.defaultProfile}
                onChange={e => setConfig(prev => ({ ...prev, defaultProfile: e.target.value }))}
              >
                <option value="H264">H.264 Standard</option>
                <option value="HEVC">H.265 High</option>
                <option value="AV1">AV1 Ultra</option>
              </select>
            </SettingRow>
          </div>

          {/* Storage Bindings */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
                <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
                  Storage Bindings
                </span>
              </div>
            </div>
            <SettingRow label="Origin Bucket" description="S3 bucket for original uploads">
              <input
                type="text"
                className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-[13px] font-mono w-48 focus:border-[var(--accent)] outline-none"
                value={config.bucketOriginals}
                onChange={e => setConfig(prev => ({ ...prev, bucketOriginals: e.target.value }))}
              />
            </SettingRow>
            <SettingRow label="Variants Bucket" description="S3 bucket for transcoded variants">
              <input
                type="text"
                className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-[13px] font-mono w-48 focus:border-[var(--accent)] outline-none"
                value={config.bucketVariants}
                onChange={e => setConfig(prev => ({ ...prev, bucketVariants: e.target.value }))}
              />
            </SettingRow>
          </div>

          {/* CDN & Delivery */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
                <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
                  CDN & Delivery
                </span>
              </div>
            </div>
            <SettingRow label="Enable CDN" description="Route playback through edge nodes">
              <Toggle checked={config.enableCDN ?? false} onChange={c => setConfig(prev => ({ ...prev, enableCDN: c }))} />
            </SettingRow>
            <SettingRow label="Default View Limit" description="Applied to new share links">
              <input
                type="number"
                className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-[13px] font-mono w-24 text-right focus:border-[var(--accent)] outline-none"
                value={config.defaultViewLimit}
                onChange={e => setConfig(prev => ({ ...prev, defaultViewLimit: parseInt(e.target.value) || 0 }))}
              />
            </SettingRow>
          </div>

          {/* Security */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-px bg-[var(--accent)] opacity-60" />
                <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-secondary)] select-none">
                  Security
                </span>
              </div>
            </div>
            <SettingRow label="Default Link Expiry" description="Applied when no expiry is specified">
              <select
                className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-[13px] font-mono text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
                value={config.defaultExpiry}
                onChange={e => setConfig(prev => ({ ...prev, defaultExpiry: e.target.value }))}
              >
                <option value="never">Never</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </SettingRow>
            <SettingRow label="Force HTTPS" description="Reject non-secure playback requests">
              <Toggle checked={config.forceHttps ?? false} onChange={c => setConfig(prev => ({ ...prev, forceHttps: c }))} />
            </SettingRow>
            <SettingRow label="Log Viewer Events" description="Record playback telemetry for analytics">
              <Toggle checked={config.logEvents ?? false} onChange={c => setConfig(prev => ({ ...prev, logEvents: c }))} />
            </SettingRow>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              disabled={saving}
              onClick={handleSave}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black px-6 py-2.5 rounded-lg font-sans text-[13px] font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
