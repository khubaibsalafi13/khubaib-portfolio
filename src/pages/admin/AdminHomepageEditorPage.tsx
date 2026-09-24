import React, { useState, useRef, useEffect } from 'react';
import { Save, Check, RefreshCw, Upload, Trash2, Image as ImageIcon, RotateCcw, AlertCircle } from 'lucide-react';
import { contentService } from '../../services/contentService';
import { imageService } from '../../services/imageService';
import { SiteContent } from '../../types';

export const AdminHomepageEditorPage: React.FC = () => {
  const [content, setContent] = useState<SiteContent>(() => contentService.getContent());
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [previousHeroImageUrl, setPreviousHeroImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const latest = await contentService.getContentAsync();
        if (isMounted && latest) {
          setContent(latest);
        }
      } catch (err) {
        console.warn('Failed to fetch site content from Supabase:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field: keyof SiteContent, value: string) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setUploadingImage(true);
    try {
      console.info('[Hero Upload] Starting upload for selected file:', file.name, 'size:', (file.size / 1024).toFixed(1) + 'KB');
      
      const url = await imageService.uploadHeroImage(file);
      
      // Strict verification: Reject any Base64 data URL
      if (!url || !url.startsWith('http') || url.startsWith('data:')) {
        throw new Error('Upload rejected: Result was not a valid Supabase Storage HTTPS URL.');
      }

      if (!previousHeroImageUrl && content.heroPersonalImage && content.heroPersonalImage.includes('/storage/v1/object/public/')) {
        setPreviousHeroImageUrl(content.heroPersonalImage);
      }

      console.info('[Hero Upload] Hero public URL generated successfully:', url);
      handleChange('heroPersonalImage', url);
    } catch (err: any) {
      console.error('[Hero Upload] Hero Storage upload failed:', err);
      setImageError(err.message || 'Failed to upload image to Supabase Storage. Current image was kept unchanged.');
      // Keep existing heroPersonalImage unchanged!
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Remove Hero personal portrait? (The Hero will display an architectural placeholder fallback)')) {
      if (!previousHeroImageUrl && content.heroPersonalImage && content.heroPersonalImage.includes('/storage/v1/object/public/')) {
        setPreviousHeroImageUrl(content.heroPersonalImage);
      }
      handleChange('heroPersonalImage', '');
    }
  };

  const handleRestoreStudioImage = () => {
    handleChange('heroPersonalImage', '/assets/khubaib_portrait.jpg');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError('');
    try {
      console.info('[Hero Save] Saving site content. heroPersonalImage:', content.heroPersonalImage);
      await contentService.updateContent(content);
      console.info('[Hero Save] Hero database save successful');

      // Only delete old Storage image after database update has succeeded
      if (previousHeroImageUrl && previousHeroImageUrl !== content.heroPersonalImage) {
        await imageService.deleteStorageFile(previousHeroImageUrl);
        setPreviousHeroImageUrl('');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('[Hero Save] Hero database save failed:', err);
      setImageError('Failed to save to Supabase database: ' + (err.message || String(err)));
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all homepage text back to original seed defaults?')) {
      const resetData = await contentService.resetToDefault();
      setContent(resetData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Homepage Content Editor
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Edit all public website headings, descriptions, and CTA labels in English and Bangla.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-[#091a10] border border-[#173a25] text-xs font-mono text-[#86a292] hover:text-white transition-colors"
          >
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Saved Successfully!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        
        {/* 01. Top Announcement Bar */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6">
          <h2 className="text-base font-bold text-[#10b981] mb-4 font-mono">
            01. TOP ANNOUNCEMENT BAR
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">English</label>
              <input
                type="text"
                value={content.announcementEn}
                onChange={(e) => handleChange('announcementEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] focus:border-[#10b981] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Bangla (বাংলা)</label>
              <input
                type="text"
                value={content.announcementBn}
                onChange={(e) => handleChange('announcementBn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] focus:border-[#10b981] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>
        </div>

        {/* 02. Hero Section */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-6">
          <h2 className="text-base font-bold text-[#10b981] font-mono uppercase tracking-wider">
            02. HERO SECTION & PERSONAL VISUAL
          </h2>

          {/* DEDICATED HERO PERSONAL IMAGE MANAGER */}
          <div className="p-5 rounded-xl bg-[#040e08] border border-[#163826] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#122b1c]">
              <div>
                <h3 className="text-sm font-bold text-[#f3f9f5] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#10b981]" />
                  <span>Hero Personal Portrait Image</span>
                </h3>
                <p className="text-xs text-[#7d9b89] mt-0.5">
                  Featured directly in the Hero showcase framing. Upload your custom photo or remove it to preview the fallback state.
                </p>
              </div>
              {content.heroPersonalImage ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[11px] font-mono self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Custom Photo Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/30 text-[11px] font-mono self-start sm:self-auto">
                  Fallback Placeholder Active
                </span>
              )}
            </div>

            {imageError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Preview Frame */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="relative w-full max-w-[240px] aspect-[3/3.8] rounded-xl overflow-hidden bg-[#06160e] border border-[#1b432c] shadow-lg flex flex-col justify-between p-2">
                  {content.heroPersonalImage ? (
                    <>
                      <img
                        src={content.heroPersonalImage}
                        alt="Hero Personal Portrait Preview"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="relative z-10 text-[9px] font-mono text-[#10b981] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 self-start">
                        HERO VISUAL
                      </div>
                      <div className="relative z-10 text-center text-[10px] text-white/90 font-mono pb-1 truncate px-1">
                        {content.heroPersonalImageTagEn || 'Khubaib Salafi'}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 rounded-xl bg-[#092215] border border-[#19402a] flex items-center justify-center text-[#10b981] mb-2 font-mono font-bold text-base">
                        KS
                      </div>
                      <p className="text-[11px] font-medium text-[#8ba394]">
                        Fallback Placeholder
                      </p>
                      <span className="text-[9px] text-[#557161] mt-1 font-mono">
                        No image uploaded
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#638170] mt-2 font-mono">Live Preview (Framed 3:4)</span>
              </div>

              {/* Controls */}
              <div className="md:col-span-8 space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? 'Uploading Image...' : content.heroPersonalImage ? 'Replace Portrait' : 'Upload Personal Portrait'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreStudioImage}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#091a10] border border-[#173a25] text-xs font-mono text-[#86a292] hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Default Studio Portrait</span>
                  </button>

                  {content.heroPersonalImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-950/30 border border-red-900/50 text-xs font-mono text-red-400 hover:bg-red-950/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove (Test Fallback)</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8ba394] mb-1">Direct Image URL / CDN Link</label>
                  <input
                    type="text"
                    placeholder="https://... or data:image/..."
                    value={content.heroPersonalImage || ''}
                    onChange={(e) => handleChange('heroPersonalImage', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#030b06] border border-[#143322] text-xs font-mono text-white outline-none focus:border-[#10b981]"
                  />
                  <p className="text-[10px] text-[#557262] mt-1 font-mono">
                    Supports direct file upload, local static paths, base64 strings, or HTTPS image links.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-mono text-[#8ba394] mb-1">Portrait Caption / Role (English)</label>
                    <input
                      type="text"
                      placeholder="Khubaib Salafi // Visual Designer"
                      value={content.heroPersonalImageTagEn || ''}
                      onChange={(e) => handleChange('heroPersonalImageTagEn', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#030b06] border border-[#143322] text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#8ba394] mb-1">Portrait Caption / Role (Bangla)</label>
                    <input
                      type="text"
                      placeholder="খুবাইব সালাফী // ভিজ্যুয়াল ডিজাইনার"
                      value={content.heroPersonalImageTagBn || ''}
                      onChange={(e) => handleChange('heroPersonalImageTagBn', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#030b06] border border-[#143322] text-xs text-white outline-none font-bangla"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Hero Eyebrow (English)</label>
              <input
                type="text"
                value={content.heroEyebrowEn}
                onChange={(e) => handleChange('heroEyebrowEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Hero Eyebrow (Bangla)</label>
              <input
                type="text"
                value={content.heroEyebrowBn}
                onChange={(e) => handleChange('heroEyebrowBn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Hero Title (English)</label>
              <input
                type="text"
                value={content.heroTitleEn}
                onChange={(e) => handleChange('heroTitleEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Hero Title (Bangla)</label>
              <input
                type="text"
                value={content.heroTitleBn}
                onChange={(e) => handleChange('heroTitleBn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Hero Description (English)</label>
              <textarea
                rows={3}
                value={content.heroDescriptionEn}
                onChange={(e) => handleChange('heroDescriptionEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Hero Description (Bangla)</label>
              <textarea
                rows={3}
                value={content.heroDescriptionBn}
                onChange={(e) => handleChange('heroDescriptionBn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Primary CTA (En)</label>
              <input
                type="text"
                value={content.primaryCtaEn}
                onChange={(e) => handleChange('primaryCtaEn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Primary CTA (Bn)</label>
              <input
                type="text"
                value={content.primaryCtaBn}
                onChange={(e) => handleChange('primaryCtaBn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Secondary CTA (En)</label>
              <input
                type="text"
                value={content.secondaryCtaEn}
                onChange={(e) => handleChange('secondaryCtaEn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Secondary CTA (Bn)</label>
              <input
                type="text"
                value={content.secondaryCtaBn}
                onChange={(e) => handleChange('secondaryCtaBn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
          </div>
        </div>

        {/* 03. About & Section Titles */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-5">
          <h2 className="text-base font-bold text-[#10b981] mb-4 font-mono">
            03. ABOUT SECTION & SECTION TITLES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">About Title (English)</label>
              <input
                type="text"
                value={content.aboutTitleEn}
                onChange={(e) => handleChange('aboutTitleEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">About Title (Bangla)</label>
              <input
                type="text"
                value={content.aboutTitleBn}
                onChange={(e) => handleChange('aboutTitleBn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">About Description (English)</label>
              <textarea
                rows={3}
                value={content.aboutDescriptionEn}
                onChange={(e) => handleChange('aboutDescriptionEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">About Description (Bangla)</label>
              <textarea
                rows={3}
                value={content.aboutDescriptionBn}
                onChange={(e) => handleChange('aboutDescriptionBn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#12281a]">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Selected Work Title (En/Bn)</label>
              <input
                type="text"
                value={content.selectedWorkTitleEn}
                onChange={(e) => handleChange('selectedWorkTitleEn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none mb-1.5"
              />
              <input
                type="text"
                value={content.selectedWorkTitleBn}
                onChange={(e) => handleChange('selectedWorkTitleBn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Client Logos Title (En/Bn)</label>
              <input
                type="text"
                value={content.clientLogosTitleEn}
                onChange={(e) => handleChange('clientLogosTitleEn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none mb-1.5"
              />
              <input
                type="text"
                value={content.clientLogosTitleBn}
                onChange={(e) => handleChange('clientLogosTitleBn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Testimonials Title (En/Bn)</label>
              <input
                type="text"
                value={content.testimonialsTitleEn}
                onChange={(e) => handleChange('testimonialsTitleEn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none mb-1.5"
              />
              <input
                type="text"
                value={content.testimonialsTitleBn}
                onChange={(e) => handleChange('testimonialsTitleBn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
          </div>
        </div>

        {/* 04. Call to Action Sections */}
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] p-6 space-y-5">
          <h2 className="text-base font-bold text-[#10b981] mb-4 font-mono">
            04. CONSULTATION & FINAL CTA PANELS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Consultation Strip Title (En)</label>
              <input
                type="text"
                value={content.consultationCtaTitleEn}
                onChange={(e) => handleChange('consultationCtaTitleEn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Consultation Strip Title (Bn)</label>
              <input
                type="text"
                value={content.consultationCtaTitleBn}
                onChange={(e) => handleChange('consultationCtaTitleBn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Final Large CTA Title (En)</label>
              <input
                type="text"
                value={content.finalCtaTitleEn}
                onChange={(e) => handleChange('finalCtaTitleEn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Final Large CTA Title (Bn)</label>
              <input
                type="text"
                value={content.finalCtaTitleBn}
                onChange={(e) => handleChange('finalCtaTitleBn', e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla"
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
