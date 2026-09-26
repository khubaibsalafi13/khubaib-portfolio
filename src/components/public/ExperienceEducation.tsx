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
    <div className="border-b border-[var(--border-subtle)] pb-6 transition-all">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full py-2.5 min-h-[44px] text-left flex items-start justify-between gap-3 sm:gap-4 cursor-pointer focus:outline-none group"
      >
        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 mb-1.5">
            <span className="text-base sm:text-lg font-bold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors break-words">
              {exp.company}
            </span>
            {role && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] font-medium self-start sm:self-auto inline-block">
                {role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>{exp.period}</span>
          </div>
        </div>

        <div
          ref={chevronRef}
          className="w-8 h-8 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center shrink-0 mt-0.5 transition-colors group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-contrast)]"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* GSAP Animated Expandable Responsibilities Content */}
      <div ref={contentRef} style={{ overflow: 'hidden' }}>
        {responsibilities.length > 0 && (
          <div className="pt-4 pb-2">
            <span className="text-xs uppercase tracking-wider text-[var(--accent)] block mb-3 font-semibold">
              {t('experience.keyResponsibilities')}
            </span>
            <ul className="space-y-2.5">
              {responsibilities.map((resp, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--text-secondary)] flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-2" />
                  <span>{resp}</span>
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
      className="py-20 sm:py-32 relative transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Open Editorial Credibility Pillars Row */}
        <div className="mb-14 sm:mb-20 py-6 sm:py-8 border-y border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {credibilityPillars.map((pillar, i) => (
            <div
              key={i}
              className="flex flex-col border-l border-[var(--border-subtle)] pl-4 sm:pl-5 first:border-l-0 first:pl-0 [&:nth-child(3)]:sm:first:border-l-0"
            >
              <span className="text-xs font-semibold text-[var(--accent)] tracking-wider mb-1 uppercase">
                Focus 0{i + 1}
              </span>
              <span className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
                {pillar.label}
              </span>
              <span className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5">
                {pillar.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Two Columns: Experience & Education */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Work Experience Panel */}
          <div className="lg:col-span-7 public-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--border-subtle)]">
              <Briefcase className="w-5 h-5 text-[var(--accent)] shrink-0" />
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

          {/* Education Panel */}
          <div className="lg:col-span-5 public-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--border-subtle)]">
              <GraduationCap className="w-5 h-5 text-[var(--accent)] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)] tracking-tight">
                {t('education.sectionTitle')}
              </h2>
            </div>

            <div className="space-y-6">
              {education.map((edu) => (
                <div
                  key={edu.id}
                  className="border-b border-[var(--border-subtle)] pb-6 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[var(--accent)]">
                      {edu.period}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-heading)] mb-1">
                    {localized(edu.degreeEn, edu.degreeBn)}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
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
