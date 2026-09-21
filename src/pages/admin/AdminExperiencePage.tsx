import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { experienceService } from '../../services/experienceService';
import { Experience } from '../../types';

export const AdminExperiencePage: React.FC = () => {
  const [experience, setExperience] = useState<Experience[]>(() => experienceService.getAll());
  const [editing, setEditing] = useState<Experience | null>(null);
  const [isNew, setIsNew] = useState(false);

  const refresh = async () => {
    try {
      const data = await experienceService.getAllAsync();
      setExperience(data);
    } catch {
      setExperience(experienceService.getAll());
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStartNew = () => {
    setIsNew(true);
    setEditing({
      id: '',
      company: '',
      roleEn: '',
      roleBn: '',
      period: '2025 - Present',
      responsibilitiesEn: [''],
      responsibilitiesBn: [''],
      sortOrder: experience.length + 1,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.company.trim()) return;
    await experienceService.save(editing);
    setEditing(null);
    setIsNew(false);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this experience entry?')) {
      await experienceService.delete(id);
      await refresh();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Experience & Career
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage work history and professional responsibilities.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#06140d] border border-[#143a25] space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6f2] font-mono">
            {isNew ? 'New Experience' : `Edit: ${editing.company}`}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Company *</label>
              <input
                type="text"
                required
                value={editing.company}
                onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Role (English)</label>
              <input
                type="text"
                value={editing.roleEn}
                onChange={(e) => setEditing({ ...editing, roleEn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Period (e.g. 2023 - 2025)</label>
              <input
                type="text"
                value={editing.period}
                onChange={(e) => setEditing({ ...editing, period: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8ba394] mb-1">
              Key Responsibilities (One per line)
            </label>
            <textarea
              rows={4}
              value={editing.responsibilitiesEn.join('\n')}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  responsibilitiesEn: e.target.value.split('\n').filter((l) => l.trim()),
                })
              }
              placeholder="Created over 100 graphics..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
            />
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
              Save Experience
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase">
            <tr>
              <th className="p-4">Company</th>
              <th className="p-4">Role</th>
              <th className="p-4">Period</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#102418]">
            {experience.map((e) => (
              <tr key={e.id} className="hover:bg-[#081a10]">
                <td className="p-4 font-bold text-[#f0f6f2]">{e.company}</td>
                <td className="p-4 text-[#8ea899]">{e.roleEn || '—'}</td>
                <td className="p-4 font-mono text-[#10b981]">{e.period}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setIsNew(false); setEditing({ ...e }); }}
                      className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
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
