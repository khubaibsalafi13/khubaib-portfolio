import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import { servicesService } from '../../services/servicesService';
import { ServiceItem } from '../../types';

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(() => servicesService.getAll());
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  const refresh = () => setServices(servicesService.getAll());

  const handleStartNew = () => {
    setIsNew(true);
    setEditing({
      id: '',
      slug: '',
      titleEn: '',
      titleBn: '',
      descriptionEn: '',
      descriptionBn: '',
      sortOrder: services.length + 1,
      published: true,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.titleEn.trim()) return;
    servicesService.save(editing);
    setEditing(null);
    setIsNew(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this service offering?')) {
      servicesService.delete(id);
      refresh();
    }
  };

  const handleTogglePublish = (srv: ServiceItem) => {
    servicesService.save({ ...srv, published: !srv.published });
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Services & Specialties
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage your design offerings shown in the Services section.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#06140d] border border-[#143a25] space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6f2] font-mono">
            {isNew ? 'New Service' : 'Edit Service'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Title (English) *</label>
              <input
                type="text"
                required
                value={editing.titleEn}
                onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Title (Bangla)</label>
              <input
                type="text"
                value={editing.titleBn}
                onChange={(e) => setEditing({ ...editing, titleBn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Description (English)</label>
              <textarea
                rows={3}
                value={editing.descriptionEn}
                onChange={(e) => setEditing({ ...editing, descriptionEn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Description (Bangla)</label>
              <textarea
                rows={3}
                value={editing.descriptionBn}
                onChange={(e) => setEditing({ ...editing, descriptionBn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                className="accent-[#10b981] w-4 h-4 rounded"
              />
              <span>Published on Website</span>
            </label>

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
                Save Service
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase">
            <tr>
              <th className="p-4">Service Title</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#102418]">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-[#081a10]">
                <td className="p-4 font-bold text-[#f0f6f2] max-w-[200px]">
                  {s.titleEn}
                  <span className="text-[11px] text-[#638470] block font-bangla font-normal mt-0.5">
                    {s.titleBn}
                  </span>
                </td>
                <td className="p-4 text-[#8ea899] max-w-sm truncate">
                  {s.descriptionEn}
                </td>
                <td className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(s)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${
                      s.published
                        ? 'bg-[#0a2717] text-[#10b981] border border-[#16472b]'
                        : 'bg-[#1a1c1a] text-[#7d8c83] border border-[#272e29]'
                    }`}
                  >
                    {s.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setIsNew(false); setEditing({ ...s }); }}
                      className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
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
