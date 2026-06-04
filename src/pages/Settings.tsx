import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Shield, HardDrive, RefreshCw } from 'lucide-react';
import { PageTransition } from '@/components/common';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    defaultProfile: 'HEVC',
    enableCDN: true,
    bucketOriginals: 'media-originals',
    bucketVariants: 'media-variants',
    defaultViewLimit: 50,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adaptflow_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {}
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
      <div className="pb-12 max-w-3xl">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--border)]">
          <h1 className="text-3xl font-bold tracking-tight uppercase flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-[var(--accent)]" /> Configuration Center
          </h1>
        </div>

        <div className="space-y-6">
          {/* Section: Transcoding Profile */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)] border-b border-[var(--border)] pb-3">
              <RefreshCw className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Processing Rules</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-sans text-sm font-medium mb-1">Default Transcoder Target</div>
                  <div className="text-xs text-[var(--text-secondary)]">Primary codec profile for multi-device delivery</div>
                </div>
                <select 
                  className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono text-[var(--text-primary)]"
                  value={config.defaultProfile} 
                  onChange={e => setConfig({...config, defaultProfile: e.target.value})}
                >
                  <option value="H264">H.264 (Universal compatibility)</option>
                  <option value="HEVC">HEVC/H.265 (High quality/low size)</option>
                  <option value="AV1">AV1 (Next-gen compression)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Storage & S3 Config */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)] border-b border-[var(--border)] pb-3">
              <HardDrive className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-widest">S3 Cluster Bindings</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2">Original Storage Bucket</label>
                <input 
                  type="text" 
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono focus:border-[var(--accent)] outline-none"
                  value={config.bucketOriginals}
                  onChange={e => setConfig({...config, bucketOriginals: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2">Variants Storage Bucket</label>
                <input 
                  type="text" 
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono focus:border-[var(--accent)] outline-none"
                  value={config.bucketVariants}
                  onChange={e => setConfig({...config, bucketVariants: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section: Security defaults */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)] border-b border-[var(--border)] pb-3">
              <Shield className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Transmission Security</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-sans text-sm font-medium mb-1">CDN Edge Distribution</div>
                  <div className="text-xs text-[var(--text-secondary)]">Route media streaming content through CDN gateways</div>
                </div>
                <button 
                  onClick={() => setConfig({...config, enableCDN: !config.enableCDN})}
                  className={`w-10 h-6 rounded-full relative transition-colors ${config.enableCDN ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface)] border border-[var(--border)]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] transition-all ${config.enableCDN ? 'left-[22px]' : 'left-[3px]'} shadow`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="font-sans text-sm font-medium mb-1">Default View Constraint Limit</div>
                  <div className="text-xs text-[var(--text-secondary)]">Initial view capacity for newly generated share slugs</div>
                </div>
                <input 
                  type="number" 
                  className="w-24 bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono text-right"
                  value={config.defaultViewLimit}
                  onChange={e => setConfig({...config, defaultViewLimit: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 flex justify-end">
            <button 
              disabled={saving}
              onClick={handleSave}
              className="bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black px-6 py-2.5 rounded font-sans text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Writing Parameters...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
