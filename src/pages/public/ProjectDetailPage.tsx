import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Tag, Sparkles } from 'lucide-react';
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

  const project = useMemo(() => {
    return allProjects.find((p) => p.slug === slug);
  }, [allProjects, slug]);

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
          <div className="mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-4 font-semibold">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              <span>{project.category}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-heading)] tracking-tight leading-[1.12] mb-6">
              {title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] shadow-[var(--card-shadow)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  {t('work.client')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {project.client || 'Direct Client'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  {t('work.year')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {project.year}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  {t('work.category')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {project.category}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  {t('work.role')}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {role || 'Lead Designer'}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Cover Image */}
          <div className="w-full h-[360px] sm:h-[480px] md:h-[560px] rounded-3xl overflow-hidden border border-[var(--border-medium)] mb-12 shadow-2xl bg-[var(--bg-card)]">
            <img
              src={project.coverImage}
              alt={title}
              onLoad={() => refreshScroll()}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Project Summary / Short Desc */}
          {shortDesc && (
            <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-[var(--bg-card-subtle)] border-l-4 border-[var(--accent)] text-base sm:text-lg text-[var(--text-primary)] leading-relaxed italic">
              "{shortDesc}"
            </div>
          )}

          {/* Editorial Grid: Overview & Concept */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16">
            {overview && (
              <div className="md:col-span-6 space-y-3">
                <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider block font-semibold">
                  // {t('work.overview')}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                  The Brief & Scope
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {overview}
                </p>
              </div>
            )}

            {concept && (
              <div className="md:col-span-6 space-y-3">
                <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider block font-semibold">
                  // {t('work.concept')}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                  Creative Direction
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {concept}
                </p>
              </div>
            )}
          </div>

          {/* Gallery Showcase */}
          {project.galleryImages && project.galleryImages.length > 0 && (
            <div className="mb-20">
              <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider block mb-6 font-semibold">
                // {t('work.gallery')} ({project.galleryImages.length} Artifacts)
              </span>
              <div className="space-y-8">
                {project.galleryImages.map((img, i) => {
                  const src = typeof img === 'string' ? img : img.url;
                  const caption = typeof img === 'object' ? localized(img.captionEn, img.captionBn) : undefined;
                  const alt = typeof img === 'object' ? localized(img.altTextEn, img.altTextBn) : `${title} showcase artifact ${i + 1}`;

                  return (
                    <div
                      key={typeof img === 'object' ? img.id : i}
                      className="w-full rounded-2xl overflow-hidden border border-[var(--border-medium)] bg-[var(--bg-card)] shadow-lg"
                    >
                      <img
                        src={src}
                        alt={alt || `${title} showcase artifact ${i + 1}`}
                        loading="lazy"
                        onLoad={() => refreshScroll()}
                        className="w-full h-auto object-cover"
                      />
                      {caption && (
                        <div className="p-3 bg-[var(--bg-card-subtle)] text-xs font-mono text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
                          {caption}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prev / Next Project Navigation Bar */}
          <div className="pt-10 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            {prevProject ? (
              <Link
                to={`/work/${prevProject.slug}`}
                className="group flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-colors w-full sm:w-auto shadow-[var(--card-shadow)]"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--accent)] transition-transform group-hover:-translate-x-1" />
                <div className="text-left">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                    {t('work.prevProject')}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
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
                className="group flex items-center justify-end gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-colors w-full sm:w-auto text-right shadow-[var(--card-shadow)]"
              >
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                    {t('work.nextProject')}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
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

      <Footer settings={settings} />
    </>
  );
};
