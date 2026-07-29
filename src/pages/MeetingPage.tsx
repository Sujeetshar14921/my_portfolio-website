import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Calendar, Clock, Users, FileText,
  LogOut, AlertCircle, Loader2, Send, CheckCircle2, MessageCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMeetingByToken, getMeetingNotes, addMeetingNote, updateMeetingStatus, joinMeetingAsParticipant, markParticipantOffline, sendChatMessage } from '@/lib/crm';
import type { Meeting, MeetingNote, MeetingParticipant, MeetingChatMessage, MeetingLiveStatus } from '@/types';
import { useProfile } from '@/lib/profile';
import { useJitsi } from '@/hooks/useJitsi';

type Phase = 'loading' | 'lobby' | 'waiting' | 'meeting' | 'ended' | 'notfound';

function normalizeTime(t: string): string {
  return t.split(':').slice(0, 2).join(':');
}

function isHostPresent(status: MeetingLiveStatus): boolean {
  return status === 'host_joined' || status === 'client_joined' || status === 'in_progress';
}

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { profile } = useProfile();
  const [phase, setPhase] = useState<Phase>('loading');
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('chat');
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [pendingMeeting, setPendingMeeting] = useState<Meeting | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const jitsiRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<unknown>(null);
  const phaseRef = useRef<Phase>('loading');
  const myParticipantRef = useRef<string | null>(null);

  const jitsi = useJitsi();

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { myParticipantRef.current = myParticipantId; }, [myParticipantId]);

  // Load meeting
  useEffect(() => {
    if (!meetingId) { setPhase('notfound'); return; }
    (async () => {
      const m = await getMeetingByToken(meetingId);
      if (!m) { setPhase('notfound'); return; }
      setMeeting(m);
      if (m.status === 'completed' || m.status === 'cancelled') {
        setPhase('ended');
      } else {
        setPhase('lobby');
      }
      const n = await getMeetingNotes(m.id);
      setNotes(n);
    })();
  }, [meetingId]);

  // Camera preview in lobby
  useEffect(() => {
    if (phase === 'lobby' && camOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: micOn })
        .then(stream => {
          setVideoStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => setCamOn(false));
    }
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        setVideoStream(null);
      }
    };
  }, [camOn, micOn, phase]);

  // Realtime: subscribe to meeting status + participants + chat
  useEffect(() => {
    if (!meeting) return;
    const channelId = `client-meeting-${meeting.id}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `id=eq.${meeting.id}` },
        (payload) => {
          const updated = payload.new as Meeting;
          setMeeting(updated);
          // If host joins, move from waiting to meeting
          if (phaseRef.current === 'waiting' && isHostPresent(updated.status)) {
            enterJitsi(updated);
          }
          // If meeting ends
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
            setParticipants(prev => [...prev, payload.new as MeetingParticipant]);
          } else if (payload.eventType === 'UPDATE') {
            const p = payload.new as MeetingParticipant;
            setParticipants(prev => prev.map(x => x.id === p.id ? p : x));
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

    // Initial load of participants + chat
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from('meeting_participants').select('*').eq('meeting_id', meeting.id).eq('is_online', true),
        supabase.from('meeting_chat_messages').select('*').eq('meeting_id', meeting.id).order('created_at', { ascending: true }),
      ]);
      if (p.data) setParticipants(p.data as MeetingParticipant[]);
      if (c.data) setChatMessages(c.data as MeetingChatMessage[]);
    })();

    return () => { supabase.removeChannel(channel); };
  }, [meeting?.id]);

  // Polling fallback: if Realtime doesn't deliver the host-joined update
  // (e.g. Realtime not enabled / RLS blocking the row for anon), keep
  // checking the meeting status directly so the client isn't stuck forever
  // on the "Waiting for Host" screen.
  useEffect(() => {
    if (phase !== 'waiting' || !meetingId) return;
    const interval = setInterval(async () => {
      const m = await getMeetingByToken(meetingId);
      if (!m) return;
      setMeeting(m);
      if (phaseRef.current === 'waiting' && isHostPresent(m.status)) {
        enterJitsi(m);
      }
      if (m.status === 'completed' || m.status === 'cancelled') {
        setPhase('ended');
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [phase, meetingId]);

  const enterJitsi = useCallback((m: Meeting) => {
    // Stop lobby preview stream before switching phase
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      setVideoStream(null);
    }
    setPendingMeeting(m);
    setPhase('meeting');
  }, [videoStream]);

  // Initialize Jitsi after React has committed the meeting phase DOM
  useEffect(() => {
    if (phase !== 'meeting' || !pendingMeeting || !jitsiRef.current || jitsiApiRef.current) return;
    const m = pendingMeeting;
    const init = async () => {
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
          startWithAudioMuted: !micOn,
          startWithVideoMuted: !camOn,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'shortcuts', 'tileview', 'videobackgroundblur', 'help'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
        },
        userInfo: { displayName: displayName || 'Guest' },
      });
    };
    init().catch(err => console.error('Jitsi init failed', err));
  }, [phase, pendingMeeting, micOn, camOn, displayName]);

  const leaveJitsi = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = jitsiApiRef.current as any;
    if (api?.dispose) { api.dispose(); jitsiApiRef.current = null; }
  }, []);

  const handleJoin = async () => {
    if (!meeting) return;
    // Join as participant
    const participant = await joinMeetingAsParticipant(meeting.id, displayName || 'Guest', null, 'client');
    if (participant) setMyParticipantId(participant.id);

    // Update meeting status to waiting_for_host if not already in progress
    if (meeting.status === 'scheduled') {
      await updateMeetingStatus(meeting.id, 'waiting_for_host');
    } else if (isHostPresent(meeting.status)) {
      // Host is already present — join directly
      enterJitsi(meeting);
      return;
    }

    // Check if host is already online
    const hostOnline = participants.some(p => p.role === 'host' && p.is_online);
    if (hostOnline || isHostPresent(meeting.status)) {
      enterJitsi(meeting);
    } else {
      setPhase('waiting');
    }
  };

  const handleLeave = async () => {
    leaveJitsi();
    if (myParticipantRef.current) {
      await markParticipantOffline(myParticipantRef.current);
    }
    setPhase('ended');
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
    await sendChatMessage(meeting.id, displayName || 'Guest', 'client', chatInput.trim());
    setChatInput('');
  };

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
          <p className="text-surface-500 text-sm mb-6">This meeting link is invalid or no longer available.</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-xl gradient-bg text-white text-sm font-semibold">Back to Home</Link>
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
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-accent-600" size={32} />
          </div>
          <h1 className="text-xl font-bold mb-2">Meeting Ended</h1>
          <p className="text-surface-500 text-sm mb-6">Thanks for joining! A summary will be sent to your email shortly.</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-xl gradient-bg text-white text-sm font-semibold">Back to Home</Link>
        </motion.div>
      </div>
    );
  }

  /* =================== LOBBY =================== */
  if (phase === 'lobby' && meeting) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        <nav className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-6 py-3">
          <Link to="/" className="text-lg font-bold gradient-text">{profile?.name || 'Portfolio'}</Link>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-3xl w-full grid md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-video rounded-2xl bg-surface-800 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 overflow-hidden">
              {camOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-surface-400">
                  <VideoOff size={40} />
                  <span className="text-sm mt-2">Camera is off</span>
                </div>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => setCamOn(c => !c)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-primary-600 text-white' : 'bg-surface-600 text-white'}`}
                >
                  {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                <button
                  onClick={() => setMicOn(m => !m)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-primary-600 text-white' : 'bg-surface-600 text-white'}`}
                >
                  {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold mb-1">{meeting.title}</h1>
                {meeting.agenda && <p className="text-sm text-surface-500 leading-relaxed">{meeting.agenda}</p>}
              </div>
              <div className="space-y-1.5 text-sm text-surface-500">
                <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(meeting.meeting_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <div className="flex items-center gap-2"><Clock size={14} /> {normalizeTime(meeting.meeting_time)} ({meeting.duration} min)</div>
                <div className="flex items-center gap-2"><Users size={14} /> {meeting.meeting_type === 'one_on_one' ? 'One-to-One' : 'Group'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your display name"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!displayName.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Video size={18} /> Join Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =================== WAITING ROOM =================== */
  if (phase === 'waiting' && meeting) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        <nav className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-6 py-3">
          <Link to="/" className="text-lg font-bold gradient-text">{profile?.name || 'Portfolio'}</Link>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-primary-100 dark:bg-primary-900/30" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="text-primary-600" size={28} />
              </div>
            </div>
            <h1 className="text-xl font-bold mb-2">Waiting for Host</h1>
            <p className="text-surface-500 text-sm mb-6">
              You've joined <strong>{meeting.title}</strong>. The host will be with you shortly. You'll automatically join when they arrive.
            </p>
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Status</span>
                <span className="flex items-center gap-1.5 text-xs text-accent-600 dark:text-accent-400">
                  <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" /> In Waiting Room
                </span>
              </div>
              <div className="text-xs text-surface-500">
                Name: {displayName}<br />
                Meeting: {meeting.title}<br />
                Time: {normalizeTime(meeting.meeting_time)} on {new Date(meeting.meeting_date).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={handleLeave}
              className="mt-6 text-sm text-surface-500 hover:text-red-500 transition-colors"
            >
              Leave waiting room
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  /* =================== MEETING (Jitsi embedded) =================== */
  if (phase === 'meeting' && meeting) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        <nav className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="text-base font-bold gradient-text shrink-0">{profile?.name || 'Portfolio'}</Link>
            <span className="text-surface-300 hidden sm:inline">|</span>
            <span className="text-sm font-medium truncate">{meeting.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-accent-600 dark:text-accent-400">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" /> Live
            </span>
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              <LogOut size={14} /> Leave
            </button>
          </div>
        </nav>

        <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 max-h-[calc(100vh-49px)]">
          {/* Jitsi video area */}
          <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-black">
            <div ref={jitsiRef} className="w-full h-full" style={{ minHeight: '400px' }} />
          </div>

          {/* Sidebar: participants + notes/chat */}
          <div className="lg:w-80 shrink-0 flex flex-col gap-2">
            {/* Participants */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-primary-500" />
                <h3 className="font-semibold text-sm">Participants ({participants.filter(p => p.is_online).length})</h3>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {participants.filter(p => p.is_online).map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-accent-500" />
                    <span className="truncate">{p.name}</span>
                    {p.role === 'host' && <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Host</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs: chat + notes */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 flex-1 flex flex-col min-h-0">
              <div className="flex border-b border-surface-200 dark:border-surface-700">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'chat' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-surface-500'
                  }`}
                >
                  <MessageCircle size={14} /> Chat
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'notes' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-surface-500'
                  }`}
                >
                  <FileText size={14} /> Notes
                </button>
              </div>

              <div className="flex-1 p-3 min-h-0 flex flex-col">
                {activeTab === 'chat' && (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-surface-400 text-center py-4">No messages yet. Say hello!</p>
                      ) : chatMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender_role === 'host' ? 'items-start' : 'items-end'}`}>
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

                {activeTab === 'notes' && (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">
                      {notes.length === 0 ? (
                        <p className="text-xs text-surface-400 text-center py-4">No notes yet.</p>
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
      </div>
    );
  }

  return null;
}
