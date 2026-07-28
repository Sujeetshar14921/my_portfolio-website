import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NewsletterSubscriber } from '@/types';
import { Search, Trash2, Mail, MailCheck, Loader2, Send } from 'lucide-react';
import {
  getAllSubscribers, deleteSubscriber, searchSubscribers,
} from '@/lib/newsletter';

export default function AdminSubscribers() {
  const [subs, setSubs] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState({ total: 0, verified: 0 });
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState<string | null>(null);

  const load = async () => {
    const [all] = await Promise.all([
      getAllSubscribers(),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('verified', true),
    ]);
    setSubs(all);
    setStats({ total: all.length, verified: all.filter(s => s.verified).length });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async (term: string) => {
    setSearch(term);
    if (!term.trim()) {
      setSubs(await getAllSubscribers());
      return;
    }
    setSearching(true);
    const results = await searchSubscribers(term.trim());
    setSubs(results);
    setSearching(false);
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the newsletter?`)) return;
    await deleteSubscriber(id);
    load();
  };

  const handleSendBroadcast = async (slug: string) => {
    if (!slug) return;
    if (!confirm(`Send a newsletter email for "${slug}" to all verified subscribers?`)) return;
    setBroadcast(slug);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => ({}));
      alert(data?.message || data?.error || 'Done.');
    } catch {
      alert('Network error sending newsletter.');
    } finally {
      setBroadcast(null);
    }
  };

  if (loading) return <div className="animate-pulse text-surface-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-surface-500">
            <Mail size={16} /> {stats.total} total
          </span>
          <span className="flex items-center gap-1.5 text-accent-600 dark:text-accent-400">
            <MailCheck size={16} /> {stats.verified} verified
          </span>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
        {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-surface-400" />}
      </div>

      <div className="space-y-3">
        {subs.length === 0 && (
          <div className="text-center py-12 text-surface-400 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            No subscribers yet.
          </div>
        )}
        {subs.map(s => (
          <div
            key={s.id}
            className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <a href={`mailto:${s.email}`} className="font-medium hover:text-primary-600 truncate block">
                {s.email}
              </a>
              <div className="text-xs text-surface-500 mt-0.5">
                Subscribed {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              s.verified
                ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
            }`}>
              {s.verified ? 'Verified' : 'Pending'}
            </span>
            <button
              onClick={() => handleDelete(s.id, s.email)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
              title="Remove subscriber"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Broadcast tool */}
      <div className="mt-8 bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700">
        <h2 className="font-semibold mb-1">Send Blog Notification</h2>
        <p className="text-sm text-surface-500 mb-4">
          Notify all verified subscribers about a published blog post.
        </p>
        <BroadcastForm onSend={handleSendBroadcast} sending={broadcast !== null} sendingSlug={broadcast} />
      </div>
    </div>
  );
}

function BroadcastForm({
  onSend, sending, sendingSlug,
}: {
  onSend: (slug: string) => void;
  sending: boolean;
  sendingSlug: string | null;
}) {
  const [slug, setSlug] = useState('');
  const [posts, setPosts] = useState<{ title: string; slug: string }[]>([]);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('title, slug')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data as { title: string; slug: string }[]);
      });
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={slug}
        onChange={e => setSlug(e.target.value)}
        disabled={sending}
        className="flex-1 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
      >
        <option value="">Select a published post...</option>
        {posts.map(p => (
          <option key={p.slug} value={p.slug}>{p.title}</option>
        ))}
      </select>
      <button
        onClick={() => onSend(slug)}
        disabled={!slug || sending}
        className="px-4 py-2 rounded-lg text-sm font-medium gradient-bg text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
      >
        {sending && sendingSlug === slug ? (
          <><Loader2 size={16} className="animate-spin" /> Sending...</>
        ) : (
          <><Send size={16} /> Send to all</>
        )}
      </button>
    </div>
  );
}
