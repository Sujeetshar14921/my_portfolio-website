import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ContactSubmission } from '@/types';
import { X, MessageSquare } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  in_progress: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  closed: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [notes, setNotes] = useState('');

  const load = async () => {
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data as ContactSubmission[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('contact_submissions').update({ status }).eq('id', id);
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: status as ContactSubmission['status'] } : null);
  };

  const updateNotes = async () => {
    if (!selected) return;
    await supabase.from('contact_submissions').update({ notes }).eq('id', selected.id);
    load();
  };

  const handleSelect = (lead: ContactSubmission) => {
    setSelected(lead);
    setNotes(lead.notes);
  };

  if (loading) return <div className="animate-pulse text-surface-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leads</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads list */}
        <div className="lg:col-span-2 space-y-3">
          {leads.length === 0 && (
            <div className="text-center py-12 text-surface-400 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
              No leads yet. They'll appear here when someone contacts you.
            </div>
          )}
          {leads.map(lead => (
            <div
              key={lead.id}
              onClick={() => handleSelect(lead)}
              className={`bg-white dark:bg-surface-800 rounded-xl p-4 border cursor-pointer transition-colors ${
                selected?.id === lead.id
                  ? 'border-primary-400 dark:border-primary-600'
                  : 'border-surface-200 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-surface-500 truncate">{lead.email}</div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-2">{lead.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status] || statusColors.new}`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                  <div className="text-xs text-surface-400 mt-2">
                    {lead.inquiry_type === 'recruiter' ? 'Recruiter' : 'Client'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-surface-400 mt-2">
                {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>

        {/* Lead detail */}
        <div>
          {selected ? (
            <div className="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700 sticky top-6">
              <h3 className="font-semibold mb-4">Lead Details</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-surface-500">Name:</span> <span className="font-medium">{selected.name}</span></div>
                <div><span className="text-surface-500">Email:</span> <a href={`mailto:${selected.email}`} className="text-primary-600">{selected.email}</a></div>
                <div><span className="text-surface-500">Type:</span> {selected.inquiry_type === 'recruiter' ? 'Recruiter' : 'Client'}</div>
                <div><span className="text-surface-500">Date:</span> {new Date(selected.created_at).toLocaleString()}</div>
                <div className="pt-2">
                  <span className="text-surface-500">Message:</span>
                  <p className="mt-1 text-surface-600 dark:text-surface-400 leading-relaxed">{selected.message}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-surface-200 dark:border-surface-700">
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="flex gap-2 flex-wrap">
                  {['new', 'contacted', 'in_progress', 'closed'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selected.status === s ? statusColors[s] : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-surface-200 dark:border-surface-700">
                <label className="block text-sm font-medium mb-2">Private Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Add notes about this lead..."
                />
                <button onClick={updateNotes} className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50">
                  Save Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700 text-center text-surface-400">
              <MessageSquare size={24} className="mx-auto mb-2" />
              Select a lead to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
