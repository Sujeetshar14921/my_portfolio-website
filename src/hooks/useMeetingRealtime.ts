import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Meeting, MeetingParticipant, MeetingChatMessage } from '@/types';

export function useMeetingRealtime(meetingId: string | undefined) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const callbacksRef = useRef<{
    onParticipantJoined?: (p: MeetingParticipant) => void;
    onParticipantLeft?: (p: MeetingParticipant) => void;
    onMeetingStatusChanged?: (m: Meeting) => void;
    onChatMessage?: (msg: MeetingChatMessage) => void;
  }>({});

  const load = useCallback(async () => {
    if (!meetingId) { setLoading(false); return; }
    const [m, p, c] = await Promise.all([
      supabase.from('meetings').select('*').eq('id', meetingId).maybeSingle(),
      supabase.from('meeting_participants').select('*').eq('meeting_id', meetingId).order('joined_at', { ascending: true }),
      supabase.from('meeting_chat_messages').select('*').eq('meeting_id', meetingId).order('created_at', { ascending: true }),
    ]);
    if (m.data) setMeeting(m.data as Meeting);
    if (p.data) setParticipants(p.data as MeetingParticipant[]);
    if (c.data) setChatMessages(c.data as MeetingChatMessage[]);
    setLoading(false);
  }, [meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!meetingId) return;

    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `id=eq.${meetingId}` },
        (payload) => {
          const m = payload.new as Meeting;
          setMeeting(m);
          callbacksRef.current.onMeetingStatusChanged?.(m);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_participants', filter: `meeting_id=eq.${meetingId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as MeetingParticipant;
            setParticipants(prev => [...prev, p]);
            callbacksRef.current.onParticipantJoined?.(p);
          } else if (payload.eventType === 'UPDATE') {
            const p = payload.new as MeetingParticipant;
            setParticipants(prev => {
              const existing = prev.find(x => x.id === p.id);
              if (!existing) return [...prev, p];
              if (!p.is_online && existing.is_online) {
                callbacksRef.current.onParticipantLeft?.(p);
              }
              return prev.map(x => x.id === p.id ? p : x);
            });
          } else if (payload.eventType === 'DELETE') {
            const p = payload.old as MeetingParticipant;
            setParticipants(prev => prev.filter(x => x.id !== p.id));
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meeting_chat_messages', filter: `meeting_id=eq.${meetingId}` },
        (payload) => {
          const msg = payload.new as MeetingChatMessage;
          setChatMessages(prev => [...prev, msg]);
          callbacksRef.current.onChatMessage?.(msg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId]);

  const setCallbacks = useCallback((cb: typeof callbacksRef.current) => {
    callbacksRef.current = { ...callbacksRef.current, ...cb };
  }, []);

  const refresh = useCallback(() => { load(); }, [load]);

  return { meeting, participants, chatMessages, loading, refresh, setCallbacks };
}
