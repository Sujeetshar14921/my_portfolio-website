import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Skill } from '@/types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const emptySkill: Partial<Skill> = {
  name: '', category: 'frontend', icon: '', proficiency: 80,
};

const categories = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'tools', label: 'Tools & DevOps' },
  { value: 'soft', label: 'Soft Skills' },
];

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Skill> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('skills').select('*').order('sort_order');
    if (data) setSkills(data as Skill[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    if (editing.id) {
      await supabase.from('skills').update(editing).eq('id', editing.id);
    } else {
      const maxOrder = skills.length > 0 ? Math.max(...skills.map(s => s.sort_order)) : 0;
      await supabase.from('skills').insert({ ...editing, sort_order: maxOrder + 1 });
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this skill?')) return;
    await supabase.from('skills').delete().eq('id', id);
    load();
  };

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  if (loading) return <div className="animate-pulse text-surface-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Skills</h1>
        <button onClick={() => setEditing({ ...emptySkill })} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium gradient-bg text-white hover:opacity-90">
          <Plus size={16} /> Add Skill
        </button>
      </div>

      {Object.entries(grouped).map(([category, catSkills]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 mb-3">
            {categories.find(c => c.value === category)?.label || category}
          </h3>
          <div className="space-y-2">
            {catSkills.map(s => (
              <div key={s.id} className="bg-white dark:bg-surface-800 rounded-xl p-3 border border-surface-200 dark:border-surface-700 flex items-center gap-3">
                <span className="text-lg">{s.icon}</span>
                <span className="flex-1 text-sm font-medium">{s.name}</span>
                <div className="w-24 h-1.5 rounded-full bg-surface-100 dark:bg-surface-700">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${s.proficiency}%` }} />
                </div>
                <span className="text-xs text-surface-500">{s.proficiency}%</span>
                <button onClick={() => setEditing({ ...s })} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing.id ? 'Edit Skill' : 'New Skill'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={editing.name || ''} onChange={e => setEditing(p => p ? { ...p, name: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={editing.category || 'frontend'} onChange={e => setEditing(p => p ? { ...p, category: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
                <input value={editing.icon || ''} onChange={e => setEditing(p => p ? { ...p, icon: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="⚛️" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Proficiency ({editing.proficiency || 80}%)</label>
                <input type="range" min={0} max={100} value={editing.proficiency || 80} onChange={e => setEditing(p => p ? { ...p, proficiency: parseInt(e.target.value) } : p)} className="w-full" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Skill'}
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
