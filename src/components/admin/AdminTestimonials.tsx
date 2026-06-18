import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Testimonial } from '@/types';
import { Plus, Pencil, Trash2, X, Star, Eye, EyeOff, GripVertical } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

const empty: Partial<Testimonial> = {
  name: '', role: '', company: '', avatar_url: '', content: '', sort_order: 0, published: true,
};

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('sort_order');
    if (data) setItems(data as Testimonial[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    if (editing.id) {
      await supabase.from('testimonials').update(editing).eq('id', editing.id);
    } else {
      const maxOrder = items.reduce((m, t) => Math.max(m, t.sort_order), 0);
      await supabase.from('testimonials').insert({ ...editing, sort_order: maxOrder + 1 });
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    load();
  };

  const togglePublished = async (t: Testimonial) => {
    await supabase.from('testimonials').update({ published: !t.published }).eq('id', t.id);
    load();
  };

  if (loading) return <div className="animate-pulse text-surface-400">Loading…</div>;

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500';
  const labelCls = 'block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300';

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Testimonials</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage client and colleague endorsements</p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 shadow-md shadow-primary-500/20"
        >
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: items.length },
          { label: 'Published', value: items.filter(t => t.published).length },
          { label: 'Hidden', value: items.filter(t => !t.published).length },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 text-center">
            <div className="text-2xl font-bold gradient-text">{s.value}</div>
            <div className="text-xs text-surface-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-20 text-surface-400 bg-white dark:bg-surface-800 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>No testimonials yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(t => (
            <div
              key={t.id}
              className={`bg-white dark:bg-surface-800 rounded-2xl border transition-all ${
                t.published
                  ? 'border-surface-200 dark:border-surface-700'
                  : 'border-dashed border-surface-300 dark:border-surface-600 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                <GripVertical size={16} className="text-surface-300 shrink-0 cursor-grab" />

                {/* Avatar */}
                <div className="shrink-0">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-surface-200 dark:ring-surface-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-lg">
                      {t.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{t.name}</span>
                    {!t.published && (
                      <span className="px-2 py-0.5 rounded-md text-xs bg-surface-100 dark:bg-surface-700 text-surface-500">Hidden</span>
                    )}
                  </div>
                  <div className="text-xs text-surface-500">{t.role} {t.company && `@ ${t.company}`}</div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-1">{t.content}</p>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 shrink-0">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-amber-400 fill-amber-400" />)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePublished(t)}
                    title={t.published ? 'Hide' : 'Publish'}
                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  >
                    {t.published ? <Eye size={16} className="text-accent-600" /> : <EyeOff size={16} className="text-surface-400" />}
                  </button>
                  <button
                    onClick={() => setEditing({ ...t })}
                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-lg my-12 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing.id ? 'Edit Testimonial' : 'New Testimonial'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar */}
              <ImageUpload
                value={editing.avatar_url || ''}
                onChange={url => setEditing(p => p ? { ...p, avatar_url: url } : p)}
                folder="avatars"
                label="Avatar Photo"
                aspectClass="aspect-square max-w-[160px]"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name</label>
                  <input value={editing.name || ''} onChange={e => setEditing(p => p ? { ...p, name: e.target.value } : p)} className={inputCls} placeholder="Full name" />
                </div>
                <div>
                  <label className={labelCls}>Company</label>
                  <input value={editing.company || ''} onChange={e => setEditing(p => p ? { ...p, company: e.target.value } : p)} className={inputCls} placeholder="Company" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Role / Position</label>
                <input value={editing.role || ''} onChange={e => setEditing(p => p ? { ...p, role: e.target.value } : p)} className={inputCls} placeholder="e.g. CTO, Product Manager" />
              </div>

              <div>
                <label className={labelCls}>Testimonial</label>
                <textarea
                  value={editing.content || ''}
                  onChange={e => setEditing(p => p ? { ...p, content: e.target.value } : p)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="What did they say about working with you?"
                />
              </div>

              <div>
                <label className={labelCls}>Sort Order</label>
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={e => setEditing(p => p ? { ...p, sort_order: parseInt(e.target.value) || 0 } : p)}
                  className={`${inputCls} w-32`}
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editing.published}
                  onChange={e => setEditing(p => p ? { ...p, published: e.target.checked } : p)}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                Published (visible on site)
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Testimonial'}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-6 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
