import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { SiteContent } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { consultationService } from '../../services/consultationService';

interface ConsultationSectionProps {
  content: SiteContent;
}

export const ConsultationSection: React.FC<ConsultationSectionProps> = ({ content }) => {
  const { localized, t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [service, setService] = useState('Brand Identity');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const bannerTitle = localized(content.consultationCtaTitleEn, content.consultationCtaTitleBn);
  const bannerDesc = localized(content.consultationCtaDescEn, content.consultationCtaDescBn);

  const servicesList = [
    'Brand Identity',
    'Graphic Design',
    'Digital Design',
    'UI / Web Design',
    'Other / Advisory',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      if (!fullName.trim() || !email.trim() || !message.trim()) {
        throw new Error('Please fill in all required fields.');
      }

      await consultationService.submit({
        fullName: fullName.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        service,
        budget: budget.trim() || undefined,
        timeline: timeline.trim() || undefined,
        message: message.trim(),
      });

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setCompany('');
    setService('Brand Identity');
    setBudget('');
    setTimeline('');
    setMessage('');
    setIsSuccess(false);
    setErrorMessage('');
  };

  return (
    <section id="consultation" className="py-24 sm:py-36 relative transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Open Editorial Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {localized('INQUIRIES', 'পরামর্শ')}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight mb-4">
            {bannerTitle}
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-normal">
            {bannerDesc}
          </p>
        </div>

        {/* Airy Form Presentation - Unboxed & Minimalist */}
        <div
          id="consultation-form"
          className="relative z-10 w-full"
        >
          <div className="max-w-3xl mx-auto">
            {errorMessage && (
              <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 px-4 border border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-card)]"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent)] flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-heading)] mb-2">
                    {t('consultation.successTitle')}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8">
                    {t('consultation.successDesc')}
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-7 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
                  >
                    {t('consultation.anotherRequest')}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
                      >
                        {t('consultation.fullName')} *
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('consultation.fullNamePlaceholder')}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
                      >
                        {t('consultation.email')} *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('consultation.emailPlaceholder')}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Organization/Company */}
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
                      >
                        {t('consultation.company')}
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder={t('consultation.companyPlaceholder')}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                      />
                    </div>

                    {/* Service Selection */}
                    <div>
                      <label
                        htmlFor="service"
                        className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
                      >
                        {t('consultation.serviceRequired')} *
                      </label>
                      <select
                        id="service"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] outline-none transition-colors shadow-sm cursor-pointer"
                      >
                        {servicesList.map((srv) => (
                          <option key={srv} value={srv} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {srv}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estimated Budget */}
                    <div>
                      <label
                        htmlFor="budget"
                        className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
                      >
                        {t('consultation.budget')}
                      </label>
                      <input
                        id="budget"
                        type="text"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder={t('consultation.budgetPlaceholder')}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Timeline / Target Launch */}
                  <div>
                    <label
                      htmlFor="timeline"
                      className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
                    >
                      {t('consultation.timeline')}
                    </label>
                    <input
                      id="timeline"
                      type="text"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder={t('consultation.timelinePlaceholder')}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                    />
                  </div>

                  {/* Project Brief / Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
                    >
                      {t('consultation.message')} *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('consultation.messagePlaceholder')}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors resize-y shadow-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 text-center">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer w-full sm:w-auto hover:-translate-y-0.5 active:scale-98"
                    >
                      {submitting ? (
                        <span>{t('consultation.sending')}</span>
                      ) : (
                        <>
                          <span>{t('consultation.submitButton')}</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
