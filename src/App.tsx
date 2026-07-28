import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProfileProvider } from '@/lib/profile';
import { useTheme } from '@/hooks/useTheme';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HomePage from '@/pages/HomePage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import ContactPage from '@/pages/ContactPage';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminProjects from '@/components/admin/AdminProjects';
import AdminBlog from '@/components/admin/AdminBlog';
import AdminSkills from '@/components/admin/AdminSkills';
import AdminLeads from '@/components/admin/AdminLeads';
import AdminMeetings from '@/components/admin/AdminMeetings';
import AdminProfile from '@/components/admin/AdminProfile';
import AdminTestimonials from '@/components/admin/AdminTestimonials';
import AdminSubscribers from './components/admin/AdminSubscribeers';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import UnsubscribePage from '@/pages/UnsubscribePage';
import LeadVerifyPage from '@/pages/LeadVerifyPage';
import MeetingPage from '@/pages/MeetingPage';
import AdminMeetingPage from '@/pages/AdminMeetingPage';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-surface-400">Loading...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar dark={dark} toggleTheme={toggle} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function TrackPageView() {
  const { pathname } = useLocation();
  useEffect(() => {
    supabase.from('page_views').insert({ page_path: pathname }).then(() => {});
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <ScrollToTop />
          <TrackPageView />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/projects" element={<Layout><ProjectsPage /></Layout>} />
            <Route path="/projects/:slug" element={<Layout><ProjectDetailPage /></Layout>} />
            <Route path="/blog" element={<Layout><BlogPage /></Layout>} />
            <Route path="/blog/:slug" element={<Layout><BlogPostPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

            {/* Newsletter public actions */}
            <Route path="/newsletter/verify" element={<VerifyEmailPage />} />
            <Route path="/newsletter/unsubscribe" element={<UnsubscribePage />} />

            {/* CRM public routes — no login required */}
            <Route path="/verify-email" element={<LeadVerifyPage />} />
            <Route path="/meeting/:meetingId" element={<MeetingPage />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="skills" element={<AdminSkills />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="meetings" element={<AdminMeetings />} />
              <Route path="meetings/:meetingId" element={<AdminMeetingPage />} />
              <Route path="subscribers" element={<AdminSubscribers />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
