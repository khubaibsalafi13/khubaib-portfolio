import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteContent } from '../../types';

interface AnnouncementBarProps {
  content: SiteContent;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ content }) => {
  const { localized } = useLanguage();
  const announcement = localized(content.announcementEn, content.announcementBn);

  if (!announcement) return null;

  return (
    <div
      id="announcement-bar"
      className="w-full bg-[var(--bg-card-subtle)] border-b border-[var(--border-subtle)] py-2 px-4 text-center text-xs tracking-wide text-[var(--text-secondary)] flex items-center justify-center gap-2.5 transition-colors"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
      </span>
      <span className="font-medium text-[var(--text-primary)]">{announcement}</span>
    </div>
  );
};
