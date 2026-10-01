import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Tag, Sparkles, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useLanguage } from '../../context/LanguageContext';
import { Footer } from '../../components/public/Footer';
import { settingsService } from '../../services/settingsService';
import { refreshScroll } from '../../lib/scrollUtils';
import { Project, SiteSettings } from '../../types';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { localized, t } = useLanguage();

  const [allProjects, setAllProjects] = useState<Project[]>(() => projectService.getPublished());
  const [settings, setSettings] = useState<SiteSettings>(() => settingsService.getSettings());

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [latestProjects, latestSettings] = await Promise.all([
          projectService.getPublishedAsync(),
          settingsService.getSettingsAsync(),
        ]);
        if (isMounted) {
          if (latestProjects) setAllProjects(latestProjects);
          if (latestSettings) setSettings(latestSettings);
          refreshScroll();
        }
      } catch (err) {
        console.warn('Failed to fetch project detail from Supabase:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const project = useMemo(() => {
    return allProjects.find((p) => p.slug === slug);
  }, [allProjects, slug]);

  const galleryItems = useMemo(() => {
    return project?.galleryImages || [];
  }, [project]);

  // Lightbox keyboard controls (Escape to close, ArrowLeft / ArrowRight to navigate)
  useEffect(() => {
    if (lightboxIndex === null || galleryItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + galleryItems.length) % galleryItems.length : null
        );
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % galleryItems.length : null
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, galleryItems.length]);

  // Determine previous and next projects
  const { prevProject, nextProject } = useMemo(() => {
    if (!project || allProjects.length <= 1) return { prevProject: null, nextProject: null };
    const currentIndex = allProjects.findIndex((p) => p.id === project.id);
    const prev = allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length];
    const next = allProjects[(currentIndex + 1) % allProjects.length];
    return { prevProject: prev, nextProject: next };
  }, [project, allProjects]);

  if (!project) {
    return (
      <>
        <main className="flex-1 max-w-xl mx-auto text-center px-4 pt-32 pb-24">
          <h1 className="text-3xl font-bold text-[var(--text-heading)] mb-4">Project Not Found</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            The requested portfolio case study does not exist or has been unpublished.
          </p>
          <Link
            to="/#work"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-wider shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('work.backToProjects')}</span>
          </Link>
        </main>
        <Footer settings={settings} />
      </>
    );
  }

  const title = localized(project.titleEn, project.titleBn);
  const shortDesc = localized(project.shortDescriptionEn, project.shortDescriptionBn);
  const overview = localized(project.overviewEn, project.overviewBn);
  const concept = localized(project.conceptEn, project.conceptBn);
  const role = localized(project.roleEn, project.roleBn);

  return (
    <>
      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-8">
            <Link
              to="/#work"
              className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('work.backToProjects')}</span>
            </Link>
          </div>

          {/* Project Header & Metadata */}
          <div className="mb-12 sm:mb-16">
            {/* Kicker: Dark theme preserves original monospace kicker; Light theme uses minimal dot kicker */}
            <div className="dark:inline-flex hidden items-center gap-2 mb-4">
              <span className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">
                // {project.category}
              </span>
            </div>
            <div className="dark:hidden inline-flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {project.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-heading)] tracking-tight leading-[1.12] mb-8">
              {title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-[var(--border-subtle)]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-1 font-medium">
                  {t('work.client')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {project.client || 'Direct Client'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-1 font-medium">
                  {t('work.year')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {project.year}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-1 font-medium">
                  {t('work.category')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {project.category}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-1 font-medium">
                  {t('work.role')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {role || 'Lead Designer'}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Cover Image */}
          {project.coverImage && typeof project.coverImage === 'string' && project.coverImage.trim() !== '' && (
            <div className="w-full h-[360px] sm:h-[480px] md:h-[560px] rounded-3xl overflow-hidden border border-[var(--border-subtle)] mb-14 shadow-[var(--card-shadow)] bg-[var(--bg-card)]">
              <img
                src={project.coverImage}
                alt={title}
                onLoad={() => refreshScroll()}
                className="w-full h-full object-cover object-center"
              />
            </div>
          )}

          {/* Project Summary / Short Desc */}
          {shortDesc && (
            <div className="mb-16 pl-6 sm:pl-8 border-l-2 border-[var(--accent)] text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed italic">
              "{shortDesc}"
            </div>
          )}

          {/* Editorial Grid: Overview & Concept */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 mb-20">
            {overview && (
              <div className="md:col-span-6 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                  <span className="text-xs uppercase tracking-wider text-[var(--accent)] block font-semibold">
                    {t('work.overview')}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                  The Brief & Scope
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-line font-normal">
                  {overview}
                </p>
              </div>
            )}

            {concept && (
              <div className="md:col-span-6 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                  <span className="text-xs uppercase tracking-wider text-[var(--accent)] block font-semibold">
                    {t('work.concept')}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                  Creative Direction
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-line font-normal">
                  {concept}
                </p>
              </div>
            )}
          </div>

          {/* Gallery Showcase - Clean Case Study Presentation */}
          {galleryItems.length > 0 && (
            <div className="mb-24">
              <div className="flex items-center justify-between gap-4 pb-4 mb-8 sm:mb-12 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                    {t('work.gallery')} ({galleryItems.length} Artifacts)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline-block">
                  Click any image for full-screen view
                </span>
              </div>

              <div className="space-y-12 sm:space-y-16">
                {galleryItems.map((img, i) => {
                  const src = typeof img === 'string' ? img : img.url;
                  if (!src || typeof src !== 'string' || src.trim() === '') return null;
                  const caption = typeof img === 'object' ? localized(img.captionEn, img.captionBn) : undefined;
                  const alt = typeof img === 'object' ? localized(img.altTextEn, img.altTextBn) : `${title} showcase artifact ${i + 1}`;

                  return (
                    <figure
                      key={typeof img === 'object' ? img.id : i}
                      className="group relative flex flex-col items-center"
                    >
                      <div
                        onClick={() => setLightboxIndex(i)}
                        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent)] bg-[var(--bg-card)] shadow-[var(--card-shadow)] cursor-zoom-in transition-all duration-300 hover:shadow-xl"
                      >
                        <img
                          src={src}
                          alt={alt || `${title} showcase artifact ${i + 1}`}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          onLoad={() => refreshScroll()}
                          className="w-full h-auto object-contain transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                        />

                        {/* Subtle Zoom Hint Overlay */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white shadow-lg">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>

                      {caption && (
                        <figcaption className="w-full text-xs sm:text-sm text-[var(--text-secondary)] font-mono mt-3.5 pl-3 border-l-2 border-[var(--accent)] text-left leading-relaxed">
                          {caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prev / Next Project Navigation Bar */}
          <div className="pt-12 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-6">
            {prevProject ? (
              <Link
                to={`/work/${prevProject.slug}`}
                className="group flex items-center gap-3.5 py-3 px-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all duration-200 w-full sm:w-auto shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--accent)] transition-transform group-hover:-translate-x-1" />
                <div className="text-left">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-medium">
                    {t('work.prevProject')}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors">
                    {localized(prevProject.titleEn, prevProject.titleBn)}
                  </span>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextProject ? (
              <Link
                to={`/work/${nextProject.slug}`}
                className="group flex items-center justify-end gap-3.5 py-3 px-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all duration-200 w-full sm:w-auto text-right shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5"
              >
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-medium">
                    {t('work.nextProject')}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors">
                    {localized(nextProject.titleEn, nextProject.titleBn)}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--accent)] transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar: Counter & Close Button */}
          <div
            className="flex items-center justify-between z-10 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-mono text-[var(--accent)] font-bold tracking-wider">
                Artifact {String(lightboxIndex + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-white/50">
                · {title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close lightbox"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Showcase Area with Navigation Arrows */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev - 1 + galleryItems.length) % galleryItems.length : null
                  )
                }
                aria-label="Previous artifact"
                className="absolute left-2 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-[var(--accent)] text-white hover:text-[var(--accent-contrast)] border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {(() => {
              const item = galleryItems[lightboxIndex];
              const activeSrc = typeof item === 'string' ? item : item?.url;
              if (!activeSrc || typeof activeSrc !== 'string' || activeSrc.trim() === '') return null;
              const activeAlt =
                typeof item === 'object'
                  ? localized(item.altTextEn, item.altTextBn) || `${title} artifact ${lightboxIndex + 1}`
                  : `${title} artifact ${lightboxIndex + 1}`;

              return (
                <div className="max-w-5xl max-h-[80vh] flex items-center justify-center p-2">
                  <img
                    src={activeSrc}
                    alt={activeAlt}
                    className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl"
                  />
                </div>
              );
            })()}

            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % galleryItems.length : null
                  )
                }
                aria-label="Next artifact"
                className="absolute right-2 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-[var(--accent)] text-white hover:text-[var(--accent-contrast)] border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Caption Bar */}
          <div
            className="text-center z-10 w-full max-w-2xl mx-auto px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {typeof galleryItems[lightboxIndex] === 'object' &&
            (galleryItems[lightboxIndex].captionEn || galleryItems[lightboxIndex].captionBn) ? (
              <p className="text-xs sm:text-sm text-white/90 font-mono leading-relaxed bg-black/50 py-2 px-4 rounded-xl border border-white/10">
                {localized(
                  galleryItems[lightboxIndex].captionEn,
                  galleryItems[lightboxIndex].captionBn
                )}
              </p>
            ) : (
              <span className="text-[11px] font-mono text-white/40">
                Use Left / Right arrow keys to navigate · Escape to close
              </span>
            )}
          </div>
        </div>
      )}

      <Footer settings={settings} />
    </>
  );
};
