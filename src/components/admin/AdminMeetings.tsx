import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Video, CheckCircle2, Plus, Video as VideoIcon, Radio, Hourglass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Meeting, MeetingLiveStatus } from '@/types';
import { getAllMeetings, completeMeeting } from '@/lib/crm';
import ScheduleMeetingModal from './ScheduleMeetingModal';

const statusConfig: Record<MeetingLiveStatus, { color: string; label: string; icon: typeof Radio }> = {
  scheduled: { color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300', label: 'Scheduled', icon: Calendar },
  waiting_for_host: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Waiting', icon: Hourglass },
  host_joined: { color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300', label: 'Host Joined', icon: Video },
  client_joined: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', label: 'Client Joined', icon: Users },
  in_progress: { color: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300', label: 'Live', icon: Radio },
  completed: { color: 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400', label: 'Completed', icon: CheckCircle2 },
  cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Cancelled', icon: Clock },
};

function normalizeTime(t: string): string {
  return t.split(':').slice(0, 2).join(':');
}

export default function AdminMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const data = await getAllMeetings();
    setMeetings(data);
    // Get online participant counts
    const counts: Record<string, number> = {};
    await Promise.all(data.map(async m => {
      const { count } = await supabase
        .from('meeting_participants')
        .select('id', { count: 'exact', head: true })
        .eq('meeting_id', m.id)
        .eq('is_online', true);
      counts[m.id] = count || 0;
    }));
    setOnlineCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Realtime: refresh when any meeting status changes
    const channel = supabase
      .channel('admin-meetings-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_participants' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const handleComplete = async (id: string) => {
    await completeMeeting(id);
    load();
  };

  const isLive = (s: MeetingLiveStatus) => ['waiting_for_host', 'host_joined', 'client_joined', 'in_progress'].includes(s);

  const filtered = meetings.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'live') return isLive(m.status);
    if (filter === 'scheduled') return m.status === 'scheduled';
    if (filter === 'completed') return m.status === 'completed';
    return true;
  });

  const liveCount = meetings.filter(m => isLive(m.status)).length;
  const waitingCount = meetings.filter(m => m.status === 'waiting_for_host').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          {(liveCount > 0 || waitingCount > 0) && (
            <div className="flex gap-3 mt-2">
              {waitingCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                  <Hourglass size={14} /> {waitingCount} waiting for host
                </span>
              )}
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-accent-600 dark:text-accent-400">
                  <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" /> {liveCount} live
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'all', label: 'All' },
          { id: 'live', label: `Live${liveCount > 0 ? ` (${liveCount})` : ''}` },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'completed', label: 'Completed' },
        ] as { id: typeof filter; label: string }[]).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-surface-400 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          No meetings{filter !== 'all' ? ` with filter "${filter}"` : ''} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(m => {
            const cfg = statusConfig[m.status] || statusConfig.scheduled;
            const StatusIcon = cfg.icon;
            return (
              <div key={m.id} className={`bg-white dark:bg-surface-800 rounded-xl p-5 border transition-colors ${
                isLive(m.status) ? 'border-accent-300 dark:border-accent-700' : 'border-surface-200 dark:border-surface-700'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold">{m.title}</h3>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    {isLive(m.status) && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    {StatusIcon && <StatusIcon size={10} />}
                    {cfg.label}
                  </span>
                </div>

                {m.agenda && <p className="text-sm text-surface-500 mb-3 line-clamp-2">{m.agenda}</p>}

                <div className="space-y-1.5 text-sm text-surface-500">
                  <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(m.meeting_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> {normalizeTime(m.meeting_time)} · {m.duration} min</div>
                  <div className="flex items-center gap-2"><Users size={14} /> {m.meeting_type === 'one_on_one' ? 'One-to-One' : 'Group'}</div>
                  {onlineCounts[m.id] > 0 && (
                    <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400">
                      <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" /> {onlineCounts[m.id]} participant(s) online
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
                  <Link
                    to={`/admin/meetings/${m.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <VideoIcon size={12} /> Open Meeting
                  </Link>
                  {m.status !== 'completed' && m.status !== 'cancelled' && (
                    <button onClick={() => handleComplete(m.id)} className="flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400 hover:underline">
                      <CheckCircle2 size={12} /> Mark completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
