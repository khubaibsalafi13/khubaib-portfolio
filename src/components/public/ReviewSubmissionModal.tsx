import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Upload, Trash2, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { testimonialSubmissionService } from '../../services/testimonialSubmissionService';
import { imageService } from '../../services/imageService';
import { ScrollSmoother } from '../../lib/gsap';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  servicesList?: string[];
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  triggerRef,
  servicesList = [
    'Brand Identity',
    'Graphic Design',
    'Digital Design',
    'UI / Web Design',
    'Packaging & Print',
    'Visual Case Study',
  ],
}) => {
  const { language, localized } = useLanguage();

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [service, setService] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submissionLanguage, setSubmissionLanguage] = useState<'en' | 'bn'>(language === 'bn' ? 'bn' : 'en');
  const [reviewText, setReviewText] = useState('');
  const [clientImage, setClientImage] = useState<string>('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Anti-spam trap

  // UI States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync initial submission language with site language on open
  useEffect(() => {
    if (isOpen) {
      setSubmissionLanguage(language === 'bn' ? 'bn' : 'en');
      setErrorMessage(null);
      setFieldErrors({});
      setSubmittedSuccess(false);
    }
  }, [isOpen, language]);

  // Safe ScrollSmoother pausing and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // 1. Pause GSAP ScrollSmoother safely on desktop
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.paused(true);
    }

    // 2. Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 3. Auto focus first interactive element
    const focusTimer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    // 4. Trap keyboard focus & handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);

      // Restore ScrollSmoother and body scroll
      if (smoother) {
        smoother.paused(false);
      }
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    // Return focus to the trigger button
    if (triggerRef && triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 50);
    }
  };

  // Image Upload with compression & validation
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if removed
    e.target.value = '';

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: localized('Supported image formats: JPG, PNG, or WebP.', 'সমর্থিত ফরম্যাট: JPG, PNG, অথবা WebP।'),
      }));
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: localized('File size exceeds 3MB limit.', 'ছবির সাইজ ৩MB-এর কম হতে হবে।'),
      }));
      return;
    }

    setUploadingImage(true);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.photo;
      return next;
    });

    try {
      const compressedUrl = await imageService.compressAvatar(file, 360, 0.85);
      setClientImage(compressedUrl);
    } catch (err: any) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: err.message || localized('Failed to process image.', 'ছবি লোড করতে সমস্যা হয়েছে।'),
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setClientImage('');
  };

  // Star Rating helpers
  const ratingLabels: Record<number, { en: string; bn: string }> = {
    5: { en: '5 Stars - Exceptional', bn: '৫ স্টার - অসাধারণ' },
    4: { en: '4 Stars - Great Experience', bn: '৪ স্টার - চমৎকার অভিজ্ঞতা' },
    3: { en: '3 Stars - Satisfied', bn: '৩ স্টার - সন্তোষজনক' },
    2: { en: '2 Stars - Fair', bn: '২ স্টার - চলনসই' },
    1: { en: '1 Star - Needs Improvement', bn: '১ স্টার - উন্নতির সুযোগ রয়েছে' },
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!clientName.trim()) {
      errors.name = localized('Please enter your name.', 'অনুগ্রহ করে আপনার নাম লিখুন।');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = localized('Email address is required.', 'ইমেইল আবশ্যক।');
    } else if (!emailRegex.test(email.trim())) {
      errors.email = localized('Please enter a valid email address.', 'একটি সঠিক ইমেইল ঠিকানা দিন।');
    }

    if (!reviewText.trim()) {
      errors.review = localized('Please enter your review.', 'অনুগ্রহ করে আপনার রিভিউ লিখুন।');
    } else if (reviewText.trim().length < 8) {
      errors.review = localized('Review should be at least 8 characters long.', 'রিভিউ কমপক্ষে ৮ অক্ষরের হতে হবে।');
    }

    if (!rating || rating < 1 || rating > 5) {
      errors.rating = localized('Please select a rating between 1 and 5 stars.', '১ থেকে ৫ স্টারের মধ্যে রেটিং দিন।');
    }

    if (!consent) {
      errors.consent = localized('Consent is required to submit your review.', 'রিভিউ জমা দিতে সম্মতির বক্সে টিক দিন।');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      setErrorMessage(localized('Please correct the highlighted errors before submitting.', 'অনুগ্রহ করে ভুলগুলো সংশোধন করে পুনরায় চেষ্টা করুন।'));
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await testimonialSubmissionService.createSubmission({
        clientName: clientName.trim(),
        company: company.trim(),
        role: role.trim(),
        service: service.trim(),
        rating,
        reviewText: reviewText.trim(),
        submissionLanguage,
        clientImage,
        email: email.trim().toLowerCase(),
        consent: true,
        honeypot,
      });

      setSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || localized('Failed to submit review. Please try again.', 'রিভিউ জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'));
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form and close
  const handleDone = () => {
    setClientName('');
    setCompany('');
    setRole('');
    setService('');
    setRating(5);
    setReviewText('');
    setClientImage('');
    setEmail('');
    setConsent(false);
    setSubmittedSuccess(false);
    handleClose();
  };

  if (!isOpen) return null;

  const activeStarCount = hoverRating !== null ? hoverRating : rating;

  // Render via React Portal to document.body to ensure it is OUTSIDE GSAP #smooth-content
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-xl sm:rounded-2xl rounded-t-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold mb-0.5">
              <span>// {localized('FEEDBACK', 'ফিডব্যাক')}</span>
            </div>
            <h3
              id="review-modal-title"
              className="text-lg sm:text-xl font-bold text-[var(--text-heading)] tracking-tight"
            >
              {localized('Leave a Review', 'রিভিউ শেয়ার করুন')}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label={localized('Close modal', 'বন্ধ করুন')}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border-subtle)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {submittedSuccess ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="py-8 sm:py-10 text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center mx-auto text-[var(--accent)] shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                  {localized('Thank you for your review.', 'আপনার রিভিউয়ের জন্য ধন্যবাদ।')}
                </h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {localized(
                    'Your testimonial has been submitted for approval and will appear on the website once it has been reviewed.',
                    'আপনার টেস্টিমোনিয়াল অনুমোদনের জন্য জমা হয়েছে। পর্যালোচনার পর এটি ওয়েবসাইটে প্রকাশিত হবে।'
                  )}
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleDone}
                  className="px-6 py-2.5 rounded-full bg-[var(--accent)] hover:brightness-110 text-black text-xs font-bold uppercase tracking-wider transition-transform active:scale-98 shadow-md cursor-pointer"
                >
                  {localized('Close', 'সম্পন্ন')}
                </button>
              </div>
            </div>
          ) : (
            /* FORM SUBMISSION STATE */
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Anti-spam honeypot (hidden from human visitors) */}
              <div className="opacity-0 absolute -left-[9999px] pointer-events-none" aria-hidden="true">
                <input
                  type="text"
                  name="website_url_hp"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Client Photo Upload */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-4">
                <div className="shrink-0 relative">
                  {clientImage ? (
                    <div className="relative group">
                      <img
                        src={clientImage}
                        alt="Client photo preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-[var(--accent)] shadow-sm bg-[var(--bg-card)]"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        title={localized('Remove photo', 'ছবি মুছুন')}
                        className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full shadow cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[var(--bg-card)] border border-dashed border-[var(--border-medium)] flex items-center justify-center text-sm font-bold text-[var(--accent)] font-mono shadow-inner">
                      {clientName.trim() ? clientName.trim().charAt(0).toUpperCase() : '✦'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[var(--text-heading)]">
                      {localized('Client Photo', 'ক্লায়েন্টের ছবি')}{' '}
                      <span className="text-[var(--text-muted)] font-normal">
                        ({localized('Optional', 'ঐচ্ছিক')})
                      </span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 mb-2">
                    {localized('JPG, PNG, or WebP (max 3MB). Initial fallback used if omitted.', 'JPG, PNG বা WebP (সর্বোচ্চ ৩MB)। ছবি না দিলে নামের আদ্যক্ষর ব্যবহার হবে।')}
                  </p>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-page)] border border-[var(--border-medium)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>
                        {uploadingImage
                          ? localized('Optimizing...', 'অপটিমাইজ হচ্ছে...')
                          : clientImage
                          ? localized('Replace', 'পরিবর্তন')
                          : localized('Upload Photo', 'ছবি আপলোড')}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    {clientImage && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        {localized('Remove', 'মুছুন')}
                      </button>
                    )}
                  </div>
                  {fieldErrors.photo && (
                    <p className="text-[11px] text-red-400 mt-1">{fieldErrors.photo}</p>
                  )}
                </div>
              </div>

              {/* 2. Rating Input (Keyboard Accessible with Yellow Stars) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-heading)]">
                  {localized('RATING', 'রেটিং')} <span className="text-red-400">*</span>
                </label>
                <div
                  role="radiogroup"
                  aria-label={localized('Rating selection', 'রেটিং নির্বাচন')}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isFilled = starValue <= activeStarCount;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          role="radio"
                          aria-checked={rating === starValue}
                          aria-label={`${starValue} ${starValue === 1 ? 'star' : 'stars'}`}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(starValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                              e.preventDefault();
                              setRating(Math.min(5, rating + 1));
                            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                              e.preventDefault();
                              setRating(Math.max(1, rating - 1));
                            }
                          }}
                          className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${
                              isFilled
                                ? 'fill-[#FFC83D] text-[#FFC83D] drop-shadow-[0_1px_4px_rgba(255,200,61,0.35)] scale-105'
                                : 'fill-transparent text-[var(--border-medium)] opacity-40'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-secondary)] ml-2">
                    {language === 'bn'
                      ? ratingLabels[activeStarCount]?.bn
                      : ratingLabels[activeStarCount]?.en}
                  </span>
                </div>
                {fieldErrors.rating && (
                  <p className="text-[11px] text-red-400">{fieldErrors.rating}</p>
                )}
              </div>

              {/* 3. Name & Company / Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-heading)]">
                    {localized('YOUR NAME', 'আপনার নাম')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.name;
                          return n;
                        });
                      }
                    }}
                    placeholder={localized('e.g. Faisal Ahmed', 'যেমন: ফয়সাল আহমেদ')}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors ${
                      fieldErrors.name ? 'border-red-500' : 'border-[var(--border-subtle)]'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-[11px] text-red-400">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-heading)]">
                    {localized('COMPANY / ORGANIZATION', 'কোম্পানি / প্রতিষ্ঠান')}
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={localized('e.g. Apex Visuals Ltd.', 'যেমন: একমি কর্পোরেশন')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {/* 4. Role & Service Provided */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-heading)]">
                    {localized('ROLE / POSITION', 'পদবি / ভূমিকা')}
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder={localized('e.g. Creative Director / Founder', 'যেমন: ক্রিয়েটিভ ডিরেক্টর / প্রতিষ্ঠাতা')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-heading)]">
                    {localized('SERVICE PROVIDED', 'প্রদত্ত সার্ভিস')}
                  </label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                  >
                    <option value="">{localized('-- Select service (Optional) --', '-- সার্ভিস নির্বাচন করুন (ঐচ্ছিক) --')}</option>
                    {servicesList.map((srv) => (
                      <option key={srv} value={srv}>
                        {srv}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Review Language Toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-heading)]">
                  {localized('REVIEW LANGUAGE', 'রিভিউয়ের ভাষা')} <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubmissionLanguage('en')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      submissionLanguage === 'en'
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionLanguage('bn')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border font-bangla ${
                      submissionLanguage === 'bn'
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              {/* 6. Your Review Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-heading)]">
                  {localized('YOUR REVIEW', 'আপনার রিভিউ')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={(e) => {
                    setReviewText(e.target.value);
                    if (fieldErrors.review) {
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.review;
                        return n;
                      });
                    }
                  }}
                  placeholder={
                    submissionLanguage === 'bn'
                      ? 'ডিজাইন কাজ, পেশাদারিত্ব ও সহযোগিতার অভিজ্ঞতা নিয়ে আপনার মন্তব্য লিখুন...'
                      : 'Describe your collaboration experience, delivery quality, and communication...'
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors ${
                    submissionLanguage === 'bn' ? 'font-bangla' : ''
                  } ${fieldErrors.review ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                />
                {fieldErrors.review && (
                  <p className="text-[11px] text-red-400">{fieldErrors.review}</p>
                )}
              </div>

              {/* 7. Email with Privacy Notice */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--text-heading)]">
                    {localized('EMAIL', 'ইমেইল')} <span className="text-red-400">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] font-mono">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{localized('Private & Confidential', 'গোপনীয় ও সুরক্ষিত')}</span>
                  </span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.email;
                        return n;
                      });
                    }
                  }}
                  placeholder="e.g. client@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors ${
                    fieldErrors.email ? 'border-red-500' : 'border-[var(--border-subtle)]'
                  }`}
                />
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  {localized(
                    'Your email will only be used for review verification and will not be displayed publicly.',
                    'আপনার ইমেইল শুধুমাত্র রিভিউ যাচাইকরণের জন্য ব্যবহৃত হবে এবং এটি কোনোভাবেই প্রকাশ্যে দেখানো হবে না।'
                  )}
                </p>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              {/* 8. Required Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (fieldErrors.consent) {
                        setFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.consent;
                          return n;
                        });
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded accent-[var(--accent)] cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">
                    {localized(
                      'I confirm that this review reflects my genuine experience and may be displayed on this portfolio after approval.',
                      'আমি নিশ্চিত করছি যে এই রিভিউটি আমার বাস্তব অভিজ্ঞতা প্রকাশ করে এবং অনুমোদনের পর তা পোর্টফোলিওতে প্রদর্শিত হতে পারে।'
                    )}{' '}
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                {fieldErrors.consent && (
                  <p className="text-[11px] text-red-400 mt-1 pl-7">{fieldErrors.consent}</p>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                >
                  {localized('Cancel', 'বাতিল')}
                </button>

                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--accent)] hover:brightness-110 text-black text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-98"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>
                    {submitting
                      ? localized('Submitting Review...', 'জমা দেওয়া হচ্ছে...')
                      : localized('Submit Review', 'রিভিউ জমা দিন')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
