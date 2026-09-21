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
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { categoryService } from '../../services/categoryService';
import { imageService } from '../../services/imageService';
import { Project, ProjectImage, Category } from '../../types';

export const AdminPortfolioPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => projectService.getAll());
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setIsCreating(true);
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
      roleEn: 'Graphic Designer',
      roleBn: 'গ্রাফিক ডিজাইনার',
      client: '',
      year: new Date().getFullYear().toString(),
      category: categories[0]?.nameEn || 'Brand Identity',
      coverImage: imageService.getPresetSample('branding'),
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
    setEditingProject({ ...proj });
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
    setUploading(true);
    try {
      const url = await imageService.uploadImage(e.target.files[0], 'projects');
      setEditingProject((prev) => (prev ? { ...prev, coverImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
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
      setEditingProject(null);
      setIsCreating(false);
      await refresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Portfolio Project Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Create, edit, reorder, and publish portfolio showcase projects.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Editor Modal / Drawer */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#05140d] border border-[#143a25] rounded-2xl shadow-2xl overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#112a1c]">
              <h2 className="text-xl font-bold text-[#f0f6f2]">
                {isCreating ? 'Create New Project' : `Edit: ${editingProject.titleEn}`}
              </h2>
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
                    className="w-full px-3 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                  >
                    {categories.map((c) => (
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

              {/* Cover Image URL & File Upload */}
              <div>
                <label className="block text-xs font-mono text-[#8ba394] mb-2">
                  Cover Image
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <img
                    src={editingProject.coverImage}
                    alt="Cover preview"
                    className="w-24 h-16 rounded-lg object-cover bg-[#040e08] border border-[#173a25]"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={editingProject.coverImage}
                      onChange={(e) => setEditingProject({ ...editingProject, coverImage: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#092215] border border-[#17462b] text-xs font-mono text-[#10b981] hover:bg-[#10b981] hover:text-[#022013] transition-colors cursor-pointer">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{uploading ? 'Processing...' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Project</span>
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
                <th className="p-4">Visual</th>
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
                    <img
                      src={p.coverImage}
                      alt={p.titleEn}
                      className="w-14 h-10 rounded-lg object-cover bg-[#040e08] border border-[#173a25]"
                    />
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
