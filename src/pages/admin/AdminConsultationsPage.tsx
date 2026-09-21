import React, { useState, useEffect } from 'react';
import { Mail, Calendar, DollarSign, Clock, Trash2, CheckCircle, Eye, X } from 'lucide-react';
import { consultationService } from '../../services/consultationService';
import { ConsultationRequest, ConsultationStatus } from '../../types';

export const AdminConsultationsPage: React.FC = () => {
  const [consultations, setConsultations] = useState<ConsultationRequest[]>(() =>
    consultationService.getAll()
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<ConsultationRequest | null>(null);

  const refresh = async () => {
    try {
      const data = await consultationService.getAllAsync();
      setConsultations(data);
    } catch {
      setConsultations(consultationService.getAll());
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = consultations.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const handleStatusChange = async (id: string, newStatus: ConsultationStatus) => {
    await consultationService.updateStatus(id, newStatus);
    await refresh();
    if (activeItem?.id === id) {
      setActiveItem({ ...activeItem, status: newStatus });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this consultation inquiry permanently?')) {
      await consultationService.delete(id);
      await refresh();
      if (activeItem?.id === id) {
        setActiveItem(null);
      }
    }
  };

  const statuses: ConsultationStatus[] = ['New', 'Reviewed', 'Contacted', 'Completed', 'Archived'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Consultation Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Client messages submitted via the public consultation request form.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#10b981] text-[#022013] font-bold'
                : 'bg-[#06140d] border border-[#143322] text-[#8ea899] hover:text-white'
            }`}
          >
            All ({consultations.length})
          </button>
          {statuses.map((st) => {
            const count = consultations.filter((c) => c.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  filterStatus === st
                    ? 'bg-[#10b981] text-[#022013] font-bold'
                    : 'bg-[#06140d] border border-[#143322] text-[#8ea899] hover:text-white'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#05140d] border border-[#143a25] rounded-2xl shadow-2xl p-6 sm:p-8 relative">
            <div className="flex items-start justify-between pb-4 mb-6 border-b border-[#112a1c]">
              <div>
                <span className="text-xs font-mono text-[#10b981] uppercase tracking-wider block mb-1">
                  Inquiry Details
                </span>
                <h2 className="text-xl font-bold text-[#f0f6f2]">{activeItem.fullName}</h2>
                <a
                  href={`mailto:${activeItem.email}`}
                  className="text-xs text-[#7d9a88] hover:text-[#10b981] transition-colors"
                >
                  {activeItem.email}
                </a>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1.5 text-[#7b9887] hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#040e08] border border-[#132c1e]">
                <span className="text-[#557361] block mb-1">Service Needed</span>
                <span className="text-[#f0f6f2] font-semibold">{activeItem.service}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#040e08] border border-[#132c1e]">
                <span className="text-[#557361] block mb-1">Company / Brand</span>
                <span className="text-[#f0f6f2] font-semibold">{activeItem.company || 'Individual'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#040e08] border border-[#132c1e]">
                <span className="text-[#557361] block mb-1">Budget</span>
                <span className="text-[#10b981] font-semibold">{activeItem.budget || 'Not specified'}</span>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-xs font-mono text-[#8ba394] uppercase tracking-wider block mb-2">
                Project Scope / Message:
              </span>
              <div className="p-4 rounded-xl bg-[#040e08] border border-[#132c1e] text-sm text-[#d4e4dc] leading-relaxed whitespace-pre-wrap">
                {activeItem.message}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#112a1c]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#8ba394]">Status:</span>
                <select
                  value={activeItem.status}
                  onChange={(e) =>
                    handleStatusChange(activeItem.id, e.target.value as ConsultationStatus)
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`mailto:${activeItem.email}?subject=Regarding your inquiry for ${activeItem.service}`}
                  className="px-4 py-2 rounded-xl bg-[#10b981] text-[#022013] font-bold text-xs uppercase tracking-wider hover:bg-[#05df72] transition-colors"
                >
                  Reply via Email
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(activeItem.id)}
                  className="p-2 text-[#ff8e8e] hover:bg-[#2d0f0f] rounded-lg transition-colors"
                  title="Delete Inquiry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiries Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#06140d] border border-[#143222] text-xs font-mono text-[#668372]">
          No consultation inquiries matching current filter.
        </div>
      ) : (
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase">
              <tr>
                <th className="p-4">Sender</th>
                <th className="p-4">Service</th>
                <th className="p-4">Budget / Timeline</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#102418]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#081a10]">
                  <td className="p-4">
                    <span className="font-bold text-[#f0f6f2] block">{c.fullName}</span>
                    <span className="text-[11px] text-[#7d9a88] block">{c.email}</span>
                  </td>
                  <td className="p-4 text-[#d1e3d8] font-mono">{c.service}</td>
                  <td className="p-4 text-[#8ea899] font-mono">
                    {[c.budget, c.timeline].filter(Boolean).join(' • ') || '—'}
                  </td>
                  <td className="p-4 text-[#658471] font-mono">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${
                        c.status === 'New'
                          ? 'bg-[#10b981] text-[#022013] font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-[#0a2014] text-[#8ba395] border border-[#143823]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveItem(c)}
                        className="p-1.5 rounded-lg bg-[#081f13] text-[#10b981] hover:text-white"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e]"
                        title="Delete Inquiry"
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
      )}
    </div>
  );
};
