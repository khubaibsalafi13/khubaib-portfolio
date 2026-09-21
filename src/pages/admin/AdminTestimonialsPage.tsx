import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star, Upload, Image as ImageIcon } from 'lucide-react';
import { testimonialService } from '../../services/testimonialService';
import { imageService } from '../../services/imageService';
import { Testimonial } from '../../types';

export const AdminTestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => testimonialService.getAll());
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = async () => {
    try {
      const data = await testimonialService.getAllAsync();
      setTestimonials(data);
    } catch {
      setTestimonials(testimonialService.getAll());
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStartNew = () => {
    setIsNew(true);
    setEditing({
      id: '',
      clientName: '',
      company: '',
      role: '',
      reviewTextEn: '',
      reviewTextBn: '',
      rating: 5,
      avatarImage: '',
      serviceOrCategory: 'Brand Identity',
      date: new Date().toISOString().split('T')[0],
      sortOrder: testimonials.length + 1,
      published: true,
      featured: true,
      createdAt: new Date().toISOString(),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editing) return;
    setUploading(true);
    try {
      const url = await imageService.uploadImage(e.target.files[0], 'testimonials');
      setEditing((prev) => (prev ? { ...prev, avatarImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    if (!editing) return;
    setEditing({ ...editing, avatarImage: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.clientName.trim() || !editing.reviewTextEn.trim()) return;
    await testimonialService.save(editing);
    setEditing(null);
    setIsNew(false);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this testimonial?')) {
      await testimonialService.delete(id);
      await refresh();
    }
  };

  const handleTogglePublish = async (t: Testimonial) => {
    await testimonialService.save({ ...t, published: !t.published });
    await refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Client Testimonials Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage genuine client reviews, ratings, and avatars. When zero testimonials are published, the public section is hidden.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#06140d] border border-[#143a25] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#143322]">
            <h3 className="text-sm font-bold text-[#f0f6f2] font-mono">
              {isNew ? 'New Testimonial' : `Edit Testimonial: ${editing.clientName}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 text-[#8ba394] hover:text-white rounded-lg hover:bg-[#0d281a]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Client Photo / Avatar Upload Section */}
          <div className="p-4 rounded-xl bg-[#040e08] border border-[#143322] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="shrink-0 flex items-center justify-center">
              {editing.avatarImage ? (
                <div className="relative group">
                  <img
                    src={editing.avatarImage}
                    alt="Client Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#10b981] shadow-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Remove Photo"
                    className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full shadow cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#092215] border border-dashed border-[#1e4832] flex flex-col items-center justify-center text-[#8ba394]">
                  <ImageIcon className="w-5 h-5 opacity-60" />
                  <span className="text-[9px] font-mono mt-0.5">No Photo</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-xs font-mono font-semibold text-[#f0f6f2] mb-1">
                Client Photo / Avatar
              </label>
              <p className="text-[11px] text-[#8ba394] font-mono mb-2">
                Upload portrait photo (JPG, PNG, WebP). If omitted, an initial-based avatar fallback will display.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d2a1b] hover:bg-[#123824] border border-[#1e4832] text-xs font-mono text-[#a5c2b0] hover:text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>{uploading ? 'Uploading...' : editing.avatarImage ? 'Replace Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {editing.avatarImage && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-lg bg-[#221010] hover:bg-[#331818] border border-[#441f1f] text-xs font-mono text-[#f87171] cursor-pointer transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={editing.clientName}
                onChange={(e) => setEditing({ ...editing, clientName: e.target.value })}
                placeholder="e.g. Muhammad Fazal"
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Company / Organization</label>
              <input
                type="text"
                value={editing.company}
                onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                placeholder="e.g. Apex Visuals Ltd."
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Role / Designation</label>
              <input
                type="text"
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                placeholder="e.g. Creative Director"
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Rating</label>
              <select
                value={editing.rating || 5}
                onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                <option value={3}>⭐⭐⭐ (3 Stars)</option>
                <option value={2}>⭐⭐ (2 Stars)</option>
                <option value={1}>⭐ (1 Star)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Service / Category</label>
              <input
                type="text"
                value={editing.serviceOrCategory || ''}
                onChange={(e) => setEditing({ ...editing, serviceOrCategory: e.target.value })}
                placeholder="e.g. Brand Identity"
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Review Date</label>
              <input
                type="date"
                value={editing.date || ''}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Sort Order</label>
              <input
                type="number"
                value={editing.sortOrder ?? 1}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Review Text (English) *</label>
              <textarea
                rows={3}
                required
                value={editing.reviewTextEn}
                onChange={(e) => setEditing({ ...editing, reviewTextEn: e.target.value })}
                placeholder="Enter client review in English..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Review Text (Bangla)</label>
              <textarea
                rows={3}
                value={editing.reviewTextBn}
                onChange={(e) => setEditing({ ...editing, reviewTextBn: e.target.value })}
                placeholder="বাংলায় রিভিউ লিখুন..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla focus:border-[#10b981]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  className="accent-[#10b981] w-4 h-4 rounded cursor-pointer"
                />
                <span>Published on Website</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="accent-[#10b981] w-4 h-4 rounded cursor-pointer"
                />
                <span>Featured</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs font-mono text-[#8ba394] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
              >
                Save Review
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase">
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Review Excerpt</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#102418]">
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#688574] font-mono">
                  No testimonials added yet. Click "Add Testimonial" above to create one.
                </td>
              </tr>
            ) : (
              testimonials.map((t) => (
                <tr key={t.id} className="hover:bg-[#081a10]">
                  <td className="p-4 font-bold text-[#f0f6f2]">
                    <div className="flex items-center gap-3">
                      {t.avatarImage ? (
                        <img
                          src={t.avatarImage}
                          alt={t.clientName}
                          className="w-8 h-8 rounded-full object-cover border border-[#143322]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0d2a1b] border border-[#194b30] flex items-center justify-center text-xs font-bold text-[#10b981] font-mono">
                          {t.clientName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span>{t.clientName}</span>
                        <span className="text-[11px] text-[#638470] block font-normal mt-0.5">
                          {[t.role, t.company].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#FFC83D] font-mono">
                    {'★'.repeat(t.rating || 5)}
                  </td>
                  <td className="p-4 text-[#8ea899] max-w-sm truncate italic">
                    "{t.reviewTextEn}"
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(t)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono cursor-pointer transition-colors ${
                        t.published
                          ? 'bg-[#0a2717] text-[#10b981] border border-[#16472b]'
                          : 'bg-[#1a1c1a] text-[#7d8c83] border border-[#272e29]'
                      }`}
                    >
                      {t.published ? 'Published' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setIsNew(false); setEditing({ ...t }); }}
                        className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e] hover:bg-[#331515] cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

