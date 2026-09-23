import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Star,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Mail,
  Clock,
  Sparkles,
  Quote,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { testimonialService } from '../../services/testimonialService';
import {
  testimonialSubmissionService,
  ApproveSubmissionEdits,
} from '../../services/testimonialSubmissionService';
import { imageService } from '../../services/imageService';
import { Testimonial, TestimonialSubmission } from '../../types';

type TabType = 'all' | 'pending' | 'published' | 'rejected';

export const AdminTestimonialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => testimonialService.getAll());
  const [submissions, setSubmissions] = useState<TestimonialSubmission[]>(() =>
    testimonialSubmissionService.getAll()
  );

  // Manual Testimonial Creation / Edit State
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isNewManual, setIsNewManual] = useState(false);

  // Visitor Submission Moderation State
  const [editingSubmission, setEditingSubmission] = useState<{
    submission: TestimonialSubmission;
    clientName: string;
    company: string;
    role: string;
    service: string;
    rating: number;
    reviewTextEn: string;
    reviewTextBn: string;
    avatarImage: string;
  } | null>(null);

  const [previewItem, setPreviewItem] = useState<{
    clientName: string;
    company: string;
    role: string;
    rating: number;
    avatarImage?: string;
    reviewText: string;
    source: 'admin' | 'visitor';
    submissionId?: string;
    isPending?: boolean;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const live = await testimonialService.getAllAsync();
      setTestimonials(live);
    } catch {
      setTestimonials(testimonialService.getAll());
    }

    try {
      const liveSubs = await testimonialSubmissionService.getAllSubmissions();
      setSubmissions(liveSubs);
    } catch {
      setSubmissions(testimonialSubmissionService.getAll());
    }
  };

  useEffect(() => {
    refreshData();

    const handleSubmissionsUpdated = async () => {
      try {
        const liveSubs = await testimonialSubmissionService.getAllSubmissions();
        setSubmissions(liveSubs);
      } catch {
        setSubmissions(testimonialSubmissionService.getAll());
      }
    };
    const handleTestimonialsUpdated = async () => {
      try {
        const live = await testimonialService.getAllAsync();
        setTestimonials(live);
      } catch {
        setTestimonials(testimonialService.getAll());
      }
    };

    window.addEventListener('testimonial-submissions-updated', handleSubmissionsUpdated);
    window.addEventListener('testimonials-updated', handleTestimonialsUpdated);

    return () => {
      window.removeEventListener('testimonial-submissions-updated', handleSubmissionsUpdated);
      window.removeEventListener('testimonials-updated', handleTestimonialsUpdated);
    };
  }, []);

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Counts for tabs
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const publishedCount = testimonials.filter((t) => t.published).length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;
  const totalCount = testimonials.length + submissions.filter((s) => s.status === 'pending' || s.status === 'rejected').length;

  // Set default tab to pending if any exist, otherwise all
  useEffect(() => {
    if (pendingCount > 0 && activeTab === 'all') {
      setActiveTab('pending');
    }
  }, []);

  // Handlers for Manual Admin Testimonials
  const handleStartNewManual = () => {
    setIsNewManual(true);
    setEditingSubmission(null);
    setEditingTestimonial({
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
      featured: false,
      source: 'admin',
      createdAt: new Date().toISOString(),
    });
  };

  const handleManualFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editingTestimonial) return;
    setUploading(true);
    try {
      const url = await imageService.compressAvatar(e.target.files[0], 360, 0.85);
      setEditingTestimonial((prev) => (prev ? { ...prev, avatarImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Image processing failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial || !editingTestimonial.clientName.trim() || !editingTestimonial.reviewTextEn.trim()) return;

    await testimonialService.save({
      ...editingTestimonial,
      source: editingTestimonial.source || 'admin',
      submissionId: editingTestimonial.submissionId || null,
      reviewTextBn: editingTestimonial.reviewTextBn || editingTestimonial.reviewTextEn,
    });
    setEditingTestimonial(null);
    setIsNewManual(false);
    showFeedback('Testimonial saved successfully.');
    await refreshData();
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (window.confirm('Delete this testimonial from the public database?')) {
      await testimonialService.delete(id);
      showFeedback('Testimonial deleted.');
      await refreshData();
    }
  };

  const handleTogglePublish = async (t: Testimonial) => {
    await testimonialService.save({ ...t, published: !t.published });
    showFeedback(t.published ? 'Testimonial hidden from public site.' : 'Testimonial published to public site.');
    await refreshData();
  };

  const handleToggleFeatured = async (t: Testimonial) => {
    await testimonialService.save({ ...t, featured: !t.featured });
    showFeedback(t.featured ? 'Removed from Featured.' : 'Marked as Featured.');
    await refreshData();
  };

  // Handlers for Visitor Submissions Moderation
  const handleOpenEditSubmission = (s: TestimonialSubmission) => {
    setEditingTestimonial(null);
    setIsNewManual(false);

    // Prefill bilingual fields cleanly based on submission language
    const isBn = s.submissionLanguage === 'bn';
    setEditingSubmission({
      submission: s,
      clientName: s.clientName,
      company: s.company || '',
      role: s.role || '',
      service: s.service || '',
      rating: s.rating,
      reviewTextEn: isBn ? '' : s.reviewText,
      reviewTextBn: isBn ? s.reviewText : '',
      avatarImage: s.clientImage || '',
    });
  };

  const handleSubmissionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editingSubmission) return;
    setUploading(true);
    try {
      const url = await imageService.compressAvatar(e.target.files[0], 360, 0.85);
      setEditingSubmission((prev) => (prev ? { ...prev, avatarImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleApproveAndPublishSubmission = async (
    submissionId: string,
    customEdits?: ApproveSubmissionEdits
  ) => {
    if (approvingId) return;
    setApprovingId(submissionId);
    try {
      await testimonialSubmissionService.approveSubmission(submissionId, customEdits);
      setEditingSubmission(null);
      setPreviewItem(null);
      showFeedback('Review approved and published to public site!');
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    if (window.confirm('Reject this visitor review? It will not appear on the website.')) {
      await testimonialSubmissionService.rejectSubmission(submissionId);
      setEditingSubmission(null);
      setPreviewItem(null);
      showFeedback('Review marked as rejected.');
      await refreshData();
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (window.confirm('Permanently delete this submission record?')) {
      await testimonialSubmissionService.deleteSubmission(submissionId);
      setEditingSubmission(null);
      setPreviewItem(null);
      showFeedback('Submission permanently removed.');
      await refreshData();
    }
  };

  const handleOpenPreviewSubmission = (s: TestimonialSubmission) => {
    setPreviewItem({
      clientName: s.clientName,
      company: s.company || '',
      role: s.role || '',
      rating: s.rating,
      avatarImage: s.clientImage,
      reviewText: s.reviewText,
      source: 'visitor',
      submissionId: s.id,
      isPending: s.status === 'pending',
    });
  };

  const handleOpenPreviewTestimonial = (t: Testimonial) => {
    setPreviewItem({
      clientName: t.clientName,
      company: t.company,
      role: t.role,
      rating: t.rating ?? 5,
      avatarImage: t.avatarImage,
      reviewText: t.reviewTextEn || t.reviewTextBn,
      source: t.source || 'admin',
      isPending: false,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
              Client Testimonials & Review Moderation
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#ca8a04]/25 border border-[#ca8a04]/50 text-[#fde047] animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage genuine client reviews, moderate visitor submissions, and toggle public visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNewManual}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-[#0d2a1b] border border-[#1b5333] text-[#34d399] text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            <span>{actionMessage}</span>
          </div>
          <button type="button" onClick={() => setActionMessage(null)} className="text-[#8ba394] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#143322]">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
            activeTab === 'pending'
              ? 'bg-[#10b981] text-[#022013]'
              : 'text-[#8ba394] hover:text-white hover:bg-[#081f13]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Reviews</span>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'pending'
                  ? 'bg-[#022013] text-[#10b981]'
                  : 'bg-[#ca8a04]/25 text-[#fde047] border border-[#ca8a04]/40'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('published')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
            activeTab === 'published'
              ? 'bg-[#10b981] text-[#022013]'
              : 'text-[#8ba394] hover:text-white hover:bg-[#081f13]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Published ({publishedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
            activeTab === 'rejected'
              ? 'bg-[#10b981] text-[#022013]'
              : 'text-[#8ba394] hover:text-white hover:bg-[#081f13]'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected ({rejectedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-[#10b981] text-[#022013]'
              : 'text-[#8ba394] hover:text-white hover:bg-[#081f13]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>All ({totalCount})</span>
        </button>
      </div>

      {/* MODAL 1: Edit Visitor Submission Before Approval */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#06140d] border border-[#143a25] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#143322]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10b981] font-semibold">
                  // MODERATE VISITOR SUBMISSION
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#f0f6f2] font-mono">
                  Edit Review: {editingSubmission.submission.clientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubmission(null)}
                className="p-1.5 text-[#8ba394] hover:text-white rounded-lg hover:bg-[#0d281a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Private Verification Info Notice */}
            <div className="p-3 rounded-xl bg-[#0a1f14] border border-[#194b30] flex items-center justify-between text-xs text-[#8ea899]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span>
                  Visitor Email: <strong className="text-white font-mono">{editingSubmission.submission.email}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#040e08] text-[#10b981]">
                Private / Verification Only
              </span>
            </div>

            {/* Photo preview & replacement */}
            <div className="p-4 rounded-xl bg-[#040e08] border border-[#143322] flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="shrink-0 flex items-center justify-center">
                {editingSubmission.avatarImage ? (
                  <div className="relative group">
                    <img
                      src={editingSubmission.avatarImage}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#10b981] shadow-md bg-[#081a10]"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingSubmission({ ...editingSubmission, avatarImage: '' })}
                      title="Remove Photo"
                      className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full shadow cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#092215] border border-dashed border-[#1e4832] flex flex-col items-center justify-center text-[#8ba394]">
                    <ImageIcon className="w-5 h-5 opacity-60" />
                    <span className="text-[9px] font-mono mt-0.5">Initial Fallback</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs font-mono font-bold text-[#f0f6f2] uppercase tracking-wider mb-1">
                  Client Photo
                </label>
                <p className="text-[11px] text-[#8ba394] font-mono mb-2">
                  Replace or remove client photo before publishing.
                </p>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d2a1b] hover:bg-[#123824] border border-[#1e4832] text-xs font-mono text-[#a5c2b0] hover:text-white cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>{uploading ? 'Processing...' : 'Upload Replacement'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSubmissionFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Client Name, Company, Role */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#8ba394] mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={editingSubmission.clientName}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, clientName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#8ba394] mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={editingSubmission.company}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, company: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#8ba394] mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={editingSubmission.role}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            {/* Rating & Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#8ba394] mb-1">Rating</label>
                <select
                  value={editingSubmission.rating}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, rating: Number(e.target.value) })}
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
                <label className="block text-xs font-mono text-[#8ba394] mb-1">Service Provided</label>
                <input
                  type="text"
                  value={editingSubmission.service}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, service: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            {/* Bilingual Review Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-[#8ba394]">
                    Review Text (English) {editingSubmission.submission.submissionLanguage === 'en' && '(Submitted)'}
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={editingSubmission.reviewTextEn}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, reviewTextEn: e.target.value })}
                  placeholder="Review text in English..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-[#8ba394]">
                    Review Text (Bangla) {editingSubmission.submission.submissionLanguage === 'bn' && '(Submitted)'}
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={editingSubmission.reviewTextBn}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, reviewTextBn: e.target.value })}
                  placeholder="বাংলায় রিভিউ লিখুন (ঐচ্ছিক)..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none font-bangla focus:border-[#10b981]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#143322]">
              <button
                type="button"
                onClick={() => handleRejectSubmission(editingSubmission.submission.id)}
                className="px-3.5 py-2 rounded-xl bg-[#2b0f0f] hover:bg-[#3d1515] text-[#ff8e8e] text-xs font-mono transition-colors cursor-pointer"
              >
                Reject Review
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSubmission(null)}
                  className="px-4 py-2 text-xs font-mono text-[#8ba394] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={approvingId === editingSubmission.submission.id}
                  onClick={() =>
                    handleApproveAndPublishSubmission(editingSubmission.submission.id, {
                      clientName: editingSubmission.clientName,
                      company: editingSubmission.company,
                      role: editingSubmission.role,
                      service: editingSubmission.service,
                      rating: editingSubmission.rating,
                      reviewTextEn: editingSubmission.reviewTextEn,
                      reviewTextBn: editingSubmission.reviewTextBn,
                      avatarImage: editingSubmission.avatarImage,
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#05df72] disabled:opacity-50 disabled:cursor-not-allowed text-[#022013] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-transform active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{approvingId === editingSubmission.submission.id ? 'Publishing...' : 'Approve & Publish'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Public Card Preview */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#06140d] border border-[#143a25] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#143322]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10b981] font-semibold">
                  // PUBLIC CARD PREVIEW
                </span>
                <h3 className="text-base font-bold text-[#f0f6f2] font-mono">
                  Card Appearance Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-[#8ba394] hover:text-white rounded-lg hover:bg-[#0d281a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Glowing Public Card Replica */}
            <div className="relative rounded-2xl p-[1.5px] overflow-hidden bg-[#0d2a1b] border border-[#1a4d31] shadow-2xl">
              <div className="relative z-20 w-full rounded-[14.5px] bg-[#05130b] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-[#FFC83D]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < previewItem.rating
                              ? 'fill-[#FFC83D] text-[#FFC83D]'
                              : 'fill-transparent text-[#234b34]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="p-2 rounded-lg bg-[#082013] text-[#10b981] border border-[#134027]">
                      <Quote className="w-4 h-4" />
                    </div>
                  </div>

                  <blockquote className="text-sm text-[#d1e4d8] leading-relaxed mb-6 italic">
                    "{previewItem.reviewText}"
                  </blockquote>
                </div>

                <div className="pt-4 border-t border-[#133822] flex items-center gap-3.5">
                  {previewItem.avatarImage ? (
                    <img
                      src={previewItem.avatarImage}
                      alt={previewItem.clientName}
                      className="w-10 h-10 rounded-full object-cover border border-[#17462b]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0a2315] border border-[#17462b] flex items-center justify-center text-sm font-bold text-[#10b981] font-mono">
                      {previewItem.clientName ? previewItem.clientName.trim().charAt(0).toUpperCase() : 'C'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white truncate">
                        {previewItem.clientName}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                    </div>
                    <p className="text-xs text-[#7d9987] truncate mt-0.5">
                      {[previewItem.role, previewItem.company].filter(Boolean).join(' • ') || previewItem.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-[#7d9987]">
                Source: <strong className="text-white capitalize">{previewItem.source}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 text-xs font-mono text-[#8ba394] hover:text-white"
                >
                  Close Preview
                </button>
                {previewItem.isPending && previewItem.submissionId && (
                  <button
                    type="button"
                    disabled={approvingId === previewItem.submissionId}
                    onClick={() => handleApproveAndPublishSubmission(previewItem.submissionId!)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#05df72] disabled:opacity-50 disabled:cursor-not-allowed text-[#022013] text-xs font-bold uppercase tracking-wider"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{approvingId === previewItem.submissionId ? 'Publishing...' : 'Approve & Publish'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Admin Testimonial Form (Add or Edit) */}
      {editingTestimonial && (
        <form onSubmit={handleSaveManual} className="p-6 rounded-2xl bg-[#06140d] border border-[#143a25] space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#143322]">
            <h3 className="text-sm font-bold text-[#f0f6f2] font-mono">
              {isNewManual ? 'New Admin Testimonial' : `Edit Testimonial: ${editingTestimonial.clientName}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditingTestimonial(null)}
              className="p-1.5 text-[#8ba394] hover:text-white rounded-lg hover:bg-[#0d281a]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photo section */}
          <div className="p-4 rounded-xl bg-[#040e08] border border-[#143322] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="shrink-0 flex items-center justify-center">
              {editingTestimonial.avatarImage ? (
                <div className="relative group">
                  <img
                    src={editingTestimonial.avatarImage}
                    alt="Client Photo Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#10b981] shadow-md bg-[#081a10]"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingTestimonial({ ...editingTestimonial, avatarImage: '' })}
                    title="Remove Photo"
                    className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full shadow cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#092215] border border-dashed border-[#1e4832] flex flex-col items-center justify-center text-[#8ba394]">
                  <ImageIcon className="w-5 h-5 opacity-60" />
                  <span className="text-[9px] font-mono mt-0.5">Initial Fallback</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-xs font-mono font-bold text-[#f0f6f2] uppercase tracking-wider mb-1">
                Client Photo
              </label>
              <p className="text-[11px] text-[#8ba394] font-mono mb-2.5">
                Upload portrait image (JPG, PNG, WebP). If omitted, an initial-based avatar fallback will display.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0d2a1b] hover:bg-[#123824] border border-[#1e4832] text-xs font-mono text-[#a5c2b0] hover:text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>{uploading ? 'Processing...' : editingTestimonial.avatarImage ? 'Replace Image' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleManualFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {editingTestimonial.avatarImage && (
                  <button
                    type="button"
                    onClick={() => setEditingTestimonial({ ...editingTestimonial, avatarImage: '' })}
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
                value={editingTestimonial.clientName}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })}
                placeholder="e.g. Faisal Ahmed"
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Company / Organization</label>
              <input
                type="text"
                value={editingTestimonial.company}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })}
                placeholder="e.g. Apex Visuals Ltd."
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Role / Designation</label>
              <input
                type="text"
                value={editingTestimonial.role}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                placeholder="e.g. Creative Director"
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-sm text-white outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Rating</label>
              <select
                value={editingTestimonial.rating || 5}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: Number(e.target.value) })}
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
                value={editingTestimonial.serviceOrCategory || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, serviceOrCategory: e.target.value })}
                placeholder="e.g. Brand Identity"
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Review Date</label>
              <input
                type="date"
                value={editingTestimonial.date || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Sort Order</label>
              <input
                type="number"
                value={editingTestimonial.sortOrder ?? 1}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, sortOrder: Number(e.target.value) })}
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
                value={editingTestimonial.reviewTextEn}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, reviewTextEn: e.target.value })}
                placeholder="Enter client review in English..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#040e08] border border-[#143322] text-xs text-white outline-none focus:border-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8ba394] mb-1">Review Text (Bangla)</label>
              <textarea
                rows={3}
                value={editingTestimonial.reviewTextBn}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, reviewTextBn: e.target.value })}
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
                  checked={editingTestimonial.published}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, published: e.target.checked })}
                  className="accent-[#10b981] w-4 h-4 rounded cursor-pointer"
                />
                <span>Published on Website</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#8ba394]">
                <input
                  type="checkbox"
                  checked={editingTestimonial.featured}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, featured: e.target.checked })}
                  className="accent-[#10b981] w-4 h-4 rounded cursor-pointer"
                />
                <span>Featured</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
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

      {/* TAB CONTENT 1: Pending Reviews Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {submissions.filter((s) => s.status === 'pending').length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#06140d] border border-[#143222] text-[#688574] font-mono space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto opacity-75" />
              <p className="text-sm text-[#f0f6f2]">All caught up!</p>
              <p className="text-xs">No pending visitor reviews waiting for moderation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions
                .filter((s) => s.status === 'pending')
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 sm:p-6 rounded-2xl bg-[#06140d] border border-[#1e4832] flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-[#10b981]/50 shadow-md"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {sub.clientImage ? (
                        <img
                          src={sub.clientImage}
                          alt={sub.clientName}
                          className="w-12 h-12 rounded-full object-cover border border-[#10b981] shrink-0 bg-[#040e08]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#0a2315] border border-[#1e4832] flex items-center justify-center text-sm font-bold text-[#10b981] font-mono shrink-0">
                          {sub.clientName.trim().charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{sub.clientName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0b2818] border border-[#175231] text-[#34d399]">
                            SOURCE: Visitor
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2b2108] border border-[#594411] text-[#fde047]">
                            Lang: {sub.submissionLanguage === 'bn' ? 'বাংলা' : 'English'}
                          </span>
                        </div>

                        <p className="text-xs text-[#7d9987]">
                          {[sub.role, sub.company, sub.service].filter(Boolean).join(' • ') || 'No company specified'}
                        </p>

                        {/* Private Email - Clearly labeled as admin-only */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#040e08] border border-[#122e1e] text-[11px] font-mono text-[#8ba394]">
                          <Mail className="w-3 h-3 text-[#10b981]" />
                          <span>{sub.email}</span>
                          <span className="text-[9px] text-[#557060] font-sans">(Private contact email)</span>
                        </div>

                        {/* Review text */}
                        <p className={`text-xs text-[#d1e4d8] leading-relaxed italic pt-1 ${sub.submissionLanguage === 'bn' ? 'font-bangla' : ''}`}>
                          "{sub.reviewText}"
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#7d9987]">
                          <span className="text-[#FFC83D]">{'★'.repeat(sub.rating)}</span>
                          <span>Submitted: {new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Moderation Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#122b1c] w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenPreviewSubmission(sub)}
                        className="px-3 py-1.5 rounded-lg bg-[#0a2315] hover:bg-[#0f331f] border border-[#17462b] text-xs font-mono text-[#a5c2b0] hover:text-white cursor-pointer transition-colors"
                        title="Preview Public Card"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditSubmission(sub)}
                        className="px-3 py-1.5 rounded-lg bg-[#0a2315] hover:bg-[#0f331f] border border-[#17462b] text-xs font-mono text-[#a5c2b0] hover:text-white cursor-pointer transition-colors"
                        title="Edit Before Approving"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={approvingId === sub.id}
                        onClick={() => handleApproveAndPublishSubmission(sub.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#05df72] disabled:opacity-50 disabled:cursor-not-allowed text-[#022013] text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-transform active:scale-98 shadow"
                        title="Approve and Publish on Public Website"
                      >
                        {approvingId === sub.id ? 'Publishing...' : 'Approve & Publish'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectSubmission(sub.id)}
                        className="p-1.5 rounded-lg bg-[#221010] text-[#f87171] hover:bg-[#331818] border border-[#441f1f] cursor-pointer"
                        title="Reject Review"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubmission(sub.id)}
                        className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e] hover:bg-[#331515] cursor-pointer"
                        title="Delete Submission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: Published Testimonials */}
      {activeTab === 'published' && (
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Source</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Excerpt</th>
                <th className="p-4 text-center">Featured</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#102418]">
              {testimonials.filter((t) => t.published).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#688574] font-mono">
                    No published testimonials yet.
                  </td>
                </tr>
              ) : (
                testimonials
                  .filter((t) => t.published)
                  .map((t) => (
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
                              {[t.role, t.company].filter(Boolean).join(' • ') || t.company}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            t.source === 'visitor'
                              ? 'bg-[#0b2818] border border-[#175231] text-[#34d399]'
                              : 'bg-[#081b11] border border-[#122b1c] text-[#8ba394]'
                          }`}
                        >
                          {t.source === 'visitor' ? 'Visitor' : 'Admin'}
                        </span>
                      </td>
                      <td className="p-4 text-[#FFC83D] font-mono">
                        {'★'.repeat(t.rating || 5)}
                      </td>
                      <td className="p-4 text-[#8ea899] max-w-xs truncate italic">
                        "{t.reviewTextEn || t.reviewTextBn}"
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(t)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                            t.featured
                              ? 'bg-[#2b2108] text-[#fde047] border border-[#594411]'
                              : 'bg-[#121815] text-[#557060] border border-[#1e2a24]'
                          }`}
                        >
                          {t.featured ? '★ Featured' : 'Standard'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(t)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-mono cursor-pointer transition-colors bg-[#0a2717] text-[#10b981] border border-[#16472b]"
                        >
                          Published
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPreviewTestimonial(t)}
                            className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white cursor-pointer"
                            title="Preview Card"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewManual(false);
                              setEditingTestimonial({ ...t });
                            }}
                            className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTestimonial(t.id)}
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
      )}

      {/* TAB CONTENT 3: Rejected Submissions */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          {submissions.filter((s) => s.status === 'rejected').length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#06140d] border border-[#143222] text-[#688574] font-mono">
              No rejected reviews.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions
                .filter((s) => s.status === 'rejected')
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-[#06140d] border border-[#2b1212] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0 opacity-80">
                      <div className="w-10 h-10 rounded-full bg-[#1c0c0c] border border-[#3b1717] flex items-center justify-center text-sm font-bold text-[#ff8e8e] font-mono shrink-0">
                        {sub.clientName.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{sub.clientName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2b0f0f] text-[#ff8e8e]">
                            REJECTED
                          </span>
                        </div>
                        <p className="text-xs text-[#7d9987] font-mono">{sub.email}</p>
                        <p className="text-xs text-[#8ea899] italic">"{sub.reviewText}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSubmission(sub)}
                        className="px-3 py-1.5 rounded-lg bg-[#0a2315] hover:bg-[#0f331f] border border-[#17462b] text-xs font-mono text-[#a5c2b0] hover:text-white cursor-pointer"
                      >
                        Re-evaluate & Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubmission(sub.id)}
                        className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e] hover:bg-[#331515] cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: All Testimonials & Submissions */}
      {activeTab === 'all' && (
        <div className="rounded-2xl bg-[#06140d] border border-[#143222] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081b11] border-b border-[#122b1c] text-[#7d9987] font-mono uppercase">
              <tr>
                <th className="p-4">Name / Entity</th>
                <th className="p-4">Source</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#102418]">
              {/* Published & Hidden Testimonials */}
              {testimonials.map((t) => (
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
                          {[t.role, t.company].filter(Boolean).join(' • ') || t.company}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#081b11] border border-[#122b1c] text-[#8ba394]">
                      {t.source === 'visitor' ? 'Visitor' : 'Admin'}
                    </span>
                  </td>
                  <td className="p-4 text-[#FFC83D] font-mono">{'★'.repeat(t.rating || 5)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        t.published
                          ? 'bg-[#0a2717] text-[#10b981] border border-[#16472b]'
                          : 'bg-[#1a1c1a] text-[#7d8c83] border border-[#272e29]'
                      }`}
                    >
                      {t.published ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPreviewTestimonial(t)}
                        className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewManual(false);
                          setEditingTestimonial({ ...t });
                        }}
                        className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e] hover:bg-[#331515]"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Submissions (Pending or Rejected) */}
              {submissions
                .filter((s) => s.status === 'pending' || s.status === 'rejected')
                .map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#081a10] bg-[#030d07]">
                    <td className="p-4 font-bold text-[#f0f6f2]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0a2315] border border-[#17462b] flex items-center justify-center text-xs font-bold text-[#10b981] font-mono">
                          {sub.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{sub.clientName}</span>
                          <span className="text-[11px] text-[#638470] block font-normal mt-0.5">
                            {[sub.role, sub.company].filter(Boolean).join(' • ') || sub.company}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0b2818] border border-[#175231] text-[#34d399]">
                        Visitor
                      </span>
                    </td>
                    <td className="p-4 text-[#FFC83D] font-mono">{'★'.repeat(sub.rating)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                          sub.status === 'pending'
                            ? 'bg-[#2b2108] text-[#fde047] border border-[#594411]'
                            : 'bg-[#2b0f0f] text-[#ff8e8e] border border-[#441a1a]'
                        }`}
                      >
                        {sub.status === 'pending' ? 'Pending Review' : 'Rejected'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPreviewSubmission(sub)}
                          className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubmission(sub)}
                          className="p-1.5 rounded-lg bg-[#081f13] text-[#8ca495] hover:text-white"
                          title="Moderate / Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="p-1.5 rounded-lg bg-[#1f0d0d] text-[#ff8e8e] hover:bg-[#331515]"
                          title="Delete"
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
