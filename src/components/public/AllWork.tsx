import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Project, Category } from '../../types';
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

  return (
    <motion.article
      layout
      key={project.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-colors duration-300 overflow-hidden shadow-[var(--card-shadow)] hover:shadow-xl hover:-translate-y-1"
    >
      {/* Project Cover Image with Aspect Ratio */}
      <Link
        to={`/work/${project.slug}`}
        className="relative block w-full aspect-[16/10] overflow-hidden bg-[var(--bg-card-subtle)]"
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
            alt={localized(project.titleEn, project.titleBn)}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover object-center transition-all duration-300 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)]/80 via-transparent to-transparent opacity-80 pointer-events-none" />

        {/* Category Pill */}
        <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-[var(--accent)] uppercase bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-medium)] font-semibold shadow-sm z-10">
          {project.category}
        </span>

        {/* Year Tag */}
        <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-medium)] shadow-sm z-10">
          {project.year}
        </span>
      </Link>

      {/* Project Info Block */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors">
            <Link to={`/work/${project.slug}`}>
              {localized(project.titleEn, project.titleBn)}
            </Link>
          </h3>

          <Link
            to={`/work/${project.slug}`}
            className="p-2 rounded-full bg-[var(--bg-surface)] text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] group-hover:border-[var(--accent)] transition-all duration-200 shrink-0 shadow-sm"
            aria-label="View project details"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-5">
          {localized(project.shortDescriptionEn, project.shortDescriptionBn)}
        </p>

        <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>{project.client ? `Client: ${project.client}` : 'Creative Work'}</span>
          <span className="text-[var(--accent)] font-semibold">
            {localized(project.roleEn, project.roleBn)}
          </span>
        </div>
      </div>
    </motion.article>
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

        {/* Editorial Project Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isHydrated={isHydrated}
                localized={localized}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)] font-mono text-sm border border-dashed border-[var(--border-medium)] rounded-2xl">
            {t('work.noProjectsFound')}
          </div>
        )}
      </div>
    </section>
  );
};
