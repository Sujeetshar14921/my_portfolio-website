import { supabase } from '@/lib/supabase';
import type { ContactSubmission, Meeting, MeetingNote, MeetingParticipant, ActivityLog, LeadStatus } from '@/types';

const CRM_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-api`;
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
});

async function crmApi(body: Record<string, unknown>) {
  const res = await fetch(CRM_API_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data as { error?: string }).error || 'Request failed' };
  return { ok: true, ...data };
}

/* ----------------------------- Leads ----------------------------- */

export async function getAllLeads(): Promise<ContactSubmission[]> {
  const { data } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as ContactSubmission[]) ?? [];
}

export async function getLeadById(id: string): Promise<ContactSubmission | null> {
  const { data } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data as ContactSubmission | null;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  const { error } = await supabase.from('contact_submissions').update({ status }).eq('id', id);
  if (!error) {
    await supabase.from('activity_logs').insert({
      lead_id: id,
      type: 'status_change',
      title: 'Status Changed',
      description: `Status updated to "${status.replace(/_/g, ' ')}"`,
    });
  }
  return !error;
}

export async function updateLeadNotes(id: string, notes: string): Promise<boolean> {
  const { error } = await supabase.from('contact_submissions').update({ notes }).eq('id', id);
  return !error;
}

export async function updateLeadField(id: string, field: string, value: string): Promise<boolean> {
  const { error } = await supabase.from('contact_submissions').update({ [field]: value }).eq('id', id);
  return !error;
}

export async function resendVerificationEmail(leadId: string): Promise<{ ok: boolean; error?: string }> {
  return crmApi({ action: 'send_lead_verification', lead_id: leadId });
}

export async function verifyLeadEmail(token: string): Promise<{ ok: boolean; message?: string; name?: string; error?: string }> {
  return crmApi({ action: 'verify_lead', token });
}

/* ----------------------------- Meetings ----------------------------- */

export async function getMeetingsForLead(leadId: string): Promise<Meeting[]> {
  const { data } = await supabase
    .from('meetings')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return (data as Meeting[]) ?? [];
}

export async function getAllMeetings(): Promise<Meeting[]> {
  const { data } = await supabase
    .from('meetings')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as Meeting[]) ?? [];
}

export async function getMeetingByToken(token: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .rpc('lookup_meeting_by_token', { p_token: token });
  if (error || !data || data.length === 0) return null;
  return data[0] as Meeting;
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const { data } = await supabase.from('meetings').select('*').eq('id', id).maybeSingle();
  return data as Meeting | null;
}

export async function scheduleMeeting(opts: {
  lead_id?: string;
  title: string;
  agenda: string;
  meeting_type: string;
  meeting_date: string;
  meeting_time: string;
  duration: number;
  participants: { email: string; name?: string }[];
}): Promise<{ ok: boolean; error?: string; meeting?: Meeting; emails_sent?: number; emails_failed?: number }> {
  return crmApi({ action: 'schedule_meeting', ...opts });
}

export async function completeMeeting(meetingId: string): Promise<{ ok: boolean; error?: string }> {
  return crmApi({ action: 'complete_meeting', meeting_id: meetingId });
}

export async function getMeetingIcs(meetingId: string): Promise<string | null> {
  const res = await crmApi({ action: 'get_ics', meeting_id: meetingId });
  return res.ok ? (res as { ics: string }).ics : null;
}

/* -------------------------- Meeting Notes -------------------------- */

export async function getMeetingNotes(meetingId: string): Promise<MeetingNote[]> {
  const { data } = await supabase
    .from('meeting_notes')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: false });
  return (data as MeetingNote[]) ?? [];
}

export async function addMeetingNote(meetingId: string, content: string): Promise<boolean> {
  const { error } = await supabase.from('meeting_notes').insert({ meeting_id: meetingId, content });
  if (!error) {
    const meeting = await getMeetingById(meetingId);
    await supabase.from('activity_logs').insert({
      meeting_id: meetingId,
      lead_id: meeting?.lead_id ?? null,
      type: 'note_added',
      title: 'Meeting Note Added',
      description: content.slice(0, 100),
    });
  }
  return !error;
}

/* ------------------------ Meeting Participants ------------------------ */

export async function getMeetingParticipants(meetingId: string): Promise<MeetingParticipant[]> {
  const { data } = await supabase
    .from('meeting_participants')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: false });
  return (data as MeetingParticipant[]) ?? [];
}

/* ----------------------------- Activity ----------------------------- */

export async function getActivityForLead(leadId: string): Promise<ActivityLog[]> {
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return (data as ActivityLog[]) ?? [];
}

export async function getActivityForMeeting(meetingId: string): Promise<ActivityLog[]> {
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: false });
  return (data as ActivityLog[]) ?? [];
}

/* --------------------------- Proposals & Follow-up --------------------------- */

export async function sendProposal(leadId: string, content: string): Promise<{ ok: boolean; error?: string; email_sent?: boolean }> {
  return crmApi({ action: 'send_proposal', lead_id: leadId, content });
}

export async function sendFollowUp(leadId: string, content: string): Promise<{ ok: boolean; error?: string; email_sent?: boolean }> {
  return crmApi({ action: 'send_followup', lead_id: leadId, content });
}

/* ----------------------------- Dashboard ----------------------------- */

export async function getLeadCounts(): Promise<{ total: number; pending: number; verified: number; new: number }> {
  const [total, pending, verified, newLeads] = await Promise.all([
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('email_verified', false),
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('email_verified', true),
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);
  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    verified: verified.count ?? 0,
    new: newLeads.count ?? 0,
  };
}

export async function getMeetingCounts(): Promise<{ total: number; scheduled: number; completed: number }> {
  const [total, scheduled, completed] = await Promise.all([
    supabase.from('meetings').select('id', { count: 'exact', head: true }),
    supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);
  return {
    total: total.count ?? 0,
    scheduled: scheduled.count ?? 0,
    completed: completed.count ?? 0,
  };
}
