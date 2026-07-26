import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, FolderKanban, FileText, Tags, Users,
  LogOut, ArrowLeft, User, Star, Menu, X, Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/profile', icon: User, label: 'Profile' },
  { to: '/admin/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/admin/blog', icon: FileText, label: 'Blog Posts' },
  { to: '/admin/skills', icon: Tags, label: 'Skills' },
  { to: '/admin/testimonials', icon: Star, label: 'Testimonials' },
  { to: '/admin/leads', icon: Users, label: 'Leads', hasBadge: true },
  { to: '/admin/subscribers', icon: Mail, label: 'Subscribers' },
];

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadLeadsCount, setUnreadLeadsCount] = useState<number>(0);

  // 1. Initial new leads count fetch karna
  const fetchNewLeadsCount = async () => {
    const { count, error } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'); // Sirf 'new' status wale count karega

    if (!error && count !== null) {
      setUnreadLeadsCount(count);
    }
  };

  useEffect(() => {
    fetchNewLeadsCount();

    // 2. Realtime listener setup (Jab bhi naya contact submission aaye)
    const channel = supabase
      .channel('realtime_leads')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_submissions' },
        () => {
          fetchNewLeadsCount(); // Database me koi bhi change ho to count update kar do
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Jab admin '/admin/leads' page par jaye tab count reset / refetch karna
  useEffect(() => {
    if (location.pathname === '/admin/leads') {
      fetchNewLeadsCount();
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg gradient-text">Admin Panel</h2>
            <p className="text-xs text-surface-500 mt-1 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>

              {/* Leads badge count */}
              {item.hasBadge && unreadLeadsCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                  {unreadLeadsCount > 99 ? '99+' : unreadLeadsCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-surface-200 dark:border-surface-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <ArrowLeft size={18} /> View Site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 relative"
            >
              <Menu size={24} />
              {/* Mobile Menu Notification Indicator */}
              {unreadLeadsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-surface-900" />
              )}
            </button>
            <h2 className="font-bold gradient-text">Admin Panel</h2>
          </div>

          {unreadLeadsCount > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900">
              {unreadLeadsCount} New Lead{unreadLeadsCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}