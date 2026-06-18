import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, ExperienceEntry, EducationEntry } from '@/types';
import {
  Plus, Trash2, Save, Loader2, User, Briefcase, GraduationCap,
  Trophy, Upload, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

const EMPTY_EXP: ExperienceEntry = { company: '', role: '', period: '', description: '' };
const EMPTY_EDU: EducationEntry = { institution: '', degree: '', year: '' };

type Tab = 'hero' | 'experience' | 'education' | 'achievements';

export default function AdminProfile() {
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>('hero');
  const [achInput, setAchInput] = useState('');
  const resumeRef = useRef<HTMLInputElement>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data || {
          name: '', role: '', tagline: '', bio: '', photo_url: '',
          resume_url: '', linkedin_url: '', github_url: '', email: '',
          calendly_url: '', education: [], experience: [], achievements: [],
        });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    if (profile.id) {
      await supabase.from('profiles').update(profile).eq('id', profile.id);
    } else {
      const { data } = await supabase.from('profiles').insert(profile).select().single();
      if (data) setProfile(data);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const uploadResume = async (file: File) => {
    setResumeUploading(true);
    const ext = file.name.split('.').pop();
    const path = `resumes/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false });
    if (!error) {
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setProfile(p => p ? { ...p, resume_url: data.publicUrl } : p);
    }
    setResumeUploading(false);
  };

  const set = (field: keyof Profile, value: unknown) =>
    setProfile(p => p ? { ...p, [field]: value } : p);

  /* ── Experience helpers ── */
  const expList = (profile?.experience as ExperienceEntry[]) || [];
  const addExp = () => set('experience', [...expList, { ...EMPTY_EXP }]);
  const updateExp = (i: number, patch: Partial<ExperienceEntry>) => {
    const next = expList.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set('experience', next);
  };
  const removeExp = (i: number) => set('experience', expList.filter((_, idx) => idx !== i));
  const moveExp = (i: number, dir: -1 | 1) => {
    const arr = [...expList];
    const swap = i + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[i], arr[swap]] = [arr[swap], arr[i]];
    set('experience', arr);
  };

  /* ── Education helpers ── */
  const eduList = (profile?.education as EducationEntry[]) || [];
  const addEdu = () => set('education', [...eduList, { ...EMPTY_EDU }]);
  const updateEdu = (i: number, patch: Partial<EducationEntry>) => {
    const next = eduList.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set('education', next);
  };
  const removeEdu = (i: number) => set('education', eduList.filter((_, idx) => idx !== i));

  /* ── Achievements helpers ── */
  const achList = (profile?.achievements as string[]) || [];
  const addAch = () => {
    if (!achInput.trim()) return;
    set('achievements', [...achList, achInput.trim()]);
    setAchInput('');
  };
  const removeAch = (i: number) => set('achievements', achList.filter((_, idx) => idx !== i));
  const updateAch = (i: number, val: string) =>
    set('achievements', achList.map((a, idx) => (idx === i ? val : a)));

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-surface-400">
      <Loader2 size={28} className="animate-spin" />
    </div>
  );

  const tabs: { key: Tab; icon: React.ElementType; label: string }[] = [
    { key: 'hero', icon: User, label: 'Hero & Profile' },
    { key: 'experience', icon: Briefcase, label: 'Experience' },
    { key: 'education', icon: GraduationCap, label: 'Education' },
    { key: 'achievements', icon: Trophy, label: 'Achievements' },
  ];

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-shadow';
  const labelCls = 'block text-sm font-medium mb-1 text-surface-700 dark:text-surface-300';

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage your hero section, bio, and personal details</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity shadow-md shadow-primary-500/20"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-300 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <t.icon size={16} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ────────────── TAB: HERO & PROFILE ────────────── */}
      {tab === 'hero' && (
        <div className="space-y-6">
          {/* Profile photo */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
            <h2 className="font-semibold mb-4">Profile Photo</h2>
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                {profile?.photo_url ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-surface-200 dark:border-surface-700">
                    <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => set('photo_url', '')}
                      className="absolute top-1 right-1 p-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-surface-100 dark:bg-surface-900 border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center">
                    <User size={32} className="text-surface-300 dark:text-surface-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <ImageUpload
                  value={profile?.photo_url || ''}
                  onChange={url => set('photo_url', url)}
                  folder="photos"
                  label="Upload Photo"
                  aspectClass="aspect-square max-w-xs"
                />
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 space-y-4">
            <h2 className="font-semibold">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input value={profile?.name || ''} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Your name" />
              </div>
              <div>
                <label className={labelCls}>Role / Title</label>
                <input value={profile?.role || ''} onChange={e => set('role', e.target.value)} className={inputCls} placeholder="e.g. Full Stack Developer" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input value={profile?.tagline || ''} onChange={e => set('tagline', e.target.value)} className={inputCls} placeholder="Short hero tagline shown below role" />
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea value={profile?.bio || ''} onChange={e => set('bio', e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="About you (shown on About section)" />
            </div>
          </div>

          {/* Links */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 space-y-4">
            <h2 className="font-semibold">Links & Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'email', label: 'Email', placeholder: 'you@example.com' },
                { key: 'linkedin_url', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
                { key: 'github_url', label: 'GitHub URL', placeholder: 'https://github.com/...' },
                { key: 'calendly_url', label: 'Calendly URL', placeholder: 'https://calendly.com/...' },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input
                    value={(profile as any)?.[f.key] || ''}
                    onChange={e => set(f.key as keyof Profile, e.target.value)}
                    className={inputCls}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Resume */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 space-y-4">
            <h2 className="font-semibold">Resume / CV</h2>
            {profile?.resume_url ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                <div className="flex-1 text-sm text-accent-700 dark:text-accent-300 truncate">{profile.resume_url}</div>
                <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-xs text-accent-600 dark:text-accent-400 underline shrink-0">Preview</a>
                <button onClick={() => set('resume_url', '')} className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"><X size={14} /></button>
              </div>
            ) : (
              <p className="text-sm text-surface-400">No resume uploaded yet.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => resumeRef.current?.click()}
                disabled={resumeUploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium hover:border-primary-400 dark:hover:border-primary-500 transition-colors disabled:opacity-50"
              >
                {resumeUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload PDF
              </button>
              <div className="flex-1">
                <label className="block text-xs text-surface-500 mb-1">Or paste a URL</label>
                <input
                  value={profile?.resume_url || ''}
                  onChange={e => set('resume_url', e.target.value)}
                  className={inputCls}
                  placeholder="https://..."
                />
              </div>
            </div>
            <input ref={resumeRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadResume(f); }} />
          </div>
        </div>
      )}

      {/* ────────────── TAB: EXPERIENCE ────────────── */}
      {tab === 'experience' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">Listed chronologically (drag to reorder)</p>
            <button onClick={addExp} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 shadow-md shadow-primary-500/20">
              <Plus size={16} /> Add Experience
            </button>
          </div>

          {expList.length === 0 && (
            <div className="text-center py-16 text-surface-400 bg-white dark:bg-surface-800 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700">
              <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
              <p>No experience entries yet</p>
            </div>
          )}

          {expList.map((exp, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{exp.company || `Experience ${i + 1}`}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveExp(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 transition-colors"><ChevronUp size={14} /></button>
                  <button onClick={() => moveExp(i, 1)} disabled={i === expList.length - 1} className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 transition-colors"><ChevronDown size={14} /></button>
                  <button onClick={() => removeExp(i)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Company</label>
                    <input value={exp.company} onChange={e => updateExp(i, { company: e.target.value })} className={inputCls} placeholder="Company name" />
                  </div>
                  <div>
                    <label className={labelCls}>Role / Position</label>
                    <input value={exp.role} onChange={e => updateExp(i, { role: e.target.value })} className={inputCls} placeholder="e.g. Senior Developer" />
                  </div>
                  <div>
                    <label className={labelCls}>Period</label>
                    <input value={exp.period} onChange={e => updateExp(i, { period: e.target.value })} className={inputCls} placeholder="e.g. 2021 – Present" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea value={exp.description} onChange={e => updateExp(i, { description: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="Key responsibilities and achievements..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ────────────── TAB: EDUCATION ────────────── */}
      {tab === 'education' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">Add your educational background</p>
            <button onClick={addEdu} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 shadow-md shadow-primary-500/20">
              <Plus size={16} /> Add Education
            </button>
          </div>

          {eduList.length === 0 && (
            <div className="text-center py-16 text-surface-400 bg-white dark:bg-surface-800 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700">
              <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
              <p>No education entries yet</p>
            </div>
          )}

          {eduList.map((edu, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{edu.institution || `Education ${i + 1}`}</span>
                <button onClick={() => removeEdu(i)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Institution</label>
                    <input value={edu.institution} onChange={e => updateEdu(i, { institution: e.target.value })} className={inputCls} placeholder="University / School" />
                  </div>
                  <div>
                    <label className={labelCls}>Degree / Field</label>
                    <input value={edu.degree} onChange={e => updateEdu(i, { degree: e.target.value })} className={inputCls} placeholder="e.g. B.Sc. Computer Science" />
                  </div>
                  <div>
                    <label className={labelCls}>Year</label>
                    <input value={edu.year} onChange={e => updateEdu(i, { year: e.target.value })} className={inputCls} placeholder="e.g. 2016 – 2020" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ────────────── TAB: ACHIEVEMENTS ────────────── */}
      {tab === 'achievements' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 space-y-4">
            <h2 className="font-semibold">Achievements & Certifications</h2>
            <p className="text-sm text-surface-500">Add awards, certifications, notable milestones, or press mentions.</p>

            {/* Add new */}
            <div className="flex gap-2">
              <input
                value={achInput}
                onChange={e => setAchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAch())}
                className={`${inputCls} flex-1`}
                placeholder="e.g. AWS Certified Solutions Architect"
              />
              <button onClick={addAch} className="px-4 py-2 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 shrink-0">
                <Plus size={16} />
              </button>
            </div>

            {/* List */}
            {achList.length === 0 ? (
              <div className="text-center py-12 text-surface-400 bg-surface-50 dark:bg-surface-900 rounded-xl border border-dashed border-surface-300 dark:border-surface-700">
                <Trophy size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No achievements yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {achList.map((ach, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 group">
                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      value={ach}
                      onChange={e => updateAch(i, e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none text-surface-800 dark:text-surface-200"
                    />
                    <button onClick={() => removeAch(i)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="mt-8 pt-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
        <p className="text-xs text-surface-400">All changes are saved to your live portfolio</p>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 shadow-md shadow-primary-500/20"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
