import React, { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Tag, Sparkles } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/public/Header';
import { Footer } from '../../components/public/Footer';
import { settingsService } from '../../services/settingsService';
import { CursorGlow } from '../../components/public/CursorGlow';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { localized, t } = useLanguage();

  const allProjects = useMemo(() => projectService.getPublished(), []);
  const project = useMemo(() => {
    return allProjects.find((p) => p.slug === slug);
  }, [allProjects, slug]);

  const settings = useMemo(() => settingsService.getSettings(), []);

  // Determine previous and next projects
  const { prevProject, nextProject } = useMemo(() => {
    if (!project || allProjects.length <= 1) return { prevProject: null, nextProject: null };
    const currentIndex = allProjects.findIndex((p) => p.id === project.id);
    const prev = allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length];
    const next = allProjects[(currentIndex + 1) % allProjects.length];
    return { prevProject: prev, nextProject: next };
  }, [project, allProjects]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col justify-between transition-colors">
        <Header />
        <div className="max-w-xl mx-auto text-center px-4 py-32">
          <h1 className="text-3xl font-bold text-[var(--text-heading)] mb-4">Project Not Found</h1>
          <p className="text-[var(--text-secondary)] mb-8">The requested portfolio case study does not exist or has been unpublished.</p>
          <Link
            to="/#work"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-wider shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('work.backToProjects')}</span>
          </Link>
        </div>
        <Footer settings={settings} />
      </div>
    );
  }

  const title = localized(project.titleEn, project.titleBn);
  const shortDesc = localized(project.shortDescriptionEn, project.shortDescriptionBn);
  const overview = localized(project.overviewEn, project.overviewBn);
  const concept = localized(project.conceptEn, project.conceptBn);
  const role = localized(project.roleEn, project.roleBn);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col justify-between selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)] transition-colors duration-200 relative">
      <CursorGlow />
      <Header />

      <main className="flex-1 py-10 sm:py-16">
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
              <Sparkles className="w-3 h-3" />
              <span>{project.category}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-heading)] tracking-tight leading-[1.12] mb-6">
              {title}
            </h1>

            <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-3xl mb-8">
              {shortDesc}
            </p>

            {/* Metadata Pills Strip */}
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-medium)] shadow-[var(--card-shadow)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[var(--text-muted)] block mb-1 uppercase tracking-wider">{t('work.year')}</span>
                <span className="text-[var(--text-heading)] font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {project.year}
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-1 uppercase tracking-wider">{t('work.category')}</span>
                <span className="text-[var(--text-heading)] font-semibold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {project.category}
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-1 uppercase tracking-wider">{t('work.client')}</span>
                <span className="text-[var(--text-heading)] font-semibold truncate block">
                  {project.client || 'Creative Initiative'}
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-1 uppercase tracking-wider">{t('work.role')}</span>
                <span className="text-[var(--accent)] font-semibold truncate block">
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* Large Hero Showcase Visual */}
          <div className="mb-14 rounded-3xl overflow-hidden border border-[var(--border-medium)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
            <img
              src={project.coverImage}
              alt={title}
              className="w-full h-auto max-h-[680px] object-cover object-center"
            />
          </div>

          {/* Narrative Section: Overview & Concept */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-14 mb-16 pt-8 border-t border-[var(--border-subtle)]">
            <div className="md:col-span-6">
              <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest block mb-3 font-semibold">
                // {t('work.overview')}
              </span>
              <h3 className="text-2xl font-bold text-[var(--text-heading)] mb-4">
                The Objective
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {overview}
              </p>
            </div>

            <div className="md:col-span-6">
              <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest block mb-3 font-semibold">
                // {t('work.concept')}
              </span>
              <h3 className="text-2xl font-bold text-[var(--text-heading)] mb-4">
                The Creative Approach
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {concept}
              </p>
            </div>
          </div>

          {/* Gallery Images */}
          {project.galleryImages && project.galleryImages.length > 0 && (
            <div className="mb-16">
              <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest block mb-6 font-semibold">
                // {t('work.gallery')}
              </span>

              <div className="space-y-8">
                {project.galleryImages.map((img) => (
                  <figure
                    key={img.id}
                    className="rounded-2xl overflow-hidden border border-[var(--border-medium)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]"
                  >
                    <img
                      src={img.url}
                      alt={localized(img.altTextEn, img.altTextBn) || title}
                      className="w-full h-auto object-cover"
                    />
                    {(img.captionEn || img.captionBn) && (
                      <figcaption className="p-4 text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
                        {localized(img.captionEn, img.captionBn)}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* Previous / Next Project Navigation Bar */}
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
            ) : <div />}

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
            ) : <div />}
          </div>

        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
};
