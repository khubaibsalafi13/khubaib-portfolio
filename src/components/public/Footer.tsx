import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteSettings } from '../../types';
import { ThemeToggle } from './ThemeToggle';

interface FooterProps {
  settings: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const { language, setLanguage, t, localized } = useLanguage();

  return (
    <footer id="main-footer" className="w-full bg-[var(--bg-footer)] border-t border-[var(--border-subtle)] py-14 select-none transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[var(--border-subtle)]">
          
          {/* Brand & Designer details */}
          <div className="md:col-span-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center text-[var(--accent)] font-bold text-xs tracking-widest shadow-sm">
                KS
              </div>
              <span className="font-extrabold text-lg text-[var(--text-heading)] tracking-wider">
                KHUBAIB SALAFI
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {t('footer.role')} — Brand Identity, Graphic Design, Digital Design, UI/Web
            </p>
            <p className="text-xs text-[var(--text-muted)] font-mono max-w-sm">
              {localized(settings.footerTextEn, settings.footerTextBn)}
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3">
            <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest block mb-4 font-semibold">
              // NAVIGATION
            </span>
            <ul className="space-y-2 text-xs font-mono text-[var(--text-secondary)]">
              <li>
                <a href="/#work" className="hover:text-[var(--accent)] transition-colors">
                  {t('nav.work')}
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-[var(--accent)] transition-colors">
                  {t('nav.about')}
                </a>
              </li>
              <li>
                <a href="/#services" className="hover:text-[var(--accent)] transition-colors">
                  {t('nav.services')}
                </a>
              </li>
              <li>
                <a href="/#experience" className="hover:text-[var(--accent)] transition-colors">
                  {t('nav.experience')}
                </a>
              </li>
              <li>
                <a href="/#consultation" className="hover:text-[var(--accent)] transition-colors">
                  {t('nav.consultation')}
                </a>
              </li>
            </ul>
          </div>

          {/* Connect & Theme/Language controls */}
          <div className="md:col-span-3">
            <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest block mb-4 font-semibold">
              // CONNECT
            </span>
            <div className="flex flex-col gap-2.5">
              <a
                href={settings.behanceUrl || 'https://www.behance.net/khubaibsalafi13'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-primary)] hover:text-[var(--accent)] font-mono transition-colors"
              >
                <span>Behance</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent)]" />
              </a>

              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] font-mono transition-colors"
                >
                  {settings.email}
                </a>
              )}
            </div>

            {/* Language & Theme Controls in Footer */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] font-mono">{t('footer.switchLang')}:</span>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    language === 'en' ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  EN
                </button>
                <span className="text-[var(--border-medium)]">|</span>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors font-bangla ${
                    language === 'bn' ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  বাংলা
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] font-mono">Theme:</span>
                <ThemeToggle />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with Copyright & Admin CMS Link */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)]">
          <div>
            Khubaib Salafi {t('footer.copyright')}
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin CMS</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};
