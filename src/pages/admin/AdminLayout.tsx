import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  History,
  GraduationCap,
  Building,
  MessageSquareQuote,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { authService } from '../../services/authService';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Homepage Editor', icon: FileText, path: '/admin/homepage' },
    { label: 'Portfolio Projects', icon: Briefcase, path: '/admin/portfolio' },
    { label: 'Categories', icon: Layers, path: '/admin/categories' },
    { label: 'Services', icon: Sparkles, path: '/admin/services' },
    { label: 'Experience', icon: History, path: '/admin/experience' },
    { label: 'Education', icon: GraduationCap, path: '/admin/education' },
    { label: 'Client Logos', icon: Building, path: '/admin/client-logos' },
    { label: 'Testimonials', icon: MessageSquareQuote, path: '/admin/testimonials' },
    { label: 'Consultations', icon: Mail, path: '/admin/consultations' },
    { label: 'Site Settings', icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#030905] text-[#e8f1ec] flex flex-col md:flex-row">
      
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-[#05130b] border-b border-[#143222] px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#10b981] text-[#022013] font-bold text-xs flex items-center justify-center">
            KS
          </div>
          <span className="font-bold text-sm text-[#f0f6f2]">Admin CMS</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#8ba394] hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? 'block fixed inset-0 z-50 bg-[#040e08]' : 'hidden'
        } md:block md:w-64 md:shrink-0 bg-[#05120a] border-r border-[#132d1e] flex flex-col justify-between p-4 overflow-y-auto`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#11271b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0a2315] border border-[#17462b] flex items-center justify-center text-[#10b981] font-bold text-sm">
                KS
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#f0f6f2]">Khubaib Salafi</h2>
                <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-wider block">
                  ADMINISTRATOR
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-[#7d9987] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#10b981] text-[#022013] font-semibold shadow-sm'
                      : 'text-[#8ba395] hover:text-[#d3e5db] hover:bg-[#092215]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="pt-4 mt-6 border-t border-[#11271b] space-y-2">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-[#86a292] hover:text-[#10b981] hover:bg-[#092215] transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-[#ff8e8e] hover:bg-[#2d0f0f] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10 max-w-7xl">
        <Outlet />
      </main>

    </div>
  );
};
