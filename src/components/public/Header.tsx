import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { smoothScrollTo } from '../../lib/scrollUtils';
import { ScrollTrigger, ScrollSmoother } from '../../lib/gsap';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { isDark } = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('work');

  // Nav items with their target section anchors
  const navItems = [
    { id: 'work', label: t('nav.work'), href: '/#work' },
    { id: 'testimonials', label: t('nav.testimonials'), href: '/#testimonials' },
    { id: 'services', label: t('nav.services'), href: '/#services' },
    { id: 'about', label: t('nav.about'), href: '/#about' },
    { id: 'experience', label: t('nav.experience'), href: '/#experience' },
    { id: 'consultation', label: t('nav.consultation'), href: '/#consultation' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || ScrollSmoother.get()?.scrollTop() || 0;
      setScrolled(scrollY > 20);

      // Determine active section on scroll if on home page
      if (location.pathname === '/') {
        const sections = ['work', 'testimonials', 'services', 'about', 'experience', 'consultation'];
        for (const sec of sections) {
          const el = document.getElementById(sec);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 240 && rect.bottom >= 120) {
              setActiveSection(sec);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also attach to ScrollTrigger if smoother is running
    const st = ScrollTrigger.create({
      onUpdate: () => handleScroll(),
    });

    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      st.kill();
    };
  }, [location.pathname]);

  const scrollToSection = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (location.pathname === '/') {
        const el = document.getElementById(targetId);
        if (el) {
          smoothScrollTo('#' + targetId, true);
          return;
        }
      }
    }
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-subtle)] shadow-[var(--card-shadow)] py-3'
          : 'bg-transparent py-4 sm:py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          id="brand-logo-link"
          className="group flex items-center gap-2.5 text-decoration-none focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center text-[var(--accent)] font-bold text-sm tracking-widest group-hover:border-[var(--accent)] transition-colors shadow-sm">
            KS
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-base sm:text-lg text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors">
              KHUBAIB
            </span>
            <span className="text-[10px] tracking-widest text-[var(--text-muted)] uppercase font-mono -mt-1">
              PORTFOLIO
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          id="desktop-nav"
          className="hidden md:flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full px-3 py-1.5 backdrop-blur-sm shadow-sm"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === '/' && activeSection === item.id;
            const isHovered = hoveredNav === item.id;

            return (
              <a
                key={item.id}
                id={`nav-link-${item.id}`}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith('/#') && location.pathname === '/') {
                    e.preventDefault();
                    scrollToSection(item.href);
                  }
                }}
                onMouseEnter={() => setHoveredNav(item.id)}
                className={`relative px-4 py-1.5 text-xs font-medium tracking-wider uppercase transition-colors duration-200 ${
                  isActive || isHovered
                    ? 'text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
                }`}
              >
                {item.label}

                {/* Animated Indicator line */}
                {(isActive || isHovered) && (
                  <motion.div
                    layoutId="header-nav-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent-glow)]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle, Language Switcher & Let's Talk CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Theme Toggle (Dark / Light) */}
          <ThemeToggle />

          {/* Language Switcher */}
          <div
            id="language-switcher"
            className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-full p-0.5 text-xs font-medium shadow-sm"
          >
            <button
              id="lang-btn-en"
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                language === 'en'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              EN
            </button>
            <button
              id="lang-btn-bn"
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer font-bangla ${
                language === 'bn'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              বাংলা
            </button>
          </div>

          {/* Let's Talk CTA */}
          <a
            id="header-cta-button"
            href="#consultation"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                scrollToSection('/#consultation');
              }
            }}
            className="group relative inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-full bg-[var(--bg-surface)] hover:bg-[var(--accent)] text-[var(--text-primary)] hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm"
          >
            <span>{t('nav.letsTalk')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[var(--accent)] group-hover:text-[var(--accent-contrast)]" />
          </a>
        </div>

        {/* Mobile Menu Button & Mobile Toggles */}
        <div className="flex sm:hidden items-center gap-2">
          {/* Mobile Theme Toggle */}
          <ThemeToggle variant="button" />

          {/* Mobile Language Switcher */}
          <button
            id="mobile-lang-toggle"
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1 text-xs border border-[var(--border-medium)] rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium font-mono"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>

          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-heading)] bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-medium)] px-4 pt-3 pb-6 flex flex-col gap-2 overflow-hidden shadow-xl"
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith('/#') && location.pathname === '/') {
                    e.preventDefault();
                    scrollToSection(item.href);
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-surface)] transition-colors"
              >
                {item.label}
              </a>
            ))}

            <div className="pt-3 mt-1 border-t border-[var(--border-subtle)] flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono text-[var(--text-muted)]">Theme & Language:</span>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </div>

              <a
                href="#consultation"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
              >
                {t('nav.letsTalk')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
