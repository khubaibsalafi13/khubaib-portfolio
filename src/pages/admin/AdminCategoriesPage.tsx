import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);

  const refresh = () => setCategories(categoryService.getAll());

  const handleStartNew = () => {
    setIsNew(true);
    setEditing({
      id: '',
      slug: '',
      nameEn: '',
      nameBn: '',
      sortOrder: categories.length + 1,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.nameEn.trim()) return;
    categoryService.save(editing);
    setEditing(null);
    setIsNew(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this design category?')) {
      categoryService.delete(id);
      refresh();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Design Categories
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage portfolio filtering tags and taxonomy in English and Bangla.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#06140d] border border-[#143a25] space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6f2] font-mono">
            {isNew ? 'New Category' : 'Edit Category'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Name (English) *</label>
              <input
                type="text"
                required
                value={editing.nameEn}
                onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Name (Bangla)</label>
              <input
                type="text"
                value={editing.nameBn}
                onChange={(e) => setEditing({ ...editing, nameBn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
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
              Save Category
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase">
            <tr>
              <th className="p-4">Name (English)</th>
              <th className="p-4">Name (Bangla)</th>
              <th className="p-4">Slug</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#102418]">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-[#081a10]">
                <td className="p-4 font-bold text-[#f0f6f2]">{c.nameEn}</td>
                <td className="p-4 font-bangla text-[#8ea899]">{c.nameBn}</td>
                <td className="p-4 font-mono text-[#5f7d6c]">{c.slug}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setIsNew(false); setEditing({ ...c }); }}
                      className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
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
