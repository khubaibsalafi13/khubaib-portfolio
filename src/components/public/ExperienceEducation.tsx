import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, GraduationCap, ChevronDown, Calendar, Building2 } from 'lucide-react';
import { Experience, Education } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { gsap } from '../../lib/gsap';
import { refreshScroll } from '../../lib/scrollUtils';

interface ExperienceEducationProps {
  experience: Experience[];
  education: Education[];
}

interface AccordionItemProps {
  exp: Experience;
  isExpanded: boolean;
  onToggle: () => void;
  localized: (en?: string, bn?: string) => string;
  t: (key: string) => string;
}

const ExperienceAccordionItem: React.FC<AccordionItemProps> = ({
  exp,
  isExpanded,
  onToggle,
  localized,
  t,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const chevronRef = useRef<HTMLDivElement | null>(null);
  const isFirstMount = useRef(true);

  const role = localized(exp.roleEn, exp.roleBn);
  const responsibilities =
    exp.responsibilitiesEn.length > 0
      ? exp.responsibilitiesEn.map((item, idx) =>
          localized(item, exp.responsibilitiesBn[idx] || item)
        )
      : [];

  useEffect(() => {
    const el = contentRef.current;
    const chevron = chevronRef.current;
    if (!el) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (isExpanded) {
        gsap.set(el, { height: 'auto', opacity: 1, y: 0, display: 'block' });
        if (chevron) gsap.set(chevron, { rotate: 180 });
      } else {
        gsap.set(el, { height: 0, opacity: 0, y: -6, display: 'none' });
        if (chevron) gsap.set(chevron, { rotate: 0 });
      }
      return;
    }

    if (isExpanded) {
      gsap.killTweensOf(el);
      if (chevron) gsap.killTweensOf(chevron);

      gsap.set(el, { display: 'block' });
      gsap.fromTo(
        el,
        { height: 0, opacity: 0, y: -8 },
        {
          height: 'auto',
          opacity: 1,
          y: 0,
          duration: 0.42,
          ease: 'power2.out',
          onComplete: () => {
            refreshScroll();
          },
        }
      );

      if (chevron) {
        gsap.to(chevron, {
          rotate: 180,
          duration: 0.35,
          ease: 'power2.out',
        });
      }
    } else {
      gsap.killTweensOf(el);
      if (chevron) gsap.killTweensOf(chevron);

      gsap.to(el, {
        height: 0,
        opacity: 0,
        y: -6,
        duration: 0.32,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.set(el, { display: 'none' });
          refreshScroll();
        },
      });

      if (chevron) {
        gsap.to(chevron, {
          rotate: 0,
          duration: 0.35,
          ease: 'power2.out',
        });
      }
    }
  }, [isExpanded]);

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-all overflow-hidden shadow-[var(--card-shadow)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="text-base sm:text-lg font-bold text-[var(--text-heading)]">
              {exp.company}
            </span>
            {role && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--code-tag-bg)] text-[var(--code-tag-text)] border border-[var(--code-tag-border)] font-semibold">
                {role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{exp.period}</span>
          </div>
        </div>

        <div
          ref={chevronRef}
          className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] shrink-0 mt-1 shadow-sm transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {/* GSAP Animated Expandable Responsibilities Content */}
      <div ref={contentRef} style={{ overflow: 'hidden' }}>
        {responsibilities.length > 0 && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider block mb-3 font-semibold">
              {t('experience.keyResponsibilities')}
            </span>
            <ul className="space-y-2.5">
              {responsibilities.map((resp, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-2" />
                  <span className="leading-relaxed">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export const ExperienceEducation: React.FC<ExperienceEducationProps> = ({
  experience,
  education,
}) => {
  const { localized, t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>('exp-1');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const credibilityPillars = [
    { label: 'Brand Architecture', sub: 'Logo systems & Guidelines' },
    { label: 'Social & Digital', sub: 'Banners, Thumbnails & Ads' },
    { label: 'Print & Typography', sub: 'Bangla & English Editorial' },
    { label: 'Web & UI Foundations', sub: 'Design systems & Wireframes' },
  ];

  return (
    <section
      id="experience"
      className="py-20 sm:py-28 relative bg-[var(--bg-card-subtle)]/40 border-t border-[var(--border-subtle)] transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Credibility Band */}
        <div className="mb-16 p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] shadow-[var(--card-shadow)] grid grid-cols-2 md:grid-cols-4 gap-4">
          {credibilityPillars.map((pillar, i) => (
            <div
              key={i}
              className="flex flex-col border-l border-[var(--border-subtle)] pl-4 first:border-l-0 first:pl-0"
            >
              <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider mb-1 font-semibold">
                // Focus {i + 1}
              </span>
              <span className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
                {pillar.label}
              </span>
              <span className="text-xs text-[var(--text-secondary)] mt-0.5">
                {pillar.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Two Columns: Experience & Education */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">
          {/* Work Experience */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-medium)] shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)] tracking-tight">
                {t('experience.sectionTitle')}
              </h2>
            </div>

            <div className="space-y-4">
              {experience.map((exp) => (
                <ExperienceAccordionItem
                  key={exp.id}
                  exp={exp}
                  isExpanded={expandedId === exp.id}
                  onToggle={() => toggleExpand(exp.id)}
                  localized={localized}
                  t={t}
                />
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-medium)] shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)] tracking-tight">
                {t('education.sectionTitle')}
              </h2>
            </div>

            <div className="space-y-4">
              {education.map((edu) => (
                <div
                  key={edu.id}
                  className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-medium)] p-5 sm:p-6 shadow-[var(--card-shadow)]"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-[var(--code-tag-text)] px-2.5 py-0.5 rounded bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] font-semibold">
                      {edu.period}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-heading)] mb-1">
                    {localized(edu.degreeEn, edu.degreeBn)}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>{localized(edu.institutionEn, edu.institutionBn)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
