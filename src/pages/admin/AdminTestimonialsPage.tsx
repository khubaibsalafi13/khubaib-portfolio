import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star, Eye } from 'lucide-react';
import { testimonialService } from '../../services/testimonialService';
import { Testimonial } from '../../types';

export const AdminTestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => testimonialService.getAll());
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [isNew, setIsNew] = useState(false);

  const refresh = () => setTestimonials(testimonialService.getAll());

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.clientName.trim() || !editing.reviewTextEn.trim()) return;
    testimonialService.save(editing);
    setEditing(null);
    setIsNew(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this testimonial?')) {
      testimonialService.delete(id);
      refresh();
    }
  };

  const handleTogglePublish = (t: Testimonial) => {
    testimonialService.save({ ...t, published: !t.published });
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Client Testimonials Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage genuine client reviews and ratings. When zero testimonials are published, the public section is hidden.
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
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#06140d] border border-[#143a25] space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6f2] font-mono">
            {isNew ? 'New Testimonial' : `Edit Testimonial: ${editing.clientName}`}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={editing.clientName}
                onChange={(e) => setEditing({ ...editing, clientName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Company / Organization</label>
              <input
                type="text"
                value={editing.company}
                onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Client Role / Position</label>
              <input
                type="text"
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Rating (1 to 5 Stars)</label>
              <select
                value={editing.rating || 5}
                onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                <option value={3}>⭐⭐⭐ (3 Stars)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Service Provided</label>
              <input
                type="text"
                value={editing.serviceOrCategory}
                onChange={(e) => setEditing({ ...editing, serviceOrCategory: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
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
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Review Text (Bangla)</label>
              <textarea
                rows={3}
                value={editing.reviewTextBn}
                onChange={(e) => setEditing({ ...editing, reviewTextBn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
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
                  className="accent-[#10b981] w-4 h-4 rounded"
                />
                <span>Published on Website</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="accent-[#10b981] w-4 h-4 rounded"
                />
                <span>Featured Badge</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs font-mono text-[#8ba394]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#10b981] text-[#022013] text-xs font-bold uppercase tracking-wider"
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
            {testimonials.map((t) => (
              <tr key={t.id} className="hover:bg-[#081a10]">
                <td className="p-4 font-bold text-[#f0f6f2]">
                  {t.clientName}
                  <span className="text-[11px] text-[#638470] block font-normal mt-0.5">
                    {[t.role, t.company].filter(Boolean).join(' • ')}
                  </span>
                </td>
                <td className="p-4 text-[#10b981] font-mono">
                  {'★'.repeat(t.rating || 5)}
                </td>
                <td className="p-4 text-[#8ea899] max-w-sm truncate italic">
                  "{t.reviewTextEn}"
                </td>
                <td className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(t)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${
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
                      className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e]"
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
  );
};
