import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import { createShareLink } from '@/api/share';
import { toast } from 'sonner';
import { PageTransition, AnimatedPill } from '@/components/common';

export default function ShareBuilder() {
  const { mediaId } = useParams();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState({
    require_password: true,
    password: '',
    view_limit: false,
    limit_count: 50,
    expires: '24h',
    download: false,
    mobile_only: false,
  });

  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSlug, setResultSlug] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!mediaId) return;
    setGenerating(true);
    try {
      const payload = {
        require_password: config.require_password,
        password: config.password || undefined,
        view_limit: config.view_limit ? config.limit_count : undefined,
        allow_download: config.download,
        mobile_only: config.mobile_only,
        // map expires string to hours
        expires_in_hours: config.expires === '24h' ? 24 : config.expires === '7d' ? 168 : undefined
      };
      const res = await createShareLink(mediaId, payload);
      setResultUrl(res.url);
      setResultSlug(res.slug);
      toast.success('Secure link generated');
      window.dispatchEvent(new CustomEvent('app-notification', {
          detail: { type: 'success', message: `Secure link generated for slug /view/${res.slug}` }
      }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate link');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <PageTransition>
      <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(`/media/${mediaId}`)} className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-sans text-2xl font-bold tracking-tight">Create Secure Link</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 flex-1">
         
         {/* Config Form */}
         <div>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-[var(--text-secondary)] border-b border-[var(--border)] pb-4">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-mono text-xs uppercase tracking-widest">Link Settings</span>
                </div>

                <div className="space-y-6">
                    <SettingRow 
                        title="Password Protection" 
                        desc="Require a secure key for access" 
                        checked={config.require_password}
                        onChange={(c) => setConfig({...config, require_password: c})}
                    >
                        {config.require_password && (
                            <input 
                                type="text" placeholder="Set password..."
                                className="mt-3 w-full bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                                value={config.password} onChange={e => setConfig({...config, password: e.target.value})}
                            />
                        )}
                    </SettingRow>

                    <SettingRow 
                        title="View Limit" 
                        desc="Restrict total number of playback sessions" 
                        checked={config.view_limit}
                        onChange={(c) => setConfig({...config, view_limit: c})}
                    >
                        {config.view_limit && (
                            <input 
                                type="number" 
                                className="mt-3 w-32 bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                                value={config.limit_count} onChange={e => setConfig({...config, limit_count: parseInt(e.target.value)})}
                            />
                        )}
                    </SettingRow>

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="font-sans text-sm font-medium mb-1">Link Expiration</div>
                            <div className="text-xs text-[var(--text-secondary)]">Auto-delete link after duration</div>
                        </div>
                        <select 
                            className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono text-[var(--text-primary)]"
                            value={config.expires} onChange={e => setConfig({...config, expires: e.target.value})}
                        >
                            <option value="never">Never</option>
                            <option value="24h">24 Hours</option>
                            <option value="7d">7 Days</option>
                        </select>
                    </div>

                    <SettingRow 
                        title="Download Enabled" 
                        desc="Allow recipients to save source file" 
                        checked={config.download}
                        onChange={(c) => setConfig({...config, download: c})}
                    />

                    <div className="pt-6">
                        <button 
                            disabled={generating}
                            onClick={handleGenerate}
                            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black font-semibold py-3 rounded uppercase tracking-wide text-sm transition-colors disabled:opacity-50"
                        >
                            {generating ? 'Generating...' : 'Generate Secure Link'}
                        </button>
                    </div>
                </div>
            </div>
         </div>

         {/* Preview Column */}
         <div className="flex flex-col gap-4">
             <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6 flex flex-col min-h-[300px]">
                 <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-auto text-center pt-4">
                     Live Preview
                 </div>
                 
                 <div className="my-8 flex flex-col items-center justify-center text-center">
                    {resultUrl ? (
                         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
                            <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase mb-2">Target Edge URL</div>
                            <div className="font-mono text-lg text-[var(--accent)] break-all mb-6">
                                {resultUrl.replace('http://', '').replace('https://', '')}
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-sm hover:!border-[var(--accent)] transition-colors">
                                    <Copy className="w-4 h-4" /> Copy URL
                                </button>
                                <button onClick={() => window.open(resultUrl, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-sm hover:!border-[var(--accent)] transition-colors">
                                    <ExternalLink className="w-4 h-4" /> Test Link
                                </button>
                            </div>
                         </motion.div>
                    ) : (
                        <div className="text-[var(--text-tertiary)] border border-dashed border-[var(--border)] rounded flex items-center justify-center p-8 w-max mx-auto mb-2">
                           <ExternalLink className="w-6 h-6" />
                        </div>
                    )}
                 </div>

                 <div className="mt-auto">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Active Restrictions</div>
                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                            {config.require_password && <AnimatedPill key="pwd" text="Password Protected" color="blue" />}
                            {config.view_limit && <AnimatedPill key="limit" text={`Limit: ${config.limit_count}`} color="amber" />}
                            {config.expires !== 'never' && <AnimatedPill key="exp" text={`Expires: ${config.expires}`} color="blue" />}
                        </AnimatePresence>
                        {(!config.require_password && !config.view_limit && config.expires === 'never') && (
                            <span className="text-xs text-[var(--text-tertiary)]">Public Link</span>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}

function SettingRow({ title, desc, checked, onChange, children }: any) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <div className="font-sans text-sm font-medium mb-1">{title}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{desc}</div>
                </div>
                <button 
                  onClick={() => onChange(!checked)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface)] border border-[var(--border)]'}`}
                >
                    <motion.div 
                      className={`w-4 h-4 bg-white rounded-full absolute top-[3px] ${checked ? 'left-[22px]' : 'left-[3px]'} shadow`}
                      layout
                    />
                </button>
            </div>
            {children}
        </div>
    )
}
