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
    <section id="consultation" className="py-20 sm:py-28 relative transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Horizontal Announcement Banner Strip */}
        <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] shadow-[var(--card-shadow)] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden transition-colors">
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{
              backgroundColor: 'var(--accent)',
              opacity: 'var(--blur-opacity)',
            }}
          />
          
          <div className="text-center sm:text-left">
            <span className="text-xs font-mono text-[var(--accent)] tracking-widest uppercase block mb-1 font-semibold">
              // DESIGN INQUIRIES
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)]">
              {bannerTitle}
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-1">
              {bannerDesc}
            </p>
          </div>

          <a
            href="#consultation-form"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('consultation-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all shadow-[0_0_20px_var(--accent-glow)] shrink-0 cursor-pointer"
          >
            <span>{t('hero.secondaryCta')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Form Container */}
        <div
          id="consultation-form"
          className="w-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border-medium)] p-6 sm:p-10 lg:p-12 shadow-[var(--card-shadow)] relative overflow-hidden transition-colors"
        >
          {/* Ambient blur gradient matching CTA section */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{
              backgroundColor: 'var(--accent)',
              opacity: 'var(--blur-opacity)',
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="text-center max-w-lg mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)] tracking-tight mb-2">
                {t('consultation.formTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {t('consultation.formDesc')}
              </p>
            </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] border border-[var(--border-medium)] text-[var(--accent)] flex items-center justify-center mx-auto mb-5 shadow-sm">
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
                  className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-medium)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors cursor-pointer shadow-sm"
                >
                  {t('consultation.anotherRequest')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">
                      {t('consultation.fullName')} *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('consultation.fullNamePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">
                      {t('consultation.email')} *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('consultation.emailPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Company / Brand */}
                  <div>
                    <label htmlFor="company" className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">
                      {t('consultation.company')}
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={t('consultation.companyPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                    />
                  </div>

                  {/* Service Needed */}
                  <div>
                    <label htmlFor="service" className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">
                      {t('consultation.service')} *
                    </label>
                    <select
                      id="service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] outline-none transition-colors shadow-sm cursor-pointer"
                    >
                      {servicesList.map((srv) => (
                        <option key={srv} value={srv} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Budget */}
                  <div>
                    <label htmlFor="budget" className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">
                      {t('consultation.budget')}
                    </label>
                    <input
                      id="budget"
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder={t('consultation.budgetPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                    />
                  </div>

                  {/* Timeline */}
                  <div>
                    <label htmlFor="timeline" className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">
                      {t('consultation.timeline')}
                    </label>
                    <input
                      id="timeline"
                      type="text"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder={t('consultation.timelinePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">
                    {t('consultation.message')} *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('consultation.messagePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors resize-y shadow-sm"
                  />
                </div>

                <button
                  id="submit-consultation-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-semibold text-xs sm:text-sm tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_var(--accent-glow)] disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? t('consultation.submitting') : t('consultation.submit')}</span>
                </button>
              </form>
            )}
          </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
};
