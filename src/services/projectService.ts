import { Project } from '../types';
import { initialProjects } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  projectToDb,
  projectFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_projects';

/**
 * Minimal columns required for Homepage rendering (Selected Work Carousel & AllWork Cards).
 * Excludes heavy detail-page fields (gallery_images, overview_en/bn, concept_en/bn).
 */
export const HOMEPAGE_PROJECT_COLUMNS =
  'id, slug, title_en, title_bn, short_description_en, short_description_bn, client, year, category, cover_image, thumbnail_aspect_ratio, featured, hero_featured, published, sort_order, role_en, role_bn';

/**
 * Safely strips heavy Base64 strings before storing in localStorage to prevent QuotaExceededError.
 */
function sanitizeForCache(projects: Project[]): Project[] {
  return projects.map((p) => {
    if (p.coverImage && p.coverImage.startsWith('data:image')) {
      return { ...p, coverImage: '' };
    }
    return p;
  });
}

export const projectService = {
  getAll(): Project[] {
    return getItem<Project[]>(STORAGE_KEY, initialProjects);
  },

  async getAllAsync(): Promise<Project[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const list = data.map(projectFromDb);
          setItem(STORAGE_KEY, sanitizeForCache(list));
          return list;
        } else if (error) {
          console.warn('Supabase fetch projects error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase projects fetch exception:', err);
      }
    }
    return this.getAll();
  },

  getPublished(): Project[] {
    const all = this.getAll();
    return all
      .filter((p) => p.published)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /**
   * Full published projects query (used for project details and deep navigation).
   */
  async getPublishedAsync(): Promise<Project[]> {
    if (isSupabaseConfigured()) {
      try {
        console.info('[Projects] Supabase full published request started');
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('published', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const liveList = data.map(projectFromDb);
          console.info('[Projects] live projects received:', liveList.length);
          if (liveList.length > 0) {
            const firstCover = liveList[0]?.coverImage || '';
            const preview = firstCover.length > 50 ? firstCover.substring(0, 50) + '...' : firstCover;
            console.info('[Projects] first live cover:', preview);
          }
          // Overwrite local cache with authoritative live data (sanitized of huge Base64)
          setItem(STORAGE_KEY, sanitizeForCache(liveList));
          return liveList;
        } else if (error) {
          console.warn('[Supabase] fetch published projects error:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase] getPublishedAsync exception:', err);
      }
    } else {
      console.warn('[Supabase] Not configured; serving fallback projects.');
    }
    return this.getPublished();
  },

  /**
   * Fast-path dedicated query for the Carousel's primary active featured project.
   * Returns immediately with the single highest-priority featured/hero_featured project
   * so the Carousel can mount its active visual and trigger early cover preloading.
   */
  async getFirstFeaturedForHomeAsync(): Promise<Project | null> {
    if (isSupabaseConfigured()) {
      try {
        console.info('[Projects] Fast-path active featured project query started');
        const { data, error } = await supabase
          .from('projects')
          .select(HOMEPAGE_PROJECT_COLUMNS)
          .eq('published', true)
          .or('featured.eq.true,hero_featured.eq.true')
          .order('sort_order', { ascending: true })
          .limit(1);

        if (!error && data && data.length > 0) {
          const first = projectFromDb(data[0]);
          console.info('[Projects] active featured project received:', first.slug);
          return first;
        } else if (error) {
          console.warn('[Supabase] fetch active featured error:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase] getFirstFeaturedForHomeAsync exception:', err);
      }
    }
    const hero = this.getHeroFeatured();
    return hero || null;
  },

  /**
   * Dedicated lightweight query for the Selected Work Carousel.
   * Filters specifically by featured / hero_featured and selects only minimal card fields.
   */
  async getFeaturedForHomeAsync(): Promise<Project[]> {
    if (isSupabaseConfigured()) {
      try {
        console.info('[Projects] Supabase featured carousel query started');
        const { data, error } = await supabase
          .from('projects')
          .select(HOMEPAGE_PROJECT_COLUMNS)
          .eq('published', true)
          .or('featured.eq.true,hero_featured.eq.true')
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const liveList = data.map(projectFromDb);
          console.info('[Projects] live featured carousel count:', liveList.length);
          return liveList;
        } else if (error) {
          console.warn('[Supabase] fetch featured carousel error:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase] getFeaturedForHomeAsync exception:', err);
      }
    }
    return this.getFeatured();
  },

  /**
   * Dedicated lightweight query for the AllWork portfolio grid on the Homepage.
   * Selects only minimal card fields and avoids downloading heavy detail columns.
   */
  async getPublishedForHomeAsync(): Promise<Project[]> {
    if (isSupabaseConfigured()) {
      try {
        console.info('[Projects] Supabase lightweight AllWork query started');
        const { data, error } = await supabase
          .from('projects')
          .select(HOMEPAGE_PROJECT_COLUMNS)
          .eq('published', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const liveList = data.map(projectFromDb);
          console.info('[Projects] live AllWork count:', liveList.length);
          setItem(STORAGE_KEY, sanitizeForCache(liveList));
          return liveList;
        } else if (error) {
          console.warn('[Supabase] fetch lightweight published error:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase] getPublishedForHomeAsync exception:', err);
      }
    }
    return this.getPublished();
  },

  getFeatured(): Project[] {
    const published = this.getPublished();
    return published.filter((p) => p.featured);
  },

  async getFeaturedAsync(): Promise<Project[]> {
    return this.getFeaturedForHomeAsync();
  },

  getHeroFeatured(): Project | undefined {
    const all = this.getAll();
    const hero = all.find((p) => p.heroFeatured && p.published);
    if (hero) return hero;
    return all.find((p) => p.published) || all[0];
  },

  async getHeroFeaturedAsync(): Promise<Project | undefined> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(HOMEPAGE_PROJECT_COLUMNS)
          .eq('published', true)
          .eq('hero_featured', true)
          .order('sort_order', { ascending: true })
          .limit(1);

        if (!error && data && data.length > 0) {
          return projectFromDb(data[0]);
        }
      } catch (err) {
        console.warn('[Supabase] getHeroFeaturedAsync exception:', err);
      }
    }
    return this.getHeroFeatured();
  },

  getBySlug(slug: string): Project | undefined {
    const all = this.getAll();
    return all.find((p) => p.slug === slug);
  },

  async getBySlugAsync(slug: string): Promise<Project | undefined> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          return projectFromDb(data);
        }
      } catch (err) {
        console.warn('Supabase getBySlugAsync exception:', err);
      }
    }
    return this.getBySlug(slug);
  },

  getById(id: string): Project | undefined {
    const all = this.getAll();
    return all.find((p) => p.id === id);
  },

  async save(project: Partial<Project> & { id?: string; titleEn?: string }): Promise<Project> {
    const all = this.getAll();
    let updated: Project;

    if (project.id) {
      // Update
      const index = all.findIndex((p) => p.id === project.id);
      if (index >= 0) {
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
        category: project.category || 'Social Media',
        coverImage: project.coverImage || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
        thumbnailAspectRatio: project.thumbnailAspectRatio || 'square',
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

    // Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const dbPayload = projectToDb(updated);
        const { error } = await supabase.from('projects').upsert(dbPayload);
        if (error) console.error('Supabase project upsert error:', error.message);
      } catch (err) {
        console.error('Supabase project save exception:', err);
      }
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((p) => p.id !== id);
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) console.error('Supabase project delete error:', error.message);
      } catch (err) {
        console.error('Supabase project delete exception:', err);
      }
    }
  },

  async setHeroFeatured(id: string): Promise<void> {
    const all = this.getAll().map((p) => ({
      ...p,
      heroFeatured: p.id === id,
    }));
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        // Reset all hero_featured in DB, then set this one
        await supabase.from('projects').update({ hero_featured: false }).neq('id', 'non-existent');
        await supabase.from('projects').update({ hero_featured: true }).eq('id', id);
      } catch (err) {
        console.error('Supabase setHeroFeatured exception:', err);
      }
    }
  },

  async reorder(projects: Project[]): Promise<void> {
    const updated = projects.map((p, index) => ({
      ...p,
      sortOrder: index + 1,
    }));
    setItem(STORAGE_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        for (const p of updated) {
          await supabase.from('projects').update({ sort_order: p.sortOrder }).eq('id', p.id);
        }
      } catch (err) {
        console.error('Supabase reorder exception:', err);
      }
    }
  },
};
