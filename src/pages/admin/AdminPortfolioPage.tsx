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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replacedCoverImageUrl, setReplacedCoverImageUrl] = useState<string>('');

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
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#112a1c]">
              <div>
                <h2 className="text-xl font-bold text-[#f0f6f2]">
                  {isCreating ? 'Create New Project' : `Edit: ${editingProject.titleEn}`}
                </h2>
                <p className="text-xs font-mono text-[#8ba394] mt-0.5">
                  Set details, category, cover artwork, and aspect ratio.
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

              {/* PROJECT THUMBNAIL / COVER SECTION */}
              <div className="rounded-2xl bg-[#030e07] border border-[#163e27] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#112d1c]">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#a8d3b8] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#10b981]" />
                      Project Thumbnail / Cover Artwork
                    </span>
                    <p className="text-[11px] text-[#6a8b76] font-mono mt-0.5">
                      Select aspect ratio and upload high-fidelity WebP artwork with automated cover-crop.
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
                    <div className="w-full max-w-[260px] rounded-xl overflow-hidden bg-[#020a05] border-2 border-dashed border-[#17462b] relative group flex items-center justify-center shadow-inner">
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
                          <img
                            src={editingProject.coverImage}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
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
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#040e08] border border-[#173a25] flex-shrink-0">
                        {p.coverImage ? (
                          <img
                            src={p.coverImage}
                            alt={p.titleEn}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#405c4a]">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#092215] text-[#8ca495] border border-[#164329]">
                        {p.thumbnailAspectRatio === 'portrait'
                          ? '4:5'
                          : p.thumbnailAspectRatio === 'landscape'
                          ? '16:9'
                          : '1:1'}
                      </span>
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
    </div>
  );
};
