import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Copy, ExternalLink, Globe, Lock, Eye } from 'lucide-react';
import { createShareLink } from '@/api/share';
import { toast } from 'sonner';
import { PageTransition, AnimatedPill } from '@/components/common';
import { SettingRow } from '@/components/ui/SettingRow';
import { Toggle } from '@/components/ui/Toggle';

type AccessType = 'public' | 'restricted' | 'password';

export default function ShareBuilder() {
  const { mediaId } = useParams();
  const navigate = useNavigate();

  const [accessType, setAccessType] = useState<AccessType>('restricted');
  const [config, setConfig] = useState({
    password: '',
    view_limit: false,
    limit_count: 50,
    expires: '24h',
    download: false,
  });

  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSlug, setResultSlug] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!mediaId) return;
    setGenerating(true);
    try {
      const payload = {
        require_password: accessType === 'password',
        password: accessType === 'password' ? config.password || undefined : undefined,
        view_limit: config.view_limit ? config.limit_count : undefined,
        allow_download: config.download,
        expires_in_hours: config.expires === '24h' ? 24 : config.expires === '7d' ? 168 : config.expires === '1h' ? 1 : config.expires === '6h' ? 6 : config.expires === '30d' ? 720 : undefined,
      };
      const res = await createShareLink(mediaId, payload);
      setResultUrl(res.url);
      setResultSlug(res.slug);
      toast.success('Secure link generated');
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { type: 'success', message: `Secure link generated for slug /view/${res.slug}` }
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate link';
      toast.error(message);
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

  const accessOptions: { value: AccessType; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'public', label: 'PUBLIC', desc: 'Anyone with the link can view', icon: <Globe className="w-4 h-4" /> },
    { value: 'restricted', label: 'RESTRICTED', desc: 'Apply view limits & expiration', icon: <Eye className="w-4 h-4" /> },
    { value: 'password', label: 'PASSWORD PROTECTED', desc: 'Require password to view', icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <PageTransition>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(`/media/${mediaId}`)}
            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            aria-label="Back to media"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-sans text-[22px] font-semibold tracking-[-0.02em]">Generate Share Link</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 flex-1">
          {/* Left — Configuration */}
          <div>
            {/* Access Type */}
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">
                Access Type
              </div>
              <div className="space-y-2">
                {accessOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setAccessType(opt.value);
                      setResultUrl(null); // Reset generated link if they change configuration
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                      accessType === opt.value
                        ? 'border-[var(--accent)]/30 bg-[rgba(245,158,11,0.04)]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <div className={`mt-0.5 ${accessType === opt.value ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <div className={`font-mono text-[11px] uppercase tracking-[0.06em] ${
                        accessType === opt.value ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {opt.label}
                      </div>
                      <div className="font-sans text-[12px] text-[var(--text-tertiary)] mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Rules */}
            {accessType !== 'public' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2 text-[var(--text-secondary)] border-b border-[var(--border)] pb-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em]">Security Rules</span>
                </div>

                {accessType === 'password' && (
                  <SettingRow label="Password" description="Required to view the content">
                    <input
                      type="text"
                      placeholder="Set password..."
                      className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-[13px] font-mono w-40 focus:border-[var(--accent)] outline-none"
                      value={config.password}
                      onChange={e => {
                        setConfig({ ...config, password: e.target.value });
                        setResultUrl(null);
                      }}
                    />
                  </SettingRow>
                )}

                <SettingRow label="View Limit" description="Restrict total playback sessions">
                  <div className="flex items-center gap-2">
                    {config.view_limit && (
                      <input
                        type="number"
                        className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-2 py-1 text-[13px] font-mono w-20 text-right focus:border-[var(--accent)] outline-none"
                        value={config.limit_count}
                        onChange={e => {
                          setConfig({ ...config, limit_count: parseInt(e.target.value) || 0 });
                          setResultUrl(null);
                        }}
                      />
                    )}
                    <Toggle checked={config.view_limit} onChange={c => {
                      setConfig({ ...config, view_limit: c });
                      setResultUrl(null);
                    }} />
                  </div>
                </SettingRow>

                <SettingRow label="Link Expiration" description="Auto-expire after duration">
                  <select
                    className="bg-[var(--bg-base)] border border-[var(--border)] rounded px-3 py-1.5 text-[13px] font-mono text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
                    value={config.expires}
                    onChange={e => {
                      setConfig({ ...config, expires: e.target.value });
                      setResultUrl(null);
                    }}
                  >
                    <option value="never">Never</option>
                    <option value="1h">1 Hour</option>
                    <option value="6h">6 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                  </select>
                </SettingRow>

                <SettingRow label="Allow Download" description="Let recipients save the source file">
                  <Toggle checked={config.download} onChange={c => {
                    setConfig({ ...config, download: c });
                    setResultUrl(null);
                  }} />
                </SettingRow>
              </div>
            )}
          </div>

          {/* Right — Live Preview */}
          <div>
            <div className="sticky top-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col min-h-[320px]">
                {resultUrl ? (
                  <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-ready)]" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--status-ready)]">
                        Link Generated
                      </span>
                    </div>

                    <div className="mb-6">
                      <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase mb-1">URL</div>
                      <div className="font-mono text-[13px] text-[var(--accent)] break-all">
                        {resultUrl.replace('http://', '').replace('https://', '')}
                      </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[13px] hover:border-[var(--accent)]/30 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy URL
                      </button>
                      <button
                        onClick={() => window.open(resultUrl, '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[13px] hover:border-[var(--accent)]/30 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Test Link
                      </button>
                    </div>

                    <div className="mt-auto">
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-2">Active Restrictions</div>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {accessType === 'password' && <AnimatedPill key="pwd" text="🔒 Password" color="blue" />}
                          {config.view_limit && <AnimatedPill key="limit" text={`👁 ${config.limit_count}`} color="amber" />}
                          {config.expires !== 'never' && <AnimatedPill key="exp" text={`⏱ ${config.expires}`} color="blue" />}
                        </AnimatePresence>
                        {accessType === 'public' && !config.view_limit && config.expires === 'never' && (
                          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">Public Link — no restrictions</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-2 space-y-1 flex flex-col h-full justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">
                        LINK PREVIEW
                      </p>
                      {[
                        { label: 'Access',    value: accessType === 'public' ? 'Public' : accessType === 'restricted' ? 'Restricted' : 'Password Protected' },
                        { label: 'Expires',   value: config.expires === 'never' ? 'Never' : config.expires },
                        { label: 'Limit',     value: config.view_limit ? `${config.limit_count} views` : 'Unlimited' },
                        { label: 'Download',  value: config.download ? 'Allowed' : 'Disabled' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-baseline py-2 border-b border-[var(--border)] last:border-0">
                          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{row.label}</span>
                          <span className="text-[12px] font-mono text-[var(--text-primary)]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3">
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black text-[12px] font-semibold py-2.5 rounded-md transition-colors cursor-pointer"
                      >
                        {generating ? 'GENERATING...' : 'GENERATE SECURE LINK'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
