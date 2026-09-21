import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Layers,
  Sparkles,
  Building,
  MessageSquareQuote,
  Mail,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { clientLogoService } from '../../services/clientLogoService';
import { testimonialService } from '../../services/testimonialService';
import { consultationService } from '../../services/consultationService';

export const AdminDashboardPage: React.FC = () => {
  const allProjects = useMemo(() => projectService.getAll(), []);
  const allLogos = useMemo(() => clientLogoService.getAll(), []);
  const allTestimonials = useMemo(() => testimonialService.getAll(), []);
  const allConsultations = useMemo(() => consultationService.getAll(), []);

  // Calculated strictly from local data (no fake stats)
  const publishedProjectsCount = allProjects.filter((p) => p.published).length;
  const draftProjectsCount = allProjects.filter((p) => !p.published).length;
  const featuredProjectsCount = allProjects.filter((p) => p.featured).length;
  const publishedLogosCount = allLogos.filter((l) => l.published).length;
  const publishedTestimonialsCount = allTestimonials.filter((t) => t.published).length;
  const newConsultationsCount = allConsultations.filter((c) => c.status === 'New').length;

  const recentProjects = allProjects.slice(0, 4);
  const recentConsultations = allConsultations.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#132d1e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f3f9f5]">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#8ba394] mt-1 font-mono">
            Manage portfolio projects, client logos, testimonials, and consultations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/portfolio?action=new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </Link>
        </div>
      </div>

      {/* Calculated Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-[#06140d] border border-[#143222] flex flex-col">
          <span className="text-[11px] font-mono text-[#7ea08d] uppercase">Published Work</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#10b981] mt-2">
            {publishedProjectsCount}
          </span>
          <span className="text-[10px] text-[#557361] mt-1">Live in portfolio</span>
        </div>

        <div className="p-4 rounded-xl bg-[#06140d] border border-[#143222] flex flex-col">
          <span className="text-[11px] font-mono text-[#7ea08d] uppercase">Draft Projects</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#f0f6f2] mt-2">
            {draftProjectsCount}
          </span>
          <span className="text-[10px] text-[#557361] mt-1">Unpublished</span>
        </div>

        <div className="p-4 rounded-xl bg-[#06140d] border border-[#143222] flex flex-col">
          <span className="text-[11px] font-mono text-[#7ea08d] uppercase">Featured</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#34d399] mt-2">
            {featuredProjectsCount}
          </span>
          <span className="text-[10px] text-[#557361] mt-1">Spotlight carousel</span>
        </div>

        <div className="p-4 rounded-xl bg-[#06140d] border border-[#143222] flex flex-col">
          <span className="text-[11px] font-mono text-[#7ea08d] uppercase">Client Logos</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#f0f6f2] mt-2">
            {publishedLogosCount}
          </span>
          <span className="text-[10px] text-[#557361] mt-1">Active in marquee</span>
        </div>

        <div className="p-4 rounded-xl bg-[#06140d] border border-[#143222] flex flex-col">
          <span className="text-[11px] font-mono text-[#7ea08d] uppercase">Testimonials</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#f0f6f2] mt-2">
            {publishedTestimonialsCount}
          </span>
          <span className="text-[10px] text-[#557361] mt-1">Active reviews</span>
        </div>

        <div className="p-4 rounded-xl bg-[#06140d] border border-[#143222] flex flex-col">
          <span className="text-[11px] font-mono text-[#7ea08d] uppercase">New Requests</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#10b981] mt-2">
            {newConsultationsCount}
          </span>
          <span className="text-[10px] text-[#557361] mt-1">Pending review</span>
        </div>
      </div>

      {/* Two Columns: Recent Projects & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Projects */}
        <div className="lg:col-span-7 rounded-2xl bg-[#06140d] border border-[#143222] p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#122b1c]">
            <h2 className="text-base font-bold text-[#f0f6f2] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#10b981]" />
              <span>Recent Portfolio Projects</span>
            </h2>
            <Link
              to="/admin/portfolio"
              className="text-xs font-mono text-[#10b981] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-[#040e08] border border-[#12281a] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.coverImage}
                    alt={p.titleEn}
                    className="w-12 h-10 rounded-lg object-cover bg-[#091b11] border border-[#163825] shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#f0f6f2] truncate">
                      {p.titleEn}
                    </h3>
                    <span className="text-xs font-mono text-[#7b9887]">
                      {p.category} • {p.year}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.heroFeatured && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0e3520] text-[#34d399] border border-[#185331]">
                      Hero
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      p.published
                        ? 'bg-[#092215] text-[#10b981] border border-[#163f27]'
                        : 'bg-[#1b1e1c] text-[#86968c] border border-[#2b332f]'
                    }`}
                  >
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Consultation Requests */}
        <div className="lg:col-span-5 rounded-2xl bg-[#06140d] border border-[#143222] p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#122b1c]">
            <h2 className="text-base font-bold text-[#f0f6f2] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#10b981]" />
              <span>Recent Consultations</span>
            </h2>
            <Link
              to="/admin/consultations"
              className="text-xs font-mono text-[#10b981] hover:underline flex items-center gap-1"
            >
              <span>Inbox ({allConsultations.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentConsultations.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#668372]">
              No consultation requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentConsultations.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#040e08] border border-[#12281a] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f0f6f2] truncate">
                      {c.fullName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        c.status === 'New'
                          ? 'bg-[#10b981] text-[#022013] font-bold'
                          : 'bg-[#0a2014] text-[#8ba395] border border-[#143823]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7d9988] truncate">{c.email}</span>
                  <span className="text-[10px] font-mono text-[#557361] mt-0.5">
                    Service: {c.service}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
