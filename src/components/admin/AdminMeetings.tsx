import { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, Users, Video, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import type { Meeting } from '@/types';
import { getAllMeetings, completeMeeting, getMeetingById } from '@/lib/crm';
import ScheduleMeetingModal from './ScheduleMeetingModal';

export default function AdminMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    const data = await getAllMeetings();
    setMeetings(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id: string) => {
    await completeMeeting(id);
    load();
  };

  const filtered = meetings.filter(m => filter === 'all' || m.status === filter);

  const statusColor = (status: string) =>
    status === 'scheduled' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
    : status === 'completed' ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'scheduled', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-surface-400 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          No meetings {filter !== 'all' ? `with status "${filter}"` : ''} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{m.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(m.status)}`}>
                  {m.status}
                </span>
              </div>
              {m.agenda && <p className="text-sm text-surface-500 mb-3 line-clamp-2">{m.agenda}</p>}
              <div className="space-y-1.5 text-sm text-surface-500">
                <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(m.meeting_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="flex items-center gap-2"><Clock size={14} /> {m.meeting_time} · {m.duration} min</div>
                <div className="flex items-center gap-2"><Users size={14} /> {m.meeting_type === 'one_on_one' ? 'One-to-One' : 'Group'}</div>
              </div>
              <div className="flex gap-3 mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
                <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  <ExternalLink size={12} /> Open meeting
                </a>
                {m.status === 'scheduled' && (
                  <button onClick={() => handleComplete(m.id)} className="flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400 hover:underline">
                    <CheckCircle2 size={12} /> Mark completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleMeetingModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => { load(); setShowModal(false); }}
      />
    </div>
  );
}
