import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Project, Category, ThumbnailAspectRatio } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface AllWorkProps {
  projects: Project[];
  categories: Category[];
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
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="break-inside-avoid mb-6 lg:mb-8"
    >
      <Link
        to={`/work/${project.slug}`}
        aria-label={projectTitle || 'View project details'}
        style={ratioStyle}
        className={`group relative block w-full ${ratioClass} overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-all duration-300 shadow-[var(--card-shadow)] hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer`}
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
            className={`w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.03] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </Link>
    </motion.div>
  );
};

export const AllWork: React.FC<AllWorkProps> = ({ projects, categories, isHydrated = false }) => {
  const { localized, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'all') return projects;
    return projects.filter((p) => {
      return (
        p.category.toLowerCase() === selectedCategory.toLowerCase() ||
        categories.some(
          (c) => c.slug === selectedCategory && (p.category === c.nameEn || p.category === c.nameBn)
        )
      );
    });
  }, [projects, selectedCategory, categories]);

  return (
    <section id="work" className="py-20 sm:py-28 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Category Filter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--border-subtle)] mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-3 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{t('work.sectionTitle')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] tracking-tight">
              {t('work.allProjects')}
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="filter-all-btn"
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border border-[var(--border-medium)] hover:border-[var(--accent)]'
              }`}
            >
              {t('work.filterAll')}
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-${cat.slug}-btn`}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border border-[var(--border-medium)] hover:border-[var(--accent)]'
                }`}
              >
                {localized(cat.nameEn, cat.nameBn)}
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
