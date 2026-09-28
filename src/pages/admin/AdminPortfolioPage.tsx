import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Save,
  X,
  Check,
  RefreshCw,
  Layers,
  Upload,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { categoryService } from '../../services/categoryService';
import { imageService } from '../../services/imageService';
import { Project, ProjectImage, Category, ThumbnailAspectRatio } from '../../types';

const ADMIN_CATEGORY_PRIORITY = ['Social Media', 'Brand Identity', 'Digital Design'];

const getSortedCategories = (cats: Category[]): Category[] => {
  return [...cats].sort((a, b) => {
    const idxA = ADMIN_CATEGORY_PRIORITY.indexOf(a.nameEn);
    const idxB = ADMIN_CATEGORY_PRIORITY.indexOf(b.nameEn);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.sortOrder - b.sortOrder;
  });
};

export const AdminPortfolioPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => projectService.getAll());
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCarousel, setUploadingCarousel] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replacedCoverImageUrl, setReplacedCoverImageUrl] = useState<string>('');
  const [previewModalImage, setPreviewModalImage] = useState<{
    url: string;
    title?: string;
    subtitle?: string;
  } | null>(null);
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);
  const [galleryUrlInput, setGalleryUrlInput] = useState<string>('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [fetchedProjects, fetchedCats] = await Promise.all([
        projectService.getAllAsync(),
        categoryService.getAllAsync(),
      ]);
      setProjects(fetchedProjects);
      setCategories(fetchedCats);
    } catch (err) {
      console.error('Error refreshing projects:', err);
      setProjects(projectService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewModalImage) {
        setPreviewModalImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewModalImage]);

  const handleStartNew = () => {
    const sortedCats = getSortedCategories(categories);
    const defaultCat =
      sortedCats.find((c) => c.nameEn === 'Social Media')?.nameEn ||
      sortedCats[0]?.nameEn ||
      'Social Media';

    setIsCreating(true);
    setReplacedCoverImageUrl('');
    setEditingProject({
      id: '',
      slug: '',
      titleEn: '',
      titleBn: '',
      shortDescriptionEn: '',
      shortDescriptionBn: '',
      overviewEn: '',
      overviewBn: '',
      conceptEn: '',
      conceptBn: '',
      roleEn: 'Social Media & Graphic Designer',
      roleBn: 'সোশ্যাল মিডিয়া ও গ্রাফিক ডিজাইনার',
      client: '',
      year: new Date().getFullYear().toString(),
      category: defaultCat,
      coverImage: imageService.getPresetSample('branding'),
      carouselImage: '',
      thumbnailAspectRatio: 'square',
      galleryImages: [],
      featured: true,
      heroFeatured: false,
      published: true,
      sortOrder: projects.length + 1,
      createdAt: new Date().toISOString(),
    });
  };

  const handleEdit = (proj: Project) => {
    setIsCreating(false);
    setReplacedCoverImageUrl('');
    setEditingProject({
      ...proj,
      thumbnailAspectRatio: proj.thumbnailAspectRatio || 'square',
      carouselImage: proj.carouselImage || '',
      galleryImages: Array.isArray(proj.galleryImages) ? proj.galleryImages : [],
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await projectService.delete(id);
      await refresh();
      if (editingProject?.id === id) {
        setEditingProject(null);
      }
    }
  };

  const handleTogglePublish = async (proj: Project) => {
    await projectService.save({ id: proj.id, published: !proj.published });
    await refresh();
  };

  const handleToggleFeatured = async (proj: Project) => {
    await projectService.save({ id: proj.id, featured: !proj.featured });
    await refresh();
  };

  const handleSetHeroFeatured = async (id: string) => {
    await projectService.setHeroFeatured(id);
    await refresh();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editingProject) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      if (
        !replacedCoverImageUrl &&
        editingProject.coverImage &&
        editingProject.coverImage.includes('/storage/v1/object/public/')
      ) {
        setReplacedCoverImageUrl(editingProject.coverImage);
      }
      const targetRatio = editingProject.thumbnailAspectRatio || 'square';
      const url = await imageService.uploadProjectThumbnail(file, targetRatio);
      if (!url || !url.startsWith('http') || url.startsWith('data:')) {
        throw new Error('Upload rejected: Result was not a valid Supabase Storage HTTPS URL.');
      }
      setEditingProject((prev) => (prev ? { ...prev, coverImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveCoverImage = () => {
    if (!editingProject) return;
    if (
      !replacedCoverImageUrl &&
      editingProject.coverImage &&
      editingProject.coverImage.includes('/storage/v1/object/public/')
    ) {
      setReplacedCoverImageUrl(editingProject.coverImage);
    }
    setEditingProject((prev) => (prev ? { ...prev, coverImage: '' } : null));
  };

  const handleCarouselImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editingProject) return;
    const file = e.target.files[0];
    setUploadingCarousel(true);
    try {
      const url = await imageService.uploadCarouselThumbnail(file, editingProject.id || undefined);
      if (!url || !url.startsWith('http') || url.startsWith('data:')) {
        throw new Error('Upload rejected: Result was not a valid Supabase Storage HTTPS URL.');
      }
      setEditingProject((prev) => (prev ? { ...prev, carouselImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Carousel image upload failed');
    } finally {
      setUploadingCarousel(false);
      e.target.value = '';
    }
  };

  const handleRemoveCarouselImage = () => {
    if (!editingProject) return;
    setEditingProject((prev) => (prev ? { ...prev, carouselImage: '' } : null));
  };

  // Upload multiple gallery images
  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingProject) return;
    const files = Array.from(e.target.files);
    setUploadingGallery(true);
    try {
      const newItems: ProjectImage[] = [];
      const currentGallery = editingProject.galleryImages || [];
      let baseOrder = currentGallery.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await imageService.uploadProjectGalleryImage(file);
        if (!url || !url.startsWith('http') || url.startsWith('data:')) {
          console.warn('Skipping invalid gallery upload result:', file.name);
          continue;
        }
        baseOrder += 1;
        newItems.push({
          id: `gal-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          captionEn: '',
          captionBn: '',
          sortOrder: baseOrder,
        });
      }

      setEditingProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...newItems],
        };
      });
    } catch (err: any) {
      alert(err.message || 'Gallery image upload failed');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  // Replace a single gallery image
  const handleReplaceGalleryImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editingProject) return;
    const file = e.target.files[0];
    setUploadingGallery(true);
    try {
      const url = await imageService.uploadProjectGalleryImage(file);
      if (!url || !url.startsWith('http') || url.startsWith('data:')) {
        throw new Error('Upload rejected: Result was not a valid Supabase Storage HTTPS URL.');
      }
      setEditingProject((prev) => {
        if (!prev) return null;
        const updated = [...(prev.galleryImages || [])];
        if (updated[index]) {
          updated[index] = { ...updated[index], url };
        }
        return { ...prev, galleryImages: updated };
      });
    } catch (err: any) {
      alert(err.message || 'Gallery image replacement failed');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  // Remove single gallery image
  const handleRemoveGalleryImage = (index: number) => {
    if (!editingProject) return;
    setEditingProject((prev) => {
      if (!prev) return null;
      const updated = (prev.galleryImages || []).filter((_, i) => i !== index);
      return {
        ...prev,
        galleryImages: updated.map((item, idx) => ({ ...item, sortOrder: idx + 1 })),
      };
    });
  };

  // Move gallery image up/down
  const handleMoveGalleryImage = (index: number, direction: 'up' | 'down') => {
    if (!editingProject) return;
    const gallery = [...(editingProject.galleryImages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    const temp = gallery[index];
    gallery[index] = gallery[targetIndex];
    gallery[targetIndex] = temp;

    setEditingProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        galleryImages: gallery.map((item, idx) => ({ ...item, sortOrder: idx + 1 })),
      };
    });
  };

  // Update caption
  const handleUpdateGalleryCaption = (index: number, lang: 'en' | 'bn', text: string) => {
    if (!editingProject) return;
    setEditingProject((prev) => {
      if (!prev) return null;
      const updated = [...(prev.galleryImages || [])];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [lang === 'en' ? 'captionEn' : 'captionBn']: text,
        };
      }
      return { ...prev, galleryImages: updated };
    });
  };

  // Update alt text (SEO & accessibility)
  const handleUpdateGalleryAltText = (index: number, lang: 'en' | 'bn', text: string) => {
    if (!editingProject) return;
    setEditingProject((prev) => {
      if (!prev) return null;
      const updated = [...(prev.galleryImages || [])];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [lang === 'en' ? 'altTextEn' : 'altTextBn']: text,
        };
      }
      return { ...prev, galleryImages: updated };
    });
  };

  // Direct CDN URL append for gallery
  const handleAddGalleryByUrl = () => {
    if (!editingProject || !galleryUrlInput.trim()) return;
    const url = galleryUrlInput.trim();
    if (!url.startsWith('http')) {
      alert('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    const currentGallery = editingProject.galleryImages || [];
    const newItem: ProjectImage = {
      id: `gal-url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url,
      captionEn: '',
      captionBn: '',
      altTextEn: '',
      altTextBn: '',
      sortOrder: currentGallery.length + 1,
    };
    setEditingProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        galleryImages: [...currentGallery, newItem],
      };
    });
    setGalleryUrlInput('');
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedGalleryIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedGalleryIndex === null || draggedGalleryIndex === index) return;
  };

  const handleDrop = (index: number) => {
    if (draggedGalleryIndex === null || draggedGalleryIndex === index || !editingProject) {
      setDraggedGalleryIndex(null);
      return;
    }
    const gallery = [...(editingProject.galleryImages || [])];
    const [movedItem] = gallery.splice(draggedGalleryIndex, 1);
    gallery.splice(index, 0, movedItem);

    setEditingProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        galleryImages: gallery.map((item, idx) => ({ ...item, sortOrder: idx + 1 })),
      };
    });
    setDraggedGalleryIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedGalleryIndex(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!editingProject.titleEn.trim()) {
      alert('Please enter a project title in English.');
      return;
    }

    setSaving(true);
    try {
      await projectService.save(editingProject);

      // Only delete old Storage object after database update succeeds
      if (replacedCoverImageUrl && replacedCoverImageUrl !== editingProject.coverImage) {
        await imageService.deleteStorageFile(replacedCoverImageUrl);
        setReplacedCoverImageUrl('');
      }

      setEditingProject(null);
      setIsCreating(false);
      await refresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const sortedCategories = getSortedCategories(categories);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Portfolio Project Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Create, edit, reorder, and configure project visuals and aspect ratios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#092014] border border-[#143d26] text-[#8ba394] hover:text-white transition-colors"
            title="Refresh projects"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleStartNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Editor Modal / Drawer */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#05140d] border border-[#143a25] rounded-2xl shadow-2xl overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#112a1c]">
              <div>
                <h2 className="text-xl font-bold text-[#f0f6f2]">
                  {isCreating ? 'Create New Project' : `Edit: ${editingProject.titleEn}`}
                </h2>
                <p className="text-xs font-mono text-[#8ba394] mt-0.5">
                  Set details, category, cover artwork, dedicated carousel visual, and gallery showcase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1.5 text-[#7b9887] hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Navigation Jump Bar for Three Image Areas */}
            <div className="sticky top-0 z-30 -mx-6 sm:-mx-8 px-6 sm:px-8 py-3 bg-[#05140d]/95 backdrop-blur-md border-y border-[#16432b] mb-6 flex flex-wrap items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#a8d3b8] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span>THREE SEPARATE IMAGE AREAS:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('area-cover-artwork')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-2.5 py-1.5 rounded-lg bg-[#072013] border border-[#16472b] hover:border-[#10b981] hover:bg-[#0a2f1c] text-[#a8d3b8] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>1. Cover Artwork</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('area-carousel-thumbnail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-2.5 py-1.5 rounded-lg bg-[#072013] border border-[#16472b] hover:border-[#10b981] hover:bg-[#0a2f1c] text-[#a8d3b8] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>2. Carousel Visual (16:9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('area-gallery-showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-2.5 py-1.5 rounded-lg bg-[#072013] border border-[#16472b] hover:border-[#10b981] hover:bg-[#0a2f1c] text-[#a8d3b8] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>3. Project Gallery ({editingProject.galleryImages?.length || 0})</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-6">
              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingProject.titleEn}
                    onChange={(e) => setEditingProject({ ...editingProject, titleEn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] focus:border-[#10b981] text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Title (Bangla)</label>
                  <input
                    type="text"
                    value={editingProject.titleBn}
                    onChange={(e) => setEditingProject({ ...editingProject, titleBn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] focus:border-[#10b981] text-sm text-white outline-none font-bangla"
                  />
                </div>
              </div>

              {/* Category, Year, Client, Role */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Category</label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
                  >
                    {sortedCategories.map((c) => (
                      <option key={c.id} value={c.nameEn}>
                        {c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Year</label>
                  <input
                    type="text"
                    value={editingProject.year}
                    onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Client / Context</label>
                  <input
                    type="text"
                    value={editingProject.client}
                    onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Role</label>
                  <input
                    type="text"
                    value={editingProject.roleEn}
                    onChange={(e) => setEditingProject({ ...editingProject, roleEn: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* AREA 1: PROJECT THUMBNAIL / COVER SECTION */}
              <div id="area-cover-artwork" className="rounded-2xl bg-[#030e07] border-2 border-[#163e27] p-5 sm:p-6 space-y-4 shadow-lg scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#112d1c]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-[#10b981] text-[#022013] font-mono text-[10px] font-extrabold uppercase">
                        Area 1 of 3
                      </span>
                      <span className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#10b981]" />
                        Project Thumbnail / Cover Artwork
                      </span>
                    </div>
                    <p className="text-xs text-[#8ba394] font-mono">
                      Used by All Projects grid and case study header. Select aspect ratio and upload artwork.
                    </p>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center gap-1.5 bg-[#05180f] p-1 rounded-xl border border-[#163f27] self-start sm:self-auto">
                    {[
                      { value: 'square' as ThumbnailAspectRatio, label: '1:1 Square' },
                      { value: 'portrait' as ThumbnailAspectRatio, label: '4:5 Portrait' },
                      { value: 'landscape' as ThumbnailAspectRatio, label: '16:9 Landscape' },
                    ].map((opt) => {
                      const isSelected = (editingProject.thumbnailAspectRatio || 'square') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setEditingProject({
                              ...editingProject,
                              thumbnailAspectRatio: opt.value,
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                            isSelected
                              ? 'bg-[#10b981] text-[#022013] font-bold shadow-sm'
                              : 'text-[#8ba394] hover:text-white hover:bg-[#0c2b1a]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview Frame & Upload Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Aspect-Ratio Scaled Preview Frame */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center">
                    <div
                      onClick={() => {
                        if (editingProject.coverImage) {
                          setPreviewModalImage({
                            url: editingProject.coverImage,
                            title: editingProject.titleEn || 'Cover Artwork Preview',
                            subtitle: `Thumbnail Ratio: ${(editingProject.thumbnailAspectRatio || 'square').toUpperCase()}`,
                          });
                        }
                      }}
                      className={`w-full max-w-[260px] rounded-xl overflow-hidden bg-[#020a05] border-2 border-dashed border-[#17462b] relative group flex items-center justify-center shadow-inner ${
                        editingProject.coverImage ? 'cursor-pointer hover:border-[#10b981]' : ''
                      }`}
                    >
                      <div
                        className={`w-full transition-all duration-300 ${
                          editingProject.thumbnailAspectRatio === 'portrait'
                            ? 'aspect-[4/5]'
                            : editingProject.thumbnailAspectRatio === 'landscape'
                            ? 'aspect-[16/9]'
                            : 'aspect-square'
                        }`}
                      >
                        {editingProject.coverImage ? (
                          <>
                            <img
                              src={editingProject.coverImage}
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/20 text-xs font-mono text-white">
                                <Maximize2 className="w-3 h-3 text-[#10b981]" />
                                Click to Zoom
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#557361]">
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50 text-[#8ba394]" />
                            <span className="text-xs font-mono text-[#8ba394]">No artwork assigned</span>
                            <span className="text-[10px] font-mono text-[#436250] mt-1">
                              Ratio: {(editingProject.thumbnailAspectRatio || 'square').toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Aspect Ratio Floating Tag */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-[#a3c2af]">
                        {editingProject.thumbnailAspectRatio === 'portrait'
                          ? '4:5 (Max 1200×1500)'
                          : editingProject.thumbnailAspectRatio === 'landscape'
                          ? '16:9 (Max 1600×900)'
                          : '1:1 (Max 1200×1200)'}
                      </div>
                    </div>
                  </div>

                  {/* Upload, Replace, Remove and Direct URL Input */}
                  <div className="md:col-span-7 space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-mono text-[#8ba394] mb-1">
                        Direct Image CDN URL
                      </label>
                      <input
                        type="text"
                        value={editingProject.coverImage}
                        onChange={(e) => setEditingProject({ ...editingProject, coverImage: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
                          uploading
                            ? 'bg-[#0a2618] border-[#10b981] text-[#10b981]'
                            : 'bg-[#092215] border-[#17462b] text-[#10b981] hover:bg-[#10b981] hover:text-[#022013]'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploading
                            ? 'Optimizing WebP & Uploading...'
                            : editingProject.coverImage
                            ? 'Replace Artwork'
                            : 'Upload Artwork'}
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleImageFileChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>

                      {editingProject.coverImage && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewModalImage({
                              url: editingProject.coverImage,
                              title: editingProject.titleEn || 'Cover Artwork Preview',
                              subtitle: `Thumbnail Ratio: ${(editingProject.thumbnailAspectRatio || 'square').toUpperCase()}`,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#07190f] border border-[#163e27] text-xs font-mono text-[#a8d3b8] hover:bg-[#10b981] hover:text-[#022013] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      )}

                      {editingProject.coverImage && (
                        <button
                          type="button"
                          onClick={handleRemoveCoverImage}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c0c0c] border border-[#3d1818] text-xs font-mono text-[#ff8e8e] hover:bg-[#ff3b3b] hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-[#698875] font-mono leading-relaxed bg-[#020b05] p-2.5 rounded-xl border border-[#0f2e1a]">
                      <div className="text-[#8ba394] font-semibold mb-0.5">✦ Optimization Engine:</div>
                      <div>• Destination: <span className="text-[#a3c2af]">portfolio-images/projects/</span></div>
                      <div>• Output format: <span className="text-[#a3c2af]">WebP (~0.85 quality)</span></div>
                      <div>• Non-destructive center-crop automatically maintains selected ratio.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AREA 2: CAROUSEL THUMBNAIL / SELECTED WORK VISUAL (DEDICATED 16:9) */}
              <div id="area-carousel-thumbnail" className="rounded-2xl bg-[#030e07] border-2 border-[#163e27] p-5 sm:p-6 space-y-4 shadow-lg scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#112d1c]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-[#10b981] text-[#022013] font-mono text-[10px] font-extrabold uppercase">
                        Area 2 of 3
                      </span>
                      <span className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#10b981]" />
                        Carousel Thumbnail / Selected Work Visual (16:9)
                      </span>
                    </div>
                    <p className="text-xs text-[#8ba394] font-mono">
                      Dedicated widescreen visual exclusively for the Selected Work homepage carousel. If unassigned, automatically falls back to Project Cover.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-md bg-[#05180f] border border-[#163f27] text-xs font-mono text-[#10b981] font-semibold self-start sm:self-auto">
                    Dedicated 16:9 Landscape (1600×900)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* 16:9 Preview Frame with Click-to-Zoom */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center">
                    <div
                      onClick={() => {
                        const targetUrl = editingProject.carouselImage || editingProject.coverImage;
                        if (targetUrl) {
                          setPreviewModalImage({
                            url: targetUrl,
                            title: `${editingProject.titleEn || 'Project'} — 16:9 Carousel Visual`,
                            subtitle: editingProject.carouselImage
                              ? 'Dedicated 16:9 Carousel Thumbnail'
                              : 'Project Cover Image (Active Fallback)',
                          });
                        }
                      }}
                      className={`w-full max-w-[280px] rounded-xl overflow-hidden bg-[#020a05] border-2 border-dashed border-[#17462b] relative group flex items-center justify-center shadow-inner aspect-[16/9] ${
                        editingProject.carouselImage || editingProject.coverImage
                          ? 'cursor-pointer hover:border-[#10b981]'
                          : ''
                      }`}
                    >
                      {editingProject.carouselImage ? (
                        <>
                          <img
                            src={editingProject.carouselImage}
                            alt="Carousel thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/20 text-xs font-mono text-white">
                              <Maximize2 className="w-3 h-3 text-[#10b981]" />
                              Click to Zoom
                            </span>
                          </div>
                        </>
                      ) : editingProject.coverImage ? (
                        <div className="relative w-full h-full">
                          <img
                            src={editingProject.coverImage}
                            alt="Cover fallback preview"
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-3 text-center">
                            <span className="text-xs font-mono font-semibold text-[#a8d3b8]">Cover Image Fallback</span>
                            <span className="text-[10px] font-mono text-[#6a8b76] mt-0.5">No dedicated carousel image</span>
                            <span className="text-[9px] font-mono text-[#10b981] mt-1 flex items-center gap-1">
                              <Maximize2 className="w-2.5 h-2.5" /> Click to Zoom
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#557361]">
                          <ImageIcon className="w-8 h-8 mb-1.5 opacity-50 text-[#8ba394]" />
                          <span className="text-xs font-mono text-[#8ba394]">No carousel visual</span>
                        </div>
                      )}

                      {editingProject.carouselImage && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#10b981] text-[#022013] text-[10px] font-mono font-bold">
                          Custom 16:9
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload and Controls */}
                  <div className="md:col-span-7 space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-mono text-[#8ba394] mb-1">
                        Direct Carousel Image CDN URL
                      </label>
                      <input
                        type="text"
                        value={editingProject.carouselImage || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, carouselImage: e.target.value })}
                        placeholder="https://... (Leave empty to use Project Cover)"
                        className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
                          uploadingCarousel
                            ? 'bg-[#0a2618] border-[#10b981] text-[#10b981]'
                            : 'bg-[#092215] border-[#17462b] text-[#10b981] hover:bg-[#10b981] hover:text-[#022013]'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingCarousel
                            ? 'Optimizing 16:9 WebP & Uploading...'
                            : editingProject.carouselImage
                            ? 'Replace Carousel Visual'
                            : 'Upload 16:9 Carousel Visual'}
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleCarouselImageChange}
                          className="hidden"
                          disabled={uploadingCarousel}
                        />
                      </label>

                      {(editingProject.carouselImage || editingProject.coverImage) && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetUrl = editingProject.carouselImage || editingProject.coverImage;
                            if (targetUrl) {
                              setPreviewModalImage({
                                url: targetUrl,
                                title: `${editingProject.titleEn || 'Project'} — Carousel Visual`,
                                subtitle: editingProject.carouselImage
                                  ? 'Custom 16:9 Carousel Thumbnail'
                                  : 'Cover Fallback Visual',
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#07190f] border border-[#163e27] text-xs font-mono text-[#a8d3b8] hover:bg-[#10b981] hover:text-[#022013] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      )}

                      {editingProject.carouselImage && (
                        <button
                          type="button"
                          onClick={handleRemoveCarouselImage}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c0c0c] border border-[#3d1818] text-xs font-mono text-[#ff8e8e] hover:bg-[#ff3b3b] hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear (Use Cover)</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-[#698875] font-mono leading-relaxed bg-[#020b05] p-2.5 rounded-xl border border-[#0f2e1a]">
                      <div className="text-[#8ba394] font-semibold mb-0.5">✦ Carousel Engine:</div>
                      <div>• Destination: <span className="text-[#a3c2af]">portfolio-images/carousel/</span></div>
                      <div>• Output format: <span className="text-[#a3c2af]">16:9 WebP (~0.86 quality, max 1600×900)</span></div>
                      <div>• Safe fallback: If not set, carousel seamlessly displays the project cover.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AREA 3: PROJECT DETAIL GALLERY / DESIGN SHOWCASE */}
              <div id="area-gallery-showcase" className="rounded-2xl bg-[#030e07] border-2 border-[#163e27] p-5 sm:p-6 space-y-4 shadow-lg scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#112d1c]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-[#10b981] text-[#022013] font-mono text-[10px] font-extrabold uppercase">
                        Area 3 of 3
                      </span>
                      <span className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#10b981]" />
                        Project Detail Gallery / Design Showcase
                      </span>
                    </div>
                    <p className="text-xs text-[#8ba394] font-mono">
                      Multi-image case study showcase (1:1, 4:5, 9:16, 16:9). Drag to reorder, add captions, and set SEO alt text.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#05180f] border border-[#163f27] text-[11px] font-mono text-[#a3c2af]">
                      {(editingProject.galleryImages || []).length} Artifacts
                    </span>

                    {/* Direct Image URL input + Add button */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={galleryUrlInput}
                        onChange={(e) => setGalleryUrlInput(e.target.value)}
                        placeholder="Paste image CDN URL..."
                        className="px-2.5 py-1.5 rounded-lg bg-[#020a05] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981] w-36 sm:w-48 font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGalleryByUrl();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddGalleryByUrl}
                        disabled={!galleryUrlInput.trim()}
                        className="px-2.5 py-1.5 rounded-lg bg-[#07190f] border border-[#163e27] text-xs font-mono text-[#a8d3b8] hover:bg-[#10b981] hover:text-[#022013] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>

                    <label
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        uploadingGallery
                          ? 'bg-[#0a2618] border-[#10b981] text-[#10b981]'
                          : 'bg-[#10b981] hover:bg-[#05df72] text-[#022013] border-[#10b981]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{uploadingGallery ? 'Uploading...' : 'Upload Images'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleGalleryFilesChange}
                        className="hidden"
                        disabled={uploadingGallery}
                      />
                    </label>
                  </div>
                </div>

                {/* Gallery Items List */}
                {(!editingProject.galleryImages || editingProject.galleryImages.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-[#17462b] bg-[#020a05] p-8 text-center">
                    <Layers className="w-8 h-8 mx-auto text-[#557361] mb-2 opacity-60" />
                    <p className="text-xs font-mono text-[#8ba394] mb-1">
                      No gallery designs uploaded yet.
                    </p>
                    <p className="text-[11px] font-mono text-[#557361]">
                      Click "Upload Images" or paste a CDN URL above to add case study artifacts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                    {editingProject.galleryImages.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 sm:p-4 rounded-xl bg-[#040e08] border transition-all ${
                          draggedGalleryIndex === idx
                            ? 'border-[#10b981] bg-[#071d11] opacity-60'
                            : 'border-[#143322] hover:border-[#19452b]'
                        } flex flex-col gap-3 group`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Left: Drag Handle, Order, and Click-to-Preview Thumbnail */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#0a2416] text-[#4d6b59] hover:text-[#10b981] transition-colors"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <span className="w-6 text-center font-mono text-xs font-bold text-[#10b981]">
                              #{idx + 1}
                            </span>

                            <div
                              onClick={() =>
                                setPreviewModalImage({
                                  url: item.url,
                                  title: `Gallery Artifact #${idx + 1}`,
                                  subtitle: item.captionEn || item.altTextEn || editingProject.titleEn,
                                })
                              }
                              className="w-16 h-16 rounded-lg overflow-hidden bg-[#020704] border border-[#17462b] hover:border-[#10b981] flex items-center justify-center shrink-0 cursor-pointer relative group/thumb transition-colors shadow-inner"
                              title="Click to preview full size"
                            >
                              <img
                                src={item.url}
                                alt={item.altTextEn || 'Gallery preview'}
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>

                            <div className="text-[11px] font-mono text-[#698875] truncate max-w-[120px] hidden sm:block">
                              <span className="block text-[#a8d3b8] font-medium">Artifact #{idx + 1}</span>
                              <span className="truncate block opacity-70">
                                {item.url.substring(item.url.lastIndexOf('/') + 1)}
                              </span>
                            </div>
                          </div>

                          {/* Right Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModalImage({
                                  url: item.url,
                                  title: `Gallery Artifact #${idx + 1}`,
                                  subtitle: item.captionEn || item.altTextEn || editingProject.titleEn,
                                })
                              }
                              title="Preview Fullscreen"
                              className="p-1.5 rounded-lg bg-[#07190f] border border-[#163e27] text-[#8ba394] hover:text-[#10b981] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveGalleryImage(idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                              className="p-1.5 rounded-lg bg-[#07190f] border border-[#163e27] text-[#8ba394] hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveGalleryImage(idx, 'down')}
                              disabled={idx === (editingProject.galleryImages?.length || 0) - 1}
                              title="Move Down"
                              className="p-1.5 rounded-lg bg-[#07190f] border border-[#163e27] text-[#8ba394] hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <label
                              title="Replace Image"
                              className="p-1.5 rounded-lg bg-[#07190f] border border-[#163e27] text-[#10b981] hover:bg-[#10b981] hover:text-[#022013] cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={(e) => handleReplaceGalleryImage(idx, e)}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              title="Remove Image"
                              className="p-1.5 rounded-lg bg-[#1c0c0c] border border-[#3d1818] text-[#ff8e8e] hover:bg-[#ff3b3b] hover:text-white cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Captions and Alt Text Grid */}
                        <div className="space-y-2 pt-2 border-t border-[#0e2719]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono text-[#698875] mb-0.5">Caption (English)</label>
                              <input
                                type="text"
                                value={item.captionEn || ''}
                                onChange={(e) => handleUpdateGalleryCaption(idx, 'en', e.target.value)}
                                placeholder="Caption displayed below artifact..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#020a05] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-[#698875] mb-0.5">Caption (বাংলা)</label>
                              <input
                                type="text"
                                value={item.captionBn || ''}
                                onChange={(e) => handleUpdateGalleryCaption(idx, 'bn', e.target.value)}
                                placeholder="বাংলা ক্যাপশন..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#020a05] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981] font-bangla"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono text-[#698875] mb-0.5">Alt Text / SEO (English)</label>
                              <input
                                type="text"
                                value={item.altTextEn || ''}
                                onChange={(e) => handleUpdateGalleryAltText(idx, 'en', e.target.value)}
                                placeholder="Descriptive alt text for accessibility & Google..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#020a05] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-[#698875] mb-0.5">Alt Text / SEO (বাংলা)</label>
                              <input
                                type="text"
                                value={item.altTextBn || ''}
                                onChange={(e) => handleUpdateGalleryAltText(idx, 'bn', e.target.value)}
                                placeholder="বাংলা অল্ট টেক্সট..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#020a05] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981] font-bangla"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Short Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Short Description (English)</label>
                  <textarea
                    rows={2}
                    value={editingProject.shortDescriptionEn}
                    onChange={(e) => setEditingProject({ ...editingProject, shortDescriptionEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Short Description (Bangla)</label>
                  <textarea
                    rows={2}
                    value={editingProject.shortDescriptionBn}
                    onChange={(e) => setEditingProject({ ...editingProject, shortDescriptionBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
                  />
                </div>
              </div>

              {/* Overview & Concept */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Overview (English)</label>
                  <textarea
                    rows={3}
                    value={editingProject.overviewEn}
                    onChange={(e) => setEditingProject({ ...editingProject, overviewEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Overview (Bangla)</label>
                  <textarea
                    rows={3}
                    value={editingProject.overviewBn}
                    onChange={(e) => setEditingProject({ ...editingProject, overviewBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Creative Concept (English)</label>
                  <textarea
                    rows={2}
                    value={editingProject.conceptEn}
                    onChange={(e) => setEditingProject({ ...editingProject, conceptEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Creative Concept (Bangla)</label>
                  <textarea
                    rows={2}
                    value={editingProject.conceptBn}
                    onChange={(e) => setEditingProject({ ...editingProject, conceptBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#12281a]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                  <input
                    type="checkbox"
                    checked={editingProject.published}
                    onChange={(e) => setEditingProject({ ...editingProject, published: e.target.checked })}
                    className="accent-[#10b981] w-4 h-4 rounded"
                  />
                  <span>Published on Public Site</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                  <input
                    type="checkbox"
                    checked={editingProject.featured}
                    onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                    className="accent-[#10b981] w-4 h-4 rounded"
                  />
                  <span>Featured in Spotlight Carousel</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                  <input
                    type="checkbox"
                    checked={editingProject.heroFeatured}
                    onChange={(e) => setEditingProject({ ...editingProject, heroFeatured: e.target.checked })}
                    className="accent-[#10b981] w-4 h-4 rounded"
                  />
                  <span>Hero Showcase Visual</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#12281a]">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#8ba394] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4">Visual & Ratio</th>
                <th className="p-4">Project Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Year</th>
                <th className="p-4 text-center">Hero</th>
                <th className="p-4 text-center">Featured</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#102418]">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-[#081a10] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={() => {
                          if (p.coverImage) {
                            setPreviewModalImage({
                              url: p.coverImage,
                              title: p.titleEn,
                              subtitle: `Cover Artwork (${p.thumbnailAspectRatio || 'square'})`,
                            });
                          }
                        }}
                        className={`w-12 h-12 rounded-lg overflow-hidden bg-[#040e08] border border-[#173a25] flex-shrink-0 relative group ${
                          p.coverImage ? 'cursor-pointer hover:border-[#10b981]' : ''
                        }`}
                        title={p.coverImage ? 'Click to preview artwork' : 'No artwork assigned'}
                      >
                        {p.coverImage ? (
                          <>
                            <img
                              src={p.coverImage}
                              alt={p.titleEn}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#405c4a]">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#092215] text-[#8ca495] border border-[#164329] self-start">
                          {p.thumbnailAspectRatio === 'portrait'
                            ? '4:5'
                            : p.thumbnailAspectRatio === 'landscape'
                            ? '16:9'
                            : '1:1'}
                        </span>
                        {p.carouselImage && (
                          <span
                            onClick={() =>
                              setPreviewModalImage({
                                url: p.carouselImage!,
                                title: p.titleEn,
                                subtitle: 'Dedicated 16:9 Carousel Visual',
                              })
                            }
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#0b2818] text-[#10b981] border border-[#16472b] cursor-pointer hover:bg-[#10b981] hover:text-[#022013] transition-colors self-start"
                            title="Click to preview dedicated 16:9 carousel thumbnail"
                          >
                            16:9 Carousel
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-[#f0f6f2] block text-sm">
                      {p.titleEn}
                    </span>
                    <span className="text-[11px] text-[#698875] font-bangla block">
                      {p.titleBn}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[#8ca495]">
                    {p.category}
                  </td>
                  <td className="p-4 font-mono text-[#8ca495]">
                    {p.year}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSetHeroFeatured(p.id)}
                      title={p.heroFeatured ? 'Hero featured project' : 'Set as hero featured'}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        p.heroFeatured
                          ? 'bg-[#10b981] text-[#022013] border-[#10b981]'
                          : 'bg-[#040e08] text-[#557361] border-[#132c1e] hover:border-[#10b981]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(p)}
                      title={p.featured ? 'Featured in Carousel' : 'Not featured'}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        p.featured
                          ? 'bg-[#0b2818] text-[#10b981] border-[#1a4a2e]'
                          : 'bg-[#040e08] text-[#557361] border-[#132c1e]'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(p)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-colors ${
                        p.published
                          ? 'bg-[#0a2717] text-[#10b981] border border-[#16472b]'
                          : 'bg-[#1a1c1a] text-[#7d8c83] border border-[#272e29]'
                      }`}
                    >
                      {p.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white hover:bg-[#10b981]/20 transition-colors"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e] hover:bg-[#ff3b3b]/30 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL-SIZE IMAGE PREVIEW MODAL */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#040e08] border border-[#17462b] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#12301e] bg-[#020905]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {previewModalImage.title || 'Image Preview'}
                  </h4>
                  {previewModalImage.subtitle && (
                    <p className="text-[11px] font-mono text-[#8ba394]">
                      {previewModalImage.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#07190f] border border-[#163e27] text-[#8ba394] hover:text-[#10b981] transition-colors"
                  title="Open original in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="p-1.5 rounded-lg bg-[#140a0a] border border-[#301616] text-[#ff8e8e] hover:bg-[#ff3b3b] hover:text-white transition-colors cursor-pointer"
                  title="Close preview (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[#010603] min-h-[300px]">
              <img
                src={previewModalImage.url}
                alt={previewModalImage.title || 'Preview'}
                className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-lg border border-[#143222]"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-[#020905] border-t border-[#12301e] flex items-center justify-between text-[11px] font-mono text-[#698875]">
              <span className="truncate max-w-md">{previewModalImage.url}</span>
              <span>Press ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
