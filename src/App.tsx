import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { authService } from './services/authService';

// Public Views
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

// Protected Route Guard
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/work/:slug" element={<ProjectDetailPage />} />

          {/* Admin Auth Route */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Panel Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
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
    </LanguageProvider>
  </ThemeProvider>
  );
}
