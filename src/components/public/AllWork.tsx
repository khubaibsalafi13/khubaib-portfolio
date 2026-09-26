import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Project, Category, ThumbnailAspectRatio } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface AllWorkProps {
  projects: Project[];
  categories?: Category[];
  isHydrated?: boolean;
}

interface ProjectCardProps {
  project: Project;
  isHydrated: boolean;
  localized: (en: string, bn?: string) => string;
}

const getAspectRatioClass = (ratio?: ThumbnailAspectRatio | string): string => {
  switch (ratio) {
    case 'portrait':
      return 'aspect-[4/5]';
    case 'landscape':
      return 'aspect-[16/9]';
    case 'square':
    default:
      return 'aspect-square';
  }
};

const getAspectRatioStyle = (ratio?: ThumbnailAspectRatio | string): React.CSSProperties => {
  switch (ratio) {
    case 'portrait':
      return { aspectRatio: '4 / 5' };
    case 'landscape':
      return { aspectRatio: '16 / 9' };
    case 'square':
    default:
      return { aspectRatio: '1 / 1' };
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isHydrated, localized }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      setImageLoaded(false);
      return;
    }
    if (imgRef.current?.complete) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [isHydrated, project.coverImage]);

  // Gate cover display cleanly on hydration to avoid stale seed flashes
  const hasLiveCover = Boolean(
    isHydrated &&
    project.coverImage &&
    project.coverImage.trim() !== ''
  );

  const ratio = project.thumbnailAspectRatio || 'square';
  const ratioClass = getAspectRatioClass(ratio);
  const ratioStyle = getAspectRatioStyle(ratio);
  const projectTitle = localized(project.titleEn, project.titleBn);

  return (
    <motion.div
      layout
      key={project.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="break-inside-avoid mb-6 lg:mb-8"
    >
      <Link
        to={`/work/${project.slug}`}
        aria-label={`View project: ${projectTitle || 'Artwork'}`}
        style={ratioStyle}
        className={`group relative block w-full ${ratioClass} overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all duration-500 shadow-[var(--card-shadow)] hover:shadow-xl hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer`}
      >
        {/* Subtle branded placeholder/skeleton surface */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-card)] flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none z-0 ${
            imageLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-xs font-bold animate-pulse mb-1.5 opacity-60">
            KS
          </div>
          <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            {isHydrated ? 'Loading Visual...' : 'Portfolio Item'}
          </span>
        </div>

        {hasLiveCover && (
          <img
            ref={imgRef}
            src={project.coverImage}
            alt={projectTitle}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.02] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </Link>
    </motion.div>
  );
};

interface PublicCategoryFilter {
  id: string;
  labelEn: string;
  labelBn: string;
  backendValues: string[];
}

const PUBLIC_CATEGORY_FILTERS: PublicCategoryFilter[] = [
  {
    id: 'social-media',
    labelEn: 'Social Media',
    labelBn: 'সোশ্যাল মিডিয়া',
    backendValues: ['Graphic Design', 'graphic-design', 'Social Media', 'social-media'],
  },
  {
    id: 'brand-identity',
    labelEn: 'Brand Identity',
    labelBn: 'ব্র্যান্ড আইডেন্টিটি',
    backendValues: ['Brand Identity', 'brand-identity'],
  },
  {
    id: 'thumbnail',
    labelEn: 'Thumbnail',
    labelBn: 'থাম্বনেইল',
    backendValues: ['Digital Design', 'digital-design', 'Thumbnail', 'thumbnail'],
  },
  {
    id: 'others',
    labelEn: 'Others',
    labelBn: 'অন্যান্য',
    backendValues: ['UI / Web Design', 'ui-web-design', 'UI/UX Design', 'Others', 'others'],
  },
];

export const AllWork: React.FC<AllWorkProps> = ({ projects, isHydrated = false }) => {
  const { localized, t } = useLanguage();
  const [selectedFilterId, setSelectedFilterId] = useState<string>('all');

  const filteredProjects = useMemo(() => {
    if (selectedFilterId === 'all') return projects;
    const activeFilter = PUBLIC_CATEGORY_FILTERS.find((f) => f.id === selectedFilterId);
    if (!activeFilter) return projects;

    return projects.filter((p) => {
      const cat = (p.category || '').trim().toLowerCase();
      return activeFilter.backendValues.some(
        (backendVal) => backendVal.toLowerCase() === cat
      );
    });
  }, [projects, selectedFilterId]);

  return (
    <section id="work" className="py-24 sm:py-32 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Category Filter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--border-subtle)] mb-12">
          <div>
            <div className="dark:flex hidden items-center gap-2 mb-3">
              <span className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">
                // {t('work.sectionTitle')}
              </span>
            </div>
            <div className="dark:hidden flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {t('work.sectionTitle')}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight">
              {t('work.allProjects')}
            </h2>
          </div>

          {/* Filter Segmented Control in Requested Order: All | Social Media | Brand Identity | Thumbnail | Others */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full">
            <button
              id="filter-all-btn"
              type="button"
              onClick={() => setSelectedFilterId('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                selectedFilterId === 'all'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              {t('work.filterAll')}
            </button>

            {PUBLIC_CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                id={`filter-${filter.id}-btn`}
                type="button"
                onClick={() => setSelectedFilterId(filter.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                  selectedFilterId === filter.id
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
                }`}
              >
                {localized(filter.labelEn, filter.labelBn)}
              </button>
            ))}
          </div>
        </div>

        {/* Visual-First Image Gallery */}
        <div className="columns-1 md:columns-2 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isHydrated={isHydrated}
                localized={localized}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)] font-mono text-sm border border-dashed border-[var(--border-medium)] rounded-2xl">
            {t('work.noProjectsFound')}
          </div>
        )}
      </div>
    </section>
  );
};
