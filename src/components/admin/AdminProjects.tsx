import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import { Plus, Pencil, Trash2, X, ExternalLink } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

const emptyProject: Partial<Project> = {
  title: '', slug: '', description: '', full_description: '', image_url: '', tech_stack: [], category: 'fullstack', demo_url: '', github_url: '', featured: false, case_study: false, case_problem: '', case_approach: '', case_result: '', published: true,
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState('');

  const load = async () => {
    const { data } = await supabase.from('projects').select('*').order('sort_order');
    if (data) setProjects(data as Project[]);
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
      tech_stack: editing.tech_stack || [],
    };

    if (editing.id) {
      await supabase.from('projects').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('projects').insert(payload);
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await supabase.from('projects').delete().eq('id', id);
    load();
  };

  const addTech = () => {
    if (!techInput.trim()) return;
    setEditing(prev => prev ? { ...prev, tech_stack: [...(prev.tech_stack || []), techInput.trim()] } : prev);
    setTechInput('');
  };

  const removeTech = (idx: number) => {
    setEditing(prev => prev ? { ...prev, tech_stack: (prev.tech_stack || []).filter((_, i) => i !== idx) } : prev);
  };

  if (loading) return <div className="animate-pulse text-surface-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={() => setEditing({ ...emptyProject })} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium gradient-bg text-white hover:opacity-90">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {projects.map(p => (
          <div key={p.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 flex items-center gap-4">
            <img src={p.image_url} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.title}</div>
              <div className="text-xs text-surface-500 flex items-center gap-2">
                <span>{p.category}</span>
                {p.published && <span className="text-accent-600">Published</span>}
                {p.featured && <span className="text-primary-600">Featured</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing({ ...p })} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing.id ? 'Edit Project' : 'New Project'}</h2>
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
                <label className="block text-sm font-medium mb-1">Short Description</label>
                <textarea value={editing.description || ''} onChange={e => setEditing(p => p ? { ...p, description: e.target.value } : p)} rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Full Description</label>
                <textarea value={editing.full_description || ''} onChange={e => setEditing(p => p ? { ...p, full_description: e.target.value } : p)} rows={4} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                <ImageUpload
                  value={editing.image_url || ''}
                  onChange={url => setEditing(p => p ? { ...p, image_url: url } : p)}
                  folder="projects"
                  label="Project Image"
                  aspectClass="aspect-video"
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={editing.category || 'fullstack'} onChange={e => setEditing(p => p ? { ...p, category: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="fullstack">Full Stack</option>
                    <option value="frontend">Frontend</option>
                    <option value="ai">AI / ML</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Demo URL</label>
                  <input value={editing.demo_url || ''} onChange={e => setEditing(p => p ? { ...p, demo_url: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GitHub URL</label>
                  <input value={editing.github_url || ''} onChange={e => setEditing(p => p ? { ...p, github_url: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://github.com/..." />
                </div>
              </div>

              {/* Tech stack */}
              <div>
                <label className="block text-sm font-medium mb-1">Tech Stack</label>
                <div className="flex gap-2 mb-2">
                  {(editing.tech_stack || []).map((tech, i) => (
                    <span key={i} className="px-2 py-1 rounded-md text-xs bg-surface-100 dark:bg-surface-700 flex items-center gap-1">
                      {tech}
                      <button onClick={() => removeTech(i)} className="text-surface-400 hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())} className="flex-1 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Add technology..." />
                  <button onClick={addTech} className="px-3 py-2 rounded-lg text-sm bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600">Add</button>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'published', label: 'Published' },
                  { key: 'featured', label: 'Featured' },
                  { key: 'case_study', label: 'Case Study' },
                ].map(toggle => (
                  <label key={toggle.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!(editing as any)[toggle.key]}
                      onChange={e => setEditing(p => p ? { ...p, [toggle.key]: e.target.checked } : p)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    {toggle.label}
                  </label>
                ))}
              </div>

              {/* Case study fields */}
              {editing.case_study && (
                <div className="space-y-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                  <div>
                    <label className="block text-sm font-medium mb-1">Problem</label>
                    <textarea value={editing.case_problem || ''} onChange={e => setEditing(p => p ? { ...p, case_problem: e.target.value } : p)} rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Approach</label>
                    <textarea value={editing.case_approach || ''} onChange={e => setEditing(p => p ? { ...p, case_approach: e.target.value } : p)} rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Result</label>
                    <textarea value={editing.case_result || ''} onChange={e => setEditing(p => p ? { ...p, case_result: e.target.value } : p)} rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
                <button onClick={() => setEditing(null)} className="px-6 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
