import { Project } from '../types';
import { initialProjects } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_projects';

export const projectService = {
  getAll(): Project[] {
    return getItem<Project[]>(STORAGE_KEY, initialProjects);
  },

  getPublished(): Project[] {
    const all = this.getAll();
    return all
      .filter((p) => p.published)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getFeatured(): Project[] {
    const published = this.getPublished();
    return published.filter((p) => p.featured);
  },

  getHeroFeatured(): Project | undefined {
    const all = this.getAll();
    const hero = all.find((p) => p.heroFeatured && p.published);
    if (hero) return hero;
    return all.find((p) => p.published) || all[0];
  },

  getBySlug(slug: string): Project | undefined {
    const all = this.getAll();
    return all.find((p) => p.slug === slug);
  },

  getById(id: string): Project | undefined {
    const all = this.getAll();
    return all.find((p) => p.id === id);
  },

  save(project: Partial<Project> & { id?: string; titleEn?: string }): Project {
    const all = this.getAll();
    let updated: Project;

    if (project.id) {
      // Update
      const index = all.findIndex((p) => p.id === project.id);
      if (index >= 0) {
        // If this project is marked as heroFeatured, unset others
        if (project.heroFeatured) {
          all.forEach((p) => {
            if (p.id !== project.id) p.heroFeatured = false;
          });
        }
        updated = {
          ...all[index],
          ...project,
          updatedAt: new Date().toISOString(),
        } as Project;
        all[index] = updated;
      } else {
        throw new Error('Project not found to update');
      }
    } else {
      // Create new
      const id = 'proj-' + Date.now();
      const titleEn = project.titleEn || 'Untitled Project';
      const slug = project.slug || titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      if (project.heroFeatured) {
        all.forEach((p) => { p.heroFeatured = false; });
      }

      updated = {
        id,
        slug,
        titleEn,
        titleBn: project.titleBn || '',
        shortDescriptionEn: project.shortDescriptionEn || '',
        shortDescriptionBn: project.shortDescriptionBn || '',
        overviewEn: project.overviewEn || '',
        overviewBn: project.overviewBn || '',
        conceptEn: project.conceptEn || '',
        conceptBn: project.conceptBn || '',
        roleEn: project.roleEn || 'Graphic Designer',
        roleBn: project.roleBn || 'গ্রাফিক ডিজাইনার',
        client: project.client || '',
        year: project.year || new Date().getFullYear().toString(),
        category: project.category || 'Brand Identity',
        coverImage: project.coverImage || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
        galleryImages: project.galleryImages || [],
        featured: project.featured ?? true,
        heroFeatured: project.heroFeatured ?? false,
        published: project.published ?? true,
        sortOrder: project.sortOrder ?? all.length + 1,
        createdAt: new Date().toISOString(),
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);
    return updated;
  },

  delete(id: string): void {
    const all = this.getAll().filter((p) => p.id !== id);
    setItem(STORAGE_KEY, all);
  },

  setHeroFeatured(id: string): void {
    const all = this.getAll().map((p) => ({
      ...p,
      heroFeatured: p.id === id,
    }));
    setItem(STORAGE_KEY, all);
  },

  reorder(projects: Project[]): void {
    const updated = projects.map((p, index) => ({
      ...p,
      sortOrder: index + 1,
    }));
    setItem(STORAGE_KEY, updated);
  },
};
