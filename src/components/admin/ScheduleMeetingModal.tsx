import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, Trash2, Video } from 'lucide-react';
import { scheduleMeeting } from '@/lib/crm';
import { Meeting } from '@/types';

interface Props {
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Participant {
  email: string;
  name: string;
}

export default function ScheduleMeetingModal({ leadId, leadName, leadEmail, open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [meetingType, setMeetingType] = useState<'one_on_one' | 'group'>('one_on_one');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [participants, setParticipants] = useState<Participant[]>(
    leadEmail ? [{ email: leadEmail, name: leadName || '' }] : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addParticipant = () => setParticipants(p => [...p, { email: '', name: '' }]);
  const removeParticipant = (i: number) => setParticipants(p => p.filter((_, idx) => idx !== i));
  const updateParticipant = (i: number, field: keyof Participant, value: string) =>
    setParticipants(p => p.map((part, idx) => (idx === i ? { ...part, [field]: value } : part)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
      setError('Title, date, and time are required.');
      return;
    }
    const validParticipants = participants.filter(p => p.email.trim());
    if (validParticipants.length === 0) {
      setError('At least one participant is required.');
      return;
    }

    setSaving(true);
    setError('');
    const res = await scheduleMeeting({
      lead_id: leadId,
      title,
      agenda,
      meeting_type: meetingType,
      meeting_date: date,
      meeting_time: time,
      duration,
      participants: validParticipants.map(p => ({ email: p.email.trim(), name: p.name.trim() || undefined })),
    });
    setSaving(false);

    if (res.ok) {
      onCreated();
      handleClose();
    } else {
      setError(res.error || 'Could not schedule meeting.');
    }
  };

  const handleClose = () => {
    setTitle('');
    setAgenda('');
    setMeetingType('one_on_one');
    setDate('');
    setTime('');
    setDuration(30);
    setParticipants(leadEmail ? [{ email: leadEmail, name: leadName || '' }] : []);
    setError('');
    onClose();
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium mb-1";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700 sticky top-0 bg-white dark:bg-surface-800 z-10">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary-600" size={20} />
                <h2 className="text-lg font-bold">Schedule Meeting</h2>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelClass}>Meeting Title *</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Project Discovery Call" />
              </div>

              <div>
                <label className={labelClass}>Agenda</label>
                <textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="What will be discussed?" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Date *</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Time *</label>
                  <input type="time" required value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputClass}>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Meeting Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingType('one_on_one')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      meetingType === 'one_on_one'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-surface-200 dark:border-surface-700 text-surface-500'
                    }`}
                  >
                    One-to-One
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingType('group')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      meetingType === 'group'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-surface-200 dark:border-surface-700 text-surface-500'
                    }`}
                  >
                    Group
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Participants</label>
                  <button type="button" onClick={addParticipant} className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700">
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {participants.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={e => updateParticipant(i, 'name', e.target.value)}
                        className={`${inputClass} flex-1`}
                        placeholder="Name"
                      />
                      <input
                        type="email"
                        value={p.email}
                        onChange={e => updateParticipant(i, 'email', e.target.value)}
                        className={`${inputClass} flex-1`}
                        placeholder="Email"
                      />
                      <button type="button" onClick={() => removeParticipant(i)} className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  <Video size={16} />
                  {saving ? 'Scheduling...' : 'Create Meeting'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
