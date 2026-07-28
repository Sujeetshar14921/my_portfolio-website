import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Calendar, Clock, Users, FileText, LogOut, ArrowLeft,
  AlertCircle, Loader2, Send, MessageCircle, UserCheck, PhoneOff,
  CheckCircle2, Crown, User as UserIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getMeetingById, updateMeetingStatus, joinMeetingAsParticipant,
  markParticipantOffline, endMeeting, getMeetingNotes, addMeetingNote,
  sendChatMessage, getChatMessages,
} from '@/lib/crm';
import type { Meeting, MeetingParticipant, MeetingChatMessage, MeetingNote, MeetingLiveStatus } from '@/types';
import { useProfile } from '@/lib/profile';

type Phase = 'loading' | 'lobby' | 'meeting' | 'ended' | 'notfound';

function normalizeTime(t: string): string {
  return t.split(':').slice(0, 2).join(':');
}

export default function AdminMeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [phase, setPhase] = useState<Phase>('loading');
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'notes'>('participants');
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [waitingClients, setWaitingClients] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const jitsiRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<unknown>(null);
  const phaseRef = useRef<Phase>('loading');
  const myParticipantRef = useRef<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { myParticipantRef.current = myParticipantId; }, [myParticipantId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Load meeting
  useEffect(() => {
    if (!meetingId) { setPhase('notfound'); return; }
    (async () => {
      const m = await getMeetingById(meetingId);
      if (!m) { setPhase('notfound'); return; }
      setMeeting(m);
      if (m.status === 'completed' || m.status === 'cancelled') {
        setPhase('ended');
      } else {
        setPhase('lobby');
      }
      const [n, p, c] = await Promise.all([
        getMeetingNotes(m.id),
        supabase.from('meeting_participants').select('*').eq('meeting_id', m.id).order('joined_at', { ascending: true }),
        getChatMessages(m.id),
      ]);
      setNotes(n);
      if (p.data) setParticipants(p.data as MeetingParticipant[]);
      setChatMessages(c);
    })();
  }, [meetingId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!meeting) return;

    const channel = supabase
      .channel(`admin-meeting-${meeting.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `id=eq.${meeting.id}` },
        (payload) => {
          const updated = payload.new as Meeting;
          setMeeting(updated);
          if (updated.status === 'completed' || updated.status === 'cancelled') {
            leaveJitsi();
            setPhase('ended');
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_participants', filter: `meeting_id=eq.${meeting.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as MeetingParticipant;
            setParticipants(prev => [...prev, p]);
            if (p.role === 'client' && p.is_online) {
              showNotification(`${p.name} joined the meeting`);
              setWaitingClients(c => c + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const p = payload.new as MeetingParticipant;
            setParticipants(prev => {
              const existing = prev.find(x => x.id === p.id);
              if (existing?.is_online && !p.is_online && p.role === 'client') {
                showNotification(`${p.name} left the meeting`);
              }
              return prev.map(x => x.id === p.id ? p : x);
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meeting_chat_messages', filter: `meeting_id=eq.${meeting.id}` },
        (payload) => {
          setChatMessages(prev => [...prev, payload.new as MeetingChatMessage]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meeting?.id]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const enterJitsi = useCallback(async (m: Meeting) => {
    setPhase('meeting');
    if (!window.JitsiMeetExternalAPI) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi'));
        document.body.appendChild(script);
      });
    }
    if (!jitsiRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const JitsiAPI = (window as any).JitsiMeetExternalAPI;
    jitsiApiRef.current = new JitsiAPI('meet.jit.si', {
      roomName: `sujeetsharma-${m.secure_token}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'shortcuts', 'tileview', 'videobackgroundblur', 'help', 'mute-everyone'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
      },
      userInfo: { displayName: profile?.name || 'Host' },
    });
  }, [profile?.name]);

  const leaveJitsi = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = jitsiApiRef.current as any;
    if (api?.dispose) { api.dispose(); jitsiApiRef.current = null; }
  }, []);

  const handleJoin = async () => {
    if (!meeting) return;
    const participant = await joinMeetingAsParticipant(meeting.id, profile?.name || 'Host', profile?.email || null, 'host');
    if (participant) setMyParticipantId(participant.id);

    // Update status: if client is waiting, go to in_progress; else host_joined
    const clientWaiting = participants.some(p => p.role === 'client' && p.is_online);
    const newStatus: MeetingLiveStatus = clientWaiting ? 'in_progress' : 'host_joined';
    await updateMeetingStatus(meeting.id, newStatus);

    enterJitsi(meeting);
  };

  const handleEndMeeting = async () => {
    if (!meeting) return;
    setEndingMeeting(true);
    leaveJitsi();
    if (myParticipantRef.current) {
      await markParticipantOffline(myParticipantRef.current);
    }
    const res = await endMeeting(meeting.id);
    setEndingMeeting(false);
    setShowEndConfirm(false);
    if (res.ok) {
      setPhase('ended');
    } else {
      showNotification(res.error || 'Could not end meeting');
    }
  };

  const handleLeave = async () => {
    leaveJitsi();
    if (myParticipantRef.current) {
      await markParticipantOffline(myParticipantRef.current);
    }
    navigate('/admin/meetings');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveJitsi();
      if (myParticipantRef.current) {
        markParticipantOffline(myParticipantRef.current);
      }
    };
  }, []);

  const handleSaveNote = async () => {
    if (!meeting || !noteInput.trim()) return;
    const ok = await addMeetingNote(meeting.id, noteInput.trim());
    if (ok) {
      const n = await getMeetingNotes(meeting.id);
      setNotes(n);
      setNoteInput('');
    }
  };

  const handleSendChat = async () => {
    if (!meeting || !chatInput.trim()) return;
    await sendChatMessage(meeting.id, profile?.name || 'Host', 'host', chatInput.trim());
    setChatInput('');
  };

  const onlineParticipants = participants.filter(p => p.is_online);
  const onlineClients = onlineParticipants.filter(p => p.role === 'client');

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  if (phase === 'notfound') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-xl font-bold mb-2">Meeting Not Found</h1>
          <Link to="/admin/meetings" className="inline-block px-6 py-3 rounded-xl gradient-bg text-white text-sm font-semibold">Back to Meetings</Link>
        </div>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-accent-600" size={32} />
            </div>
            <h1 className="text-xl font-bold mb-2">Meeting Ended</h1>
            <p className="text-surface-500 text-sm">Meeting summary has been sent to all participants.</p>
          </div>

          {meeting && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 space-y-3">
              <h3 className="font-semibold text-sm mb-3">Meeting Summary</h3>
              <div className="text-sm text-surface-500 space-y-2">
                <div className="flex justify-between"><span>Title</span><span className="font-medium text-surface-700 dark:text-surface-300">{meeting.title}</span></div>
                <div className="flex justify-between"><span>Date</span><span className="font-medium text-surface-700 dark:text-surface-300">{new Date(meeting.meeting_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Duration</span><span className="font-medium text-surface-700 dark:text-surface-300">{meeting.duration_seconds ? `${Math.round(meeting.duration_seconds / 60)} min` : '—'}</span></div>
                <div className="flex justify-between"><span>Participants</span><span className="font-medium text-surface-700 dark:text-surface-300">{participants.length}</span></div>
                <div className="flex justify-between"><span>Notes</span><span className="font-medium text-surface-700 dark:text-surface-300">{notes.length}</span></div>
              </div>
              <Link to="/admin/meetings" className="block text-center px-4 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold mt-4">
                Back to Meetings
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  /* =================== LOBBY (admin) =================== */
  if (phase === 'lobby' && meeting) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        <nav className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/meetings" className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <span className="text-base font-bold gradient-text">Admin Meeting</span>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Video className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{meeting.title}</h1>
                  <p className="text-sm text-surface-500">Ready to join as Host</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                  <div className="flex items-center gap-2 text-xs text-surface-400 mb-1"><Calendar size={12} /> Date & Time</div>
                  <div className="text-sm font-medium">{new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {normalizeTime(meeting.meeting_time)}</div>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                  <div className="flex items-center gap-2 text-xs text-surface-400 mb-1"><Clock size={12} /> Duration</div>
                  <div className="text-sm font-medium">{meeting.duration} min</div>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                  <div className="flex items-center gap-2 text-xs text-surface-400 mb-1"><Users size={12} /> Type</div>
                  <div className="text-sm font-medium">{meeting.meeting_type === 'one_on_one' ? 'One-to-One' : 'Group'}</div>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                  <div className="flex items-center gap-2 text-xs text-surface-400 mb-1"><UserCheck size={12} /> Waiting</div>
                  <div className="text-sm font-medium">
                    {onlineClients.length > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">{onlineClients.length} client(s) waiting</span>
                    ) : 'No one waiting' }
                  </div>
                </div>
              </div>

              {meeting.agenda && (
                <div className="mb-6">
                  <span className="text-xs text-surface-400 font-medium">Agenda</span>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{meeting.agenda}</p>
                </div>
              )}

              {/* Waiting clients list */}
              {onlineClients.length > 0 && (
                <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Clients in Waiting Room
                  </div>
                  <div className="space-y-1.5">
                    {onlineClients.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                        <UserIcon size={14} className="text-amber-600" />
                        <span>{c.name}</span>
                        <span className="text-xs text-surface-400">joined {new Date(c.joined_at || c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleJoin}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Video size={18} /> Join as Host
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =================== MEETING (admin) =================== */
  if (phase === 'meeting' && meeting) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        {/* Top bar */}
        <nav className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base font-bold gradient-text shrink-0">{profile?.name || 'Admin'}</span>
            <span className="text-surface-300 hidden sm:inline">|</span>
            <span className="text-sm font-medium truncate">{meeting.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-accent-600 dark:text-accent-400">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" /> Live
            </span>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              <PhoneOff size={14} /> End Meeting
            </button>
          </div>
        </nav>

        <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 max-h-[calc(100vh-49px)]">
          {/* Jitsi video area */}
          <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-black">
            <div ref={jitsiRef} className="w-full h-full" style={{ minHeight: '400px' }} />
          </div>

          {/* Right sidebar */}
          <div className="lg:w-80 shrink-0 flex flex-col gap-2">
            {/* Tabs */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 flex-1 flex flex-col min-h-0">
              <div className="flex border-b border-surface-200 dark:border-surface-700">
                {([
                  { id: 'participants', label: `People (${onlineParticipants.length})`, icon: Users },
                  { id: 'chat', label: 'Chat', icon: MessageCircle },
                  { id: 'notes', label: 'Notes', icon: FileText },
                ] as { id: typeof activeTab; label: string; icon: typeof Users }[]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-surface-500'
                    }`}
                  >
                    <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 p-3 min-h-0 flex flex-col">
                {/* Participants tab */}
                {activeTab === 'participants' && (
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                    <div className="text-xs text-surface-400 font-medium mb-1">Online ({onlineParticipants.length})</div>
                    {onlineParticipants.map(p => (
                      <div key={p.id} className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                          {p.role === 'host' ? <Crown size={14} className="text-primary-600" /> : <UserIcon size={14} className="text-surface-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-surface-400">{p.role === 'host' ? 'Host' : 'Client'}</div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0" />
                      </div>
                    ))}
                    {onlineParticipants.length === 0 && (
                      <p className="text-xs text-surface-400 text-center py-4">No one online.</p>
                    )}

                    {participants.filter(p => !p.is_online).length > 0 && (
                      <>
                        <div className="text-xs text-surface-400 font-medium mt-3 mb-1">Left</div>
                        {participants.filter(p => !p.is_online).map(p => (
                          <div key={p.id} className="flex items-center gap-2.5 rounded-lg p-2 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
                              <UserIcon size={14} className="text-surface-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{p.name}</div>
                              <div className="text-xs text-surface-400">{p.role === 'host' ? 'Host' : 'Client'}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Chat tab */}
                {activeTab === 'chat' && (
                  <>
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-surface-400 text-center py-4">No messages yet.</p>
                      ) : chatMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender_role === 'host' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs ${
                            msg.sender_role === 'host'
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200'
                              : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
                          }`}>
                            <span className="font-medium block text-[10px] mb-0.5 opacity-70">{msg.sender_name}</span>
                            {msg.message}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-xs outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Type a message..."
                      />
                      <button onClick={handleSendChat} disabled={!chatInput.trim()} className="p-1.5 rounded-lg bg-primary-600 text-white disabled:opacity-50">
                        <Send size={12} />
                      </button>
                    </div>
                  </>
                )}

                {/* Notes tab */}
                {activeTab === 'notes' && (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">
                      {notes.length === 0 ? (
                        <p className="text-xs text-surface-400 text-center py-4">No notes yet. Add key points during the meeting.</p>
                      ) : notes.map(n => (
                        <div key={n.id} className="text-xs rounded-lg bg-surface-50 dark:bg-surface-900 p-2.5">
                          <p className="text-surface-600 dark:text-surface-400">{n.content}</p>
                          <p className="text-surface-400 mt-1 text-[10px]">{new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveNote(); }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-xs outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Add a note..."
                      />
                      <button onClick={handleSaveNote} disabled={!noteInput.trim()} className="p-1.5 rounded-lg bg-primary-600 text-white disabled:opacity-50">
                        <Send size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* End Meeting confirmation modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 max-w-sm w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <PhoneOff className="text-red-600" size={20} />
                </div>
                <h2 className="text-lg font-bold">End Meeting?</h2>
              </div>
              <p className="text-sm text-surface-500 mb-6">
                This will disconnect all participants, save meeting notes, and send a summary email. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndMeeting}
                  disabled={endingMeeting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {endingMeeting ? 'Ending...' : 'End Meeting'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 px-4 py-2.5 rounded-lg bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-sm font-medium shadow-lg z-50 flex items-center gap-2"
          >
            <UserCheck size={16} />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary-500" size={32} />
    </div>
  );
}
