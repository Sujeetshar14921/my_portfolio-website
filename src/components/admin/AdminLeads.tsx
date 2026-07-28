import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Phone, Building2, DollarSign, Briefcase,
  CheckCircle2, Clock, Calendar, Video, FileText, Send, X, Trash2, AlertCircle,
  History, Video as VideoIcon, Mail as MailIcon, Activity as ActivityIcon,
} from 'lucide-react';
import type { ContactSubmission, LeadStatus, Meeting, ActivityLog } from '@/types';
import {
  getAllLeads, updateLeadStatus, updateLeadNotes, updateLeadField,
  resendVerificationEmail, getMeetingsForLead, getActivityForLead,
  sendProposal, sendFollowUp, completeMeeting, deleteLead,
} from '@/lib/crm';
import ScheduleMeetingModal from './ScheduleMeetingModal';

const statusColors: Record<string, string> = {
  pending_verification: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  verified: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  contacted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  meeting_scheduled: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  meeting_completed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  proposal_sent: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  won: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
  lost: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
};

const meetingStatusColors: Record<string, string> = {
  scheduled: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  completed: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  none: 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400',
};

const PIPELINE: LeadStatus[] = [
  'pending_verification', 'verified', 'new', 'contacted',
  'meeting_scheduled', 'meeting_completed', 'proposal_sent', 'won', 'lost',
];

const activityIcons: Record<string, typeof ActivityIcon> = {
  lead_created: MessageSquare,
  email_sent: Mail,
  verification: CheckCircle2,
  status_change: ActivityIcon,
  meeting_scheduled: Calendar,
  meeting_completed: VideoIcon,
  note_added: FileText,
  proposal_sent: FileText,
  follow_up_sent: Send,
};

type Tab = 'details' | 'meetings' | 'timeline' | 'emails';

export default function AdminLeads() {
  const [leads, setLeads] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactSubmission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const data = await getAllLeads();
    setLeads(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectLead = async (lead: ContactSubmission) => {
    setSelected(lead);
    setNotes(lead.notes);
    setActiveTab('details');
    const [m, a] = await Promise.all([
      getMeetingsForLead(lead.id),
      getActivityForLead(lead.id),
    ]);
    setMeetings(m);
    setActivity(a);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (status: LeadStatus) => {
    if (!selected) return;
    await updateLeadStatus(selected.id, status);
    setSelected({ ...selected, status });
    load();
    const a = await getActivityForLead(selected.id);
    setActivity(a);
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    await updateLeadNotes(selected.id, notes);
    showToast('Notes saved');
    load();
  };

  const handleSaveField = async (field: string, value: string) => {
    if (!selected) return;
    await updateLeadField(selected.id, field, value);
    setSelected({ ...selected, [field]: value });
    showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
  };

  const handleResendVerification = async () => {
    if (!selected) return;
    setResending(true);
    const res = await resendVerificationEmail(selected.id);
    setResending(false);
    if (res.ok) {
      showToast('Verification email sent');
      const a = await getActivityForLead(selected.id);
      setActivity(a);
    } else {
      showToast(res.error || 'Could not send verification email');
    }
  };

  const handleMeetingCreated = async () => {
    showToast('Meeting scheduled — invitation email sent');
    if (selected) {
      const [m, a, refreshed] = await Promise.all([
        getMeetingsForLead(selected.id),
        getActivityForLead(selected.id),
        getAllLeads(),
      ]);
      setMeetings(m);
      setActivity(a);
      setLeads(refreshed);
      const updated = refreshed.find(l => l.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  const handleCompleteMeeting = async (meetingId: string) => {
    await completeMeeting(meetingId);
    showToast('Meeting marked as completed');
    if (selected) {
      const [m, a, refreshed] = await Promise.all([
        getMeetingsForLead(selected.id),
        getActivityForLead(selected.id),
        getAllLeads(),
      ]);
      setMeetings(m);
      setActivity(a);
      setLeads(refreshed);
      const updated = refreshed.find(l => l.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteLead(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      setLeads(prev => prev.filter(l => l.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      showToast('Lead deleted');
      setDeleteTarget(null);
    } else {
      showToast('Could not delete lead');
    }
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
              onClick={() => selectLead(lead)}
              className={`bg-white dark:bg-surface-800 rounded-xl p-4 border cursor-pointer transition-colors ${
                selected?.id === lead.id
                  ? 'border-primary-400 dark:border-primary-600'
                  : 'border-surface-200 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lead.name}</span>
                    {lead.email_verified ? (
                      <span className="flex items-center gap-0.5 text-xs text-accent-600 dark:text-accent-400">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-surface-500 truncate">{lead.email}</div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">{lead.message}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(lead); }}
                    title="Delete lead"
                    className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="text-right space-y-1.5">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium block ${statusColors[lead.status] || statusColors.new}`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                    {lead.meeting_status !== 'none' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium block ${meetingStatusColors[lead.meeting_status]}`}>
                        {lead.meeting_status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-surface-400 mt-2">
                {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>

        {/* Lead detail panel */}
        <div>
          {selected ? (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 sticky top-6">
              {/* Header */}
              <div className="p-5 border-b border-surface-200 dark:border-surface-700">
                <h3 className="font-semibold mb-1">{selected.name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  {selected.email_verified ? (
                    <span className="flex items-center gap-1 text-accent-600 dark:text-accent-400 text-xs">
                      <CheckCircle2 size={14} /> Email Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
                      <Clock size={14} /> Pending Verification
                    </span>
                  )}
                  <span className="text-surface-400">·</span>
                  <span className="text-surface-500 text-xs">{selected.inquiry_type === 'recruiter' ? 'Recruiter' : 'Client'}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-surface-200 dark:border-surface-700 px-3">
                {([
                  { id: 'details', label: 'Details', icon: MessageSquare },
                  { id: 'meetings', label: 'Meetings', icon: Video },
                  { id: 'timeline', label: 'Timeline', icon: History },
                  { id: 'emails', label: 'Emails', icon: MailIcon },
                ] as { id: Tab; label: string; icon: typeof MailIcon }[]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {activeTab === 'details' && (
                  <DetailsTab
                    lead={selected}
                    notes={notes}
                    setNotes={setNotes}
                    onSaveNotes={handleSaveNotes}
                    onSaveField={handleSaveField}
                    onStatusChange={handleStatusChange}
                    onResendVerification={handleResendVerification}
                    resending={resending}
                    onScheduleMeeting={() => setShowMeetingModal(true)}
                    onSendProposal={() => setShowProposalModal(true)}
                    onSendFollowup={() => setShowFollowupModal(true)}
                  />
                )}

                {activeTab === 'meetings' && (
                  <MeetingsTab
                    meetings={meetings}
                    onScheduleMeeting={() => setShowMeetingModal(true)}
                    onCompleteMeeting={handleCompleteMeeting}
                  />
                )}

                {activeTab === 'timeline' && (
                  <TimelineTab activity={activity} />
                )}

                {activeTab === 'emails' && (
                  <EmailsTab activity={activity} />
                )}
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

      {/* Modals */}
      <ScheduleMeetingModal
        leadId={selected?.id}
        leadName={selected?.name}
        leadEmail={selected?.email}
        open={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onCreated={handleMeetingCreated}
      />
      <ProposalModal
        open={showProposalModal}
        leadName={selected?.name}
        onClose={() => setShowProposalModal(false)}
        onSent={() => { showToast('Proposal sent'); setShowProposalModal(false); load(); }}
        leadId={selected?.id}
      />
      <FollowupModal
        open={showFollowupModal}
        leadName={selected?.name}
        onClose={() => setShowFollowupModal(false)}
        onSent={() => { showToast('Follow-up sent'); setShowFollowupModal(false); load(); }}
        leadId={selected?.id}
      />

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 max-w-sm w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                <h2 className="text-lg font-bold">Delete Lead?</h2>
              </div>
              <p className="text-sm text-surface-500 mb-6">
                This will permanently delete <strong>{deleteTarget.name}</strong> and all related activity. Meetings will be kept but unlinked from this lead. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLead}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-sm font-medium shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== Details Tab =================== */

function DetailsTab({
  lead, notes, setNotes, onSaveNotes, onSaveField, onStatusChange,
  onResendVerification, resending, onScheduleMeeting, onSendProposal, onSendFollowup,
}: {
  lead: ContactSubmission;
  notes: string;
  setNotes: (v: string) => void;
  onSaveNotes: () => void;
  onSaveField: (field: string, value: string) => void;
  onStatusChange: (s: LeadStatus) => void;
  onResendVerification: () => void;
  resending: boolean;
  onScheduleMeeting: () => void;
  onSendProposal: () => void;
  onSendFollowup: () => void;
}) {
  return (
    <div className="space-y-5 text-sm">
      {/* Contact info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-surface-400" />
          <a href={`mailto:${lead.email}`} className="text-primary-600 dark:text-primary-400">{lead.email}</a>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-surface-400" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.company && (
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-surface-400" />
            <span>{lead.company}</span>
          </div>
        )}
        {lead.budget && (
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-surface-400" />
            <span>{lead.budget}</span>
          </div>
        )}
        {lead.service && (
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-surface-400" />
            <span>{lead.service}</span>
          </div>
        )}
      </div>

      {/* Message */}
      <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
        <span className="text-surface-500 text-xs font-medium">Message</span>
        <p className="mt-1 text-surface-600 dark:text-surface-400 leading-relaxed text-sm">{lead.message}</p>
      </div>

      {/* Verification action */}
      {!lead.email_verified && (
        <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
          <button
            onClick={onResendVerification}
            disabled={resending}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
          >
            <Mail size={14} />
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      )}

      {/* Status pipeline */}
      <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
        <label className="block text-xs font-medium mb-2">Status</label>
        <div className="flex gap-1.5 flex-wrap">
          {PIPELINE.map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                lead.status === s ? statusColors[s] : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
        <label className="block text-xs font-medium mb-2">Quick Actions</label>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onScheduleMeeting} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
            <Video size={14} /> Schedule Meeting
          </button>
          <button onClick={onSendProposal} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/50 transition-colors">
            <FileText size={14} /> Send Proposal
          </button>
          <button onClick={onSendFollowup} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors">
            <Send size={14} /> Follow Up
          </button>
        </div>
      </div>

      {/* Editable fields */}
      <div className="pt-2 border-t border-surface-200 dark:border-surface-700 space-y-3">
        <EditableField label="Phone" value={lead.phone || ''} onSave={v => onSaveField('phone', v)} icon={<Phone size={14} />} />
        <EditableField label="Company" value={lead.company || ''} onSave={v => onSaveField('company', v)} icon={<Building2 size={14} />} />
        <EditableField label="Budget" value={lead.budget || ''} onSave={v => onSaveField('budget', v)} icon={<DollarSign size={14} />} />
        <EditableField label="Service" value={lead.service || ''} onSave={v => onSaveField('service', v)} icon={<Briefcase size={14} />} />
      </div>

      {/* Notes */}
      <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
        <label className="block text-xs font-medium mb-2">Internal Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Add notes about this lead..."
        />
        <button onClick={onSaveNotes} className="mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
          Save Notes
        </button>
      </div>
    </div>
  );
}

function EditableField({ label, value, onSave, icon }: { label: string; value: string; onSave: (v: string) => void; icon: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-surface-400">{icon}</span>
      {editing ? (
        <div className="flex-1 flex gap-1">
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            className="flex-1 px-2 py-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <button
            onClick={() => { onSave(val); setEditing(false); }}
            className="px-2 py-1 rounded-lg text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          >
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setVal(value); setEditing(true); }}
          className="flex-1 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-900 px-2 py-1 rounded-lg transition-colors"
        >
          <span className="text-surface-400 text-xs">{label}:</span>{' '}
          <span className={value ? '' : 'text-surface-400'}>{value || '— click to add'}</span>
        </button>
      )}
    </div>
  );
}

/* =================== Meetings Tab =================== */

function MeetingsTab({ meetings, onScheduleMeeting, onCompleteMeeting }: {
  meetings: Meeting[];
  onScheduleMeeting: () => void;
  onCompleteMeeting: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <button
        onClick={onScheduleMeeting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Video size={16} /> Schedule New Meeting
      </button>

      {meetings.length === 0 ? (
        <p className="text-center text-surface-400 text-sm py-6">No meetings scheduled yet.</p>
      ) : (
        meetings.map(m => (
          <div key={m.id} className="rounded-xl border border-surface-200 dark:border-surface-700 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{m.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meetingStatusColors[m.status]}`}>
                {m.status}
              </span>
            </div>
            <div className="text-xs text-surface-500 space-y-0.5">
              <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(m.meeting_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {m.meeting_time}</div>
              <div className="flex items-center gap-1.5"><Clock size={12} /> {m.duration} min · {m.meeting_type === 'one_on_one' ? 'One-to-One' : 'Group'}</div>
            </div>
            {m.agenda && <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">{m.agenda}</p>}
            <div className="flex gap-2 pt-1">
              <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                Open meeting page
              </a>
              {m.status === 'scheduled' && (
                <button onClick={() => onCompleteMeeting(m.id)} className="text-xs text-accent-600 dark:text-accent-400 hover:underline">
                  Mark completed
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* =================== Timeline Tab =================== */

function TimelineTab({ activity }: { activity: ActivityLog[] }) {
  if (activity.length === 0) {
    return <p className="text-center text-surface-400 text-sm py-6">No activity yet.</p>;
  }
  return (
    <div className="space-y-3">
      {activity.map(log => {
        const Icon = activityIcons[log.type] || ActivityIcon;
        return (
          <div key={log.id} className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
              <Icon size={14} className="text-surface-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{log.title}</p>
              {log.description && <p className="text-xs text-surface-500 mt-0.5">{log.description}</p>}
              <p className="text-xs text-surface-400 mt-0.5">
                {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =================== Emails Tab =================== */

function EmailsTab({ activity }: { activity: ActivityLog[] }) {
  const emails = activity.filter(a =>
    a.type === 'email_sent' || a.type === 'proposal_sent' || a.type === 'follow_up_sent' || a.type === 'verification'
  );
  if (emails.length === 0) {
    return <p className="text-center text-surface-400 text-sm py-6">No emails sent yet.</p>;
  }
  return (
    <div className="space-y-3">
      {emails.map(log => {
        const Icon = activityIcons[log.type] || Mail;
        return (
          <div key={log.id} className="rounded-xl border border-surface-200 dark:border-surface-700 p-3">
            <div className="flex items-center gap-2">
              <Icon size={14} className="text-primary-500" />
              <span className="text-sm font-medium">{log.title}</span>
            </div>
            {log.description && <p className="text-xs text-surface-500 mt-1">{log.description}</p>}
            <p className="text-xs text-surface-400 mt-1">
              {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* =================== Proposal Modal =================== */

function ProposalModal({ open, leadName, leadId, onClose, onSent }: {
  open: boolean;
  leadName?: string;
  leadId?: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !leadId) return;
    setSending(true);
    const res = await sendProposal(leadId, content);
    setSending(false);
    if (res.ok) {
      setContent('');
      onSent();
    } else {
      setError(res.error || 'Could not send proposal.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 max-w-lg w-full"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-bold">Send Proposal to {leadName}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Write your proposal here..."
                autoFocus
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Send size={16} />
                {sending ? 'Sending...' : 'Send Proposal'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =================== Follow-up Modal =================== */

function FollowupModal({ open, leadName, leadId, onClose, onSent }: {
  open: boolean;
  leadName?: string;
  leadId?: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !leadId) return;
    setSending(true);
    const res = await sendFollowUp(leadId, content);
    setSending(false);
    if (res.ok) {
      setContent('');
      onSent();
    } else {
      setError(res.error || 'Could not send follow-up.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 max-w-lg w-full"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-bold">Follow Up with {leadName}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Write your follow-up message..."
                autoFocus
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Send size={16} />
                {sending ? 'Sending...' : 'Send Follow-up'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}