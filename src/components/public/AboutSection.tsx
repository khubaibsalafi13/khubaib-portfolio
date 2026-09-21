import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteContent } from '../../types';

interface AboutSectionProps {
  content: SiteContent;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ content }) => {
  const { localized, t } = useLanguage();

  const title = localized(content.aboutTitleEn, content.aboutTitleBn);
  const description = localized(content.aboutDescriptionEn, content.aboutDescriptionBn);

  const capabilities = [
    'Brand Guidelines & Logo Architecture',
    'High-Conversion Marketing & Social Collateral',
    'Custom Vector Illustration & Digital Art',
    'Typography, Arabic / Bangla Cultural Design',
    'UI Wireframing & Design System Foundations',
  ];

  const tools = [
    'Adobe Photoshop',
    'Adobe Illustrator',
    'Canva Pro',
    'Figma',
  ];

  return (
    <section id="about" className="py-20 sm:py-28 relative transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Information & Statement */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-4 font-semibold">
              <span>// ABOUT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight leading-[1.15] mb-6">
              {title}
            </h2>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              {description}
            </p>

            {/* Core Capabilities Checklist */}
            <div className="space-y-3 mb-8">
              {capabilities.map((cap, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-sm text-[var(--text-primary)] font-medium">{cap}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-[var(--border-subtle)]">
              <a
                href="#consultation"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('consultation')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
              >
                <span>{t('about.contactButton')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://www.behance.net/khubaibsalafi13"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-colors shadow-sm"
              >
                <span>Behance Profile</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>

          {/* Right Column: Structured Experience & Tools Frame */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] p-6 sm:p-8 shadow-[var(--card-shadow)] relative overflow-hidden transition-colors">
              <div
                className="absolute top-0 right-0 w-36 h-36 blur-3xl pointer-events-none rounded-full"
                style={{
                  backgroundColor: 'var(--accent)',
                  opacity: 'var(--blur-opacity)',
                }}
              />
              
              <div className="border-b border-[var(--border-subtle)] pb-4 mb-6">
                <span className="text-xs font-mono text-[var(--accent)] tracking-widest uppercase block mb-1 font-semibold">
                  PRACTITIONER PROFILE
                </span>
                <h3 className="text-xl font-bold text-[var(--text-heading)]">
                  Khubaib Salafi
                </h3>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  Graphic & Visual Designer
                </span>
              </div>

              {/* Design Software Stack */}
              <div className="mb-6">
                <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider block mb-3 font-semibold">
                  Core Toolset
                </span>
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs font-mono text-[var(--text-primary)] font-medium shadow-sm"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Working Philosophy */}
              <div className="pt-5 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed">
                <p className="italic">
                  "Every mark, margin, and color choice must fulfill an optical and communicative objective."
                </p>
              </div>

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
