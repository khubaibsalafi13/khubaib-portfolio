import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { clientLogoService } from '../../services/clientLogoService';
import { imageService } from '../../services/imageService';
import { ClientLogo } from '../../types';

export const AdminClientLogosPage: React.FC = () => {
  const [logos, setLogos] = useState<ClientLogo[]>(() => clientLogoService.getAll());
  const [editing, setEditing] = useState<ClientLogo | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = () => setLogos(clientLogoService.getAll());

  const handleStartNew = () => {
    setIsNew(true);
    setEditing({
      id: '',
      companyName: '',
      logoImage: imageService.getPresetSample('client-logo'),
      websiteUrl: '',
      altTextEn: '',
      altTextBn: '',
      sortOrder: logos.length + 1,
      published: true,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.companyName.trim()) return;
    clientLogoService.save(editing);
    setEditing(null);
    setIsNew(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this client logo?')) {
      clientLogoService.delete(id);
      refresh();
    }
  };

  const handleTogglePublish = (item: ClientLogo) => {
    clientLogoService.save({ ...item, published: !item.published });
    refresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editing) return;
    setUploading(true);
    try {
      const url = await imageService.uploadImage(e.target.files[0], 'client-logos');
      setEditing((prev) => (prev ? { ...prev, logoImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Client Logos Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage partner & client brand marks. If all logos are unpublished, the public marquee cleanly hides.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client Logo</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#06140d] border border-[#143a25] space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6f2] font-mono">
            {isNew ? 'New Client Logo' : `Edit: ${editing.companyName}`}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Company / Brand Name *</label>
              <input
                type="text"
                required
                value={editing.companyName}
                onChange={(e) => setEditing({ ...editing, companyName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Website URL (Optional)</label>
              <input
                type="url"
                value={editing.websiteUrl}
                onChange={(e) => setEditing({ ...editing, websiteUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8ba394] mb-1">Logo Image URL / Upload</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-14 rounded-lg bg-[#040e08] border border-[#143322] p-2 flex items-center justify-center">
                <img
                  src={editing.logoImage}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editing.logoImage}
                  onChange={(e) => setEditing({ ...editing, logoImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#092215] border border-[#17462b] text-xs font-mono text-[#10b981] hover:bg-[#10b981] hover:text-[#022013] transition-colors cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Processing...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
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
              <span>Active in Public Marquee</span>
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
                Save Logo
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className="p-4 rounded-xl bg-[#06140d] border border-[#143222] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-10 rounded-lg bg-[#040e08] border border-[#132d1e] p-1.5 flex items-center justify-center shrink-0">
                <img
                  src={logo.logoImage}
                  alt={logo.companyName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-[#f0f6f2] block truncate">
                  {logo.companyName}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    logo.published
                      ? 'bg-[#0a2717] text-[#10b981] border border-[#154429]'
                      : 'bg-[#1b1e1c] text-[#7d8c83]'
                  }`}
                >
                  {logo.published ? 'Live' : 'Hidden'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleTogglePublish(logo)}
                className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                title="Toggle publish"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(logo.id)}
                className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e]"
                title="Delete logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
