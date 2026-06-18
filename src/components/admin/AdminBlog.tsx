import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BlogPost } from '@/types';
import { Plus, Pencil, Trash2, X, Eye } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

const emptyPost: Partial<BlogPost> = {
  title: '', slug: '', excerpt: '', content: '', cover_image: '', tags: [], published: false, read_time: 5,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const load = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data as BlogPost[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    const payload = {
      ...editing,
      slug: editing.slug || slugify(editing.title || ''),
      tags: editing.tags || [],
      published_at: editing.published && !editing.published_at ? new Date().toISOString() : editing.published_at,
    };

    if (editing.id) {
      await supabase.from('blog_posts').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('blog_posts').insert(payload);
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    load();
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setEditing(prev => prev ? { ...prev, tags: [...(prev.tags || []), tagInput.trim()] } : prev);
    setTagInput('');
  };

  const removeTag = (idx: number) => {
    setEditing(prev => prev ? { ...prev, tags: (prev.tags || []).filter((_, i) => i !== idx) } : prev);
  };

  if (loading) return <div className="animate-pulse text-surface-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <button onClick={() => setEditing({ ...emptyPost })} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium gradient-bg text-white hover:opacity-90">
          <Plus size={16} /> New Post
        </button>
      </div>

      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 flex items-center gap-4">
            <img src={p.cover_image} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.title}</div>
              <div className="text-xs text-surface-500 flex items-center gap-2">
                <span className={p.published ? 'text-accent-600' : 'text-surface-400'}>
                  {p.published ? 'Published' : 'Draft'}
                </span>
                <span>{p.read_time} min read</span>
                <span>{(p.tags || []).join(', ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing({ ...p })} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing.id ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={editing.title || ''} onChange={e => setEditing(p => p ? { ...p, title: e.target.value, slug: slugify(e.target.value) } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input value={editing.slug || ''} onChange={e => setEditing(p => p ? { ...p, slug: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea value={editing.excerpt || ''} onChange={e => setEditing(p => p ? { ...p, excerpt: e.target.value } : p)} rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
                <textarea value={editing.content || ''} onChange={e => setEditing(p => p ? { ...p, content: e.target.value } : p)} rows={12} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm font-mono outline-none focus:ring-2 focus:ring-primary-500 resize-y" />
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                <ImageUpload
                  value={editing.cover_image || ''}
                  onChange={(url: string) => setEditing(p => p ? { ...p, cover_image: url } : p)}
                  folder="blog"
                  label="Cover Image"
                  aspectClass="aspect-video"
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Read Time (min)</label>
                  <input type="number" value={editing.read_time || 5} onChange={e => setEditing(p => p ? { ...p, read_time: parseInt(e.target.value) || 5 } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {(editing.tags || []).map((tag, i) => (
                    <span key={i} className="px-2 py-1 rounded-md text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(i)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Add tag..." />
                  <button onClick={addTag} className="px-3 py-2 rounded-lg text-sm bg-surface-100 dark:bg-surface-700">Add</button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!editing.published} onChange={e => setEditing(p => p ? { ...p, published: e.target.checked } : p)} className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                Publish immediately
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Post'}
                </button>
                <button onClick={() => setEditing(null)} className="px-6 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
