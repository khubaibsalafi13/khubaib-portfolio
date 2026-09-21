import React, { useState, useEffect } from 'react';
import { Save, Check, Moon, Sun, Palette, Database, ExternalLink, ShieldCheck, Key } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { SiteSettings } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { isSupabaseConfigured, getSupabaseConfig, setRuntimeSupabaseConfig, supabase } from '../../lib/supabaseClient';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(() => settingsService.getSettings());
  const [saved, setSaved] = useState(false);
  const { setTheme } = useTheme();

  // Supabase dynamic config state
  const [currentConfig, setCurrentConfig] = useState(() => getSupabaseConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(currentConfig.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(currentConfig.anonKey);
  const [dbStatus, setDbStatus] = useState<'connected' | 'unconfigured' | 'error'>(
    isSupabaseConfigured() ? 'connected' : 'unconfigured'
  );
  const [dbTestMessage, setDbTestMessage] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const latest = await settingsService.getSettingsAsync();
        if (isMounted && latest) {
          setSettings(latest);
        }
      } catch (err) {
        console.warn('Failed to fetch settings from Supabase:', err);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setRuntimeSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    setCurrentConfig(getSupabaseConfig());
    if (supabaseUrlInput.trim() && supabaseKeyInput.trim()) {
      setDbStatus('connected');
      setDbTestMessage('Configuration saved to application.');
    } else {
      setDbStatus('unconfigured');
      setDbTestMessage('Supabase credentials cleared. Using local persistence.');
    }
  };

  const handleTestSupabaseConnection = async () => {
    setTestingConnection(true);
    setDbTestMessage('');
    try {
      if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
        setDbStatus('unconfigured');
        setDbTestMessage('Please enter both Supabase Project URL and Anon Key.');
        return;
      }
      setRuntimeSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
      const { error } = await supabase.from('site_settings').select('id').limit(1);
      if (error) {
        setDbStatus('error');
        setDbTestMessage(`Connection warning: ${error.message}. Ensure supabase_schema.sql has been run in Supabase SQL Editor.`);
      } else {
        setDbStatus('connected');
        setDbTestMessage('Connected successfully to Supabase database!');
      }
    } catch (err: any) {
      setDbStatus('error');
      setDbTestMessage(`Connection error: ${err.message || 'Check URL and key.'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Site & Display Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Configure SEO meta tags, social links, project carousel timings, theme defaults, and branding.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Settings Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        {/* Theme & Appearance */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#10b981]" />
            <h2 className="text-sm font-bold text-[#10b981] font-mono uppercase tracking-wider">
              01. Theme & Appearance
            </h2>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8ba394] mb-2 uppercase tracking-wider">
              Default Public Theme for First-Time Visitors
            </label>
            <p className="text-xs text-[#6e8a79] mb-4">
              Determines whether visitors start in the signature Dark Mode or the editorial Light Mode before any manual toggle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dark Option */}
              <button
                type="button"
                onClick={() => {
                  handleChange('defaultTheme', 'dark');
                  setTheme('dark');
                }}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  settings.defaultTheme === 'dark'
                    ? 'bg-[#082014] border-[#10b981] ring-1 ring-[#10b981]'
                    : 'bg-[#040e08] border-[#143322] hover:border-[#1b462e]'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${settings.defaultTheme === 'dark' ? 'bg-[#10b981] text-[#022013]' : 'bg-[#0a2315] text-[#8aa394]'}`}>
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#f0f6f2] block">
                    Dark Mode (Default)
                  </span>
                  <span className="text-xs text-[#7e9989] leading-relaxed mt-0.5 block">
                    Signature dark green & charcoal palette with emerald highlights and luminous contrast.
                  </span>
                </div>
              </button>

              {/* Light Option */}
              <button
                type="button"
                onClick={() => {
                  handleChange('defaultTheme', 'light');
                  setTheme('light');
                }}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  settings.defaultTheme === 'light'
                    ? 'bg-[#082014] border-[#10b981] ring-1 ring-[#10b981]'
                    : 'bg-[#040e08] border-[#143322] hover:border-[#1b462e]'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${settings.defaultTheme === 'light' ? 'bg-[#10b981] text-[#022013]' : 'bg-[#0a2315] text-[#8aa394]'}`}>
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#f0f6f2] block">
                    Light Mode
                  </span>
                  <span className="text-xs text-[#7e9989] leading-relaxed mt-0.5 block">
                    Warm off-white editorial background, near-black typography, clean surfaces, and calibrated glow.
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#12281a]">
            <label className="block text-xs font-mono text-[#8ba394] mb-2 uppercase tracking-wider">Primary Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="max-w-xs px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs font-mono text-white outline-none"
              />
              <span className="text-xs font-mono text-[#6c8777]">
                Used across buttons, active pills, badges, and focus rings in both themes.
              </span>
            </div>
          </div>

          {/* Cursor Glow Size */}
          <div className="pt-4 border-t border-[#12281a]">
            <label className="block text-xs font-mono text-[#8ba394] mb-2 uppercase tracking-wider">
              Interactive Cursor Glow Size
            </label>
            <p className="text-xs text-[#6e8a79] mb-3">
              Configure the ambient mouse-following radial glow diameter on desktop screens.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleChange('cursorGlowSize', size)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer text-center ${
                    (settings.cursorGlowSize || 'small') === size
                      ? 'bg-[#10b981] text-[#022013] font-bold border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-[#040e08] border-[#143322] text-[#8ba394] hover:border-[#1b462e]'
                  }`}
                >
                  {size === 'small' && 'Small (Tight / Refined)'}
                  {size === 'medium' && 'Medium (Balanced)'}
                  {size === 'large' && 'Large (Spacious)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Brand & Identity */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#10b981] font-mono uppercase tracking-wider">
            02. Brand & Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Portfolio Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Designer Contact Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Behance Profile URL</label>
              <input
                type="url"
                value={settings.behanceUrl}
                onChange={(e) => handleChange('behanceUrl', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Carousel & Marquee Controls */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#10b981] font-mono uppercase tracking-wider">
            03. Carousel & Motion Speeds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                <input
                  type="checkbox"
                  checked={settings.carouselAutoplay}
                  onChange={(e) => handleChange('carouselAutoplay', e.target.checked)}
                  className="accent-[#10b981] w-4 h-4 rounded"
                />
                <span>Project Carousel Autoplay</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">
                Autoplay Interval (Seconds)
              </label>
              <input
                type="number"
                min={2}
                max={15}
                value={settings.carouselInterval}
                onChange={(e) => handleChange('carouselInterval', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs font-mono text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">
                Client Marquee Speed (Seconds)
              </label>
              <input
                type="number"
                min={10}
                max={60}
                value={settings.logoMarqueeSpeed}
                onChange={(e) => handleChange('logoMarqueeSpeed', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs font-mono text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* SEO Meta Configuration */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#10b981] font-mono uppercase tracking-wider">
            04. Search Engine Optimization (SEO)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">SEO Title (English)</label>
              <input
                type="text"
                value={settings.seoTitleEn}
                onChange={(e) => handleChange('seoTitleEn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">SEO Title (Bangla)</label>
              <input
                type="text"
                value={settings.seoTitleBn}
                onChange={(e) => handleChange('seoTitleBn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">SEO Description (English)</label>
              <textarea
                rows={2}
                value={settings.seoDescriptionEn}
                onChange={(e) => handleChange('seoDescriptionEn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">SEO Description (Bangla)</label>
              <textarea
                rows={2}
                value={settings.seoDescriptionBn}
                onChange={(e) => handleChange('seoDescriptionBn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#10b981] font-mono uppercase tracking-wider">
            05. Footer Statement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Footer Description (English)</label>
              <textarea
                rows={2}
                value={settings.footerTextEn}
                onChange={(e) => handleChange('footerTextEn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Footer Description (Bangla)</label>
              <textarea
                rows={2}
                value={settings.footerTextBn}
                onChange={(e) => handleChange('footerTextBn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
          </div>
        </div>

        {/* 06. Supabase Cloud Database */}
        <div id="supabase" className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#10b981]" />
              <h2 className="text-sm font-bold text-[#10b981] font-mono uppercase tracking-wider">
                06. Supabase Cloud Database Integration
              </h2>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 ${
              dbStatus === 'connected'
                ? 'bg-[#0a2f1b] border border-[#1b6b3e] text-[#34d399]'
                : dbStatus === 'error'
                ? 'bg-[#310d0d] border border-[#6b1b1b] text-[#f87171]'
                : 'bg-[#281e09] border border-[#6b501b] text-[#fbbf24]'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-[#10b981]' : dbStatus === 'error' ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'}`} />
              <span>
                {dbStatus === 'connected' ? 'Connected' : dbStatus === 'error' ? 'Connection Alert' : 'Local Fallback'}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#8ba394] leading-relaxed">
            Your portfolio features PostgreSQL backend capability via Supabase. When configured, all projects, design categories, services, client logos, testimonials, and consultation messages synchronize to your live Supabase cloud database with Row Level Security (RLS).
          </p>

          <div className="p-4 rounded-xl bg-[#030905] border border-[#112a1c] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#8ba394]">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" /> Setup Instructions
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[#10b981] hover:underline flex items-center gap-1"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="text-xs text-[#7f998a] space-y-1.5 list-decimal pl-4">
              <li>Open your project on Supabase and go to the <strong>SQL Editor</strong>.</li>
              <li>Paste and run the contents of the generated <code className="text-[#34d399] bg-[#05180e] px-1 py-0.5 rounded">supabase_schema.sql</code> file.</li>
              <li>Add <code className="text-[#34d399]">VITE_SUPABASE_URL</code> and <code className="text-[#34d399]">VITE_SUPABASE_ANON_KEY</code> to your environment or input them below.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project-ref.supabase.co"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">
                Supabase Anon (Public) Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-mono"
              />
            </div>

            {dbTestMessage && (
              <div className={`p-3 rounded-xl text-xs font-mono ${
                dbStatus === 'connected'
                  ? 'bg-[#0a2c1a] border border-[#165a36] text-[#34d399]'
                  : 'bg-[#291212] border border-[#582020] text-[#fca5a5]'
              }`}>
                {dbTestMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSaveSupabaseConfig}
                className="px-4 py-2 rounded-xl bg-[#0a2617] border border-[#1a5534] text-[#34d399] hover:bg-[#0e3721] text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                Save Credentials
              </button>
              <button
                type="button"
                onClick={handleTestSupabaseConnection}
                disabled={testingConnection}
                className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {testingConnection ? 'Testing Connection...' : 'Test Connection'}
              </button>
            </div>
          </div>
        </div>


      </form>
    </div>
  );
};
