import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderKanban, FileText, Tags, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  projects: number;
  posts: number;
  skills: number;
  leads: number;
  newLeads: number;
  pageViews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ projects: 0, posts: 0, skills: 0, leads: 0, newLeads: 0, pageViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [projects, posts, skills, leads, newLeads, pageViews] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('skills').select('id', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('page_views').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        projects: projects.count || 0,
        posts: posts.count || 0,
        skills: skills.count || 0,
        leads: leads.count || 0,
        newLeads: newLeads.count || 0,
        pageViews: pageViews.count || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, to: '/admin/projects', color: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30' },
    { label: 'Blog Posts', value: stats.posts, icon: FileText, to: '/admin/blog', color: 'text-accent-600 bg-accent-100 dark:bg-accent-900/30' },
    { label: 'Skills', value: stats.skills, icon: Tags, to: '/admin/skills', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Leads', value: stats.leads, icon: Users, to: '/admin/leads', color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30', badge: stats.newLeads > 0 ? `${stats.newLeads} new` : undefined },
    { label: 'Page Views', value: stats.pageViews, icon: Eye, to: '#', color: 'text-surface-600 bg-surface-100 dark:bg-surface-800' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map(card => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors relative"
          >
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={20} />
            </div>
            <div className="text-2xl font-bold">{loading ? '—' : card.value}</div>
            <div className="text-sm text-surface-500 dark:text-surface-400">{card.label}</div>
            {card.badge && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {card.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/projects?action=new" className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
            + New Project
          </Link>
          <Link to="/admin/blog?action=new" className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-600 text-white hover:bg-accent-700 transition-colors">
            + New Blog Post
          </Link>
          <Link to="/admin/skills?action=new" className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors">
            + New Skill
          </Link>
        </div>
      </div>
    </div>
  );
}
