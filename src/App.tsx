import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShieldCheck } from 'lucide-react';

// Public Views
import { PublicLayout } from './components/public/PublicLayout';
import { HomePage } from './pages/public/HomePage';
import { ProjectDetailPage } from './pages/public/ProjectDetailPage';

// Admin Views
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminHomepageEditorPage } from './pages/admin/AdminHomepageEditorPage';
import { AdminPortfolioPage } from './pages/admin/AdminPortfolioPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminExperiencePage } from './pages/admin/AdminExperiencePage';
import { AdminEducationPage } from './pages/admin/AdminEducationPage';
import { AdminClientLogosPage } from './pages/admin/AdminClientLogosPage';
import { AdminTestimonialsPage } from './pages/admin/AdminTestimonialsPage';
import { AdminConsultationsPage } from './pages/admin/AdminConsultationsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Protected Route Guard with Session Hydration
const ProtectedAdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030905] text-[#e8f1ec] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#082014] border border-[#143d26] flex items-center justify-center text-[#10b981] mb-5 shadow-[0_0_24px_rgba(16,185,129,0.18)]">
          <ShieldCheck className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#8ba395] tracking-wider uppercase">
            Restoring Admin Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Direct /admin navigation: show the Admin Login interface directly at /admin
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      return <AdminLoginPage />;
    }
    // Subroutes like /admin/settings: redirect to /admin/login preserving target
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <AdminLayout />;
};

// Admin Login Route Wrapper
const AdminLoginWrapper: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030905] text-[#e8f1ec] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#082014] border border-[#143d26] flex items-center justify-center text-[#10b981] mb-5 shadow-[0_0_24px_rgba(16,185,129,0.18)]">
          <ShieldCheck className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#8ba395] tracking-wider uppercase">
            Checking Session...
          </span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = (location.state as any)?.from?.pathname || '/admin';
    return <Navigate to={destination} replace />;
  }

  return <AdminLoginPage />;
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes with GSAP ScrollSmoother */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/work/:slug" element={<ProjectDetailPage />} />
              </Route>

              {/* Admin Auth Route */}
              <Route path="/admin/login" element={<AdminLoginWrapper />} />

              {/* Admin Panel Nested Routes */}
              <Route path="/admin" element={<ProtectedAdminRoute />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="homepage" element={<AdminHomepageEditorPage />} />
                <Route path="portfolio" element={<AdminPortfolioPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="experience" element={<AdminExperiencePage />} />
                <Route path="education" element={<AdminEducationPage />} />
                <Route path="client-logos" element={<AdminClientLogosPage />} />
                <Route path="testimonials" element={<AdminTestimonialsPage />} />
                <Route path="consultations" element={<AdminConsultationsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

