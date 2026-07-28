import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Calendar, Clock, Users, FileText,
  LogOut, ArrowLeft, AlertCircle, Loader2, Send, CheckCircle2,
} from 'lucide-react';
import { getMeetingByToken, getMeetingNotes, addMeetingNote, completeMeeting } from '@/lib/crm';
import type { Meeting, MeetingNote } from '@/types';
import { useProfile } from '@/lib/profile';

type Phase = 'loading' | 'lobby' | 'meeting' | 'ended' | 'notfound';

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
  const [savingNote, setSavingNote] = useState(false);
  const [icsLink, setIcsLink] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<unknown>(null);

  // Load meeting
  useEffect(() => {
    if (!meetingId) { setPhase('notfound'); return; }
    (async () => {
      const m = await getMeetingByToken(meetingId);
      if (m) {
        setMeeting(m);
        setPhase('lobby');
        const n = await getMeetingNotes(m.id);
        setNotes(n);
      } else {
        setPhase('notfound');
      }
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

  const handleJoin = useCallback(() => {
    if (!meeting) return;
    setPhase('meeting');
    // Stop lobby preview stream
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      setVideoStream(null);
    }
  }, [meeting, videoStream]);

  // Embed Jitsi
  useEffect(() => {
    if (phase !== 'meeting' || !meeting || !jitsiContainerRef.current) return;

    const loadJitsi = async () => {
      const domain = 'meet.jit.si';
      const roomName = `sujeetsharma-${meeting.secure_token}`;
      const options = {
        roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: !micOn,
          startWithVideoMuted: !camOn,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'recording', 'livestreaming',
            'etherpad', 'sharedvideo', 'settings', 'raisehand', 'videoquality',
            'filmstrip', 'feedback', 'stats', 'shortcuts', 'tileview', 'videobackgroundblur',
            'download', 'help', 'mute-everyone',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
        },
        userInfo: { displayName: displayName || 'Guest' },
      };

      // Load external API script
      if (!window.JitsiMeetExternalAPI) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://${domain}/external_api.js`;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Jitsi'));
          document.body.appendChild(script);
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      jitsiRef.current = new JitsiMeetExternalAPI(domain, options);
    };

    loadJitsi().catch(err => console.error('Jitsi load failed', err));

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = jitsiRef.current as any;
      if (api?.dispose) api.dispose();
      jitsiRef.current = null;
    };
  }, [phase, meeting, displayName, micOn, camOn]);

  const handleLeave = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = jitsiRef.current as any;
    if (api?.dispose) api.dispose();
    jitsiRef.current = null;

    if (meeting) {
      try { await completeMeeting(meeting.id); } catch { /* non-blocking */ }
    }
    setPhase('ended');
  };

  const handleSaveNote = async () => {
    if (!meeting || !noteInput.trim()) return;
    setSavingNote(true);
    const ok = await addMeetingNote(meeting.id, noteInput.trim());
    setSavingNote(false);
    if (ok) {
      const n = await getMeetingNotes(meeting.id);
      setNotes(n);
      setNoteInput('');
    }
  };

  // Download ICS
  useEffect(() => {
    if (meeting) {
      const dt = new Date(`${meeting.meeting_date}T${meeting.meeting_time}:00`);
      const dtEnd = new Date(dt.getTime() + meeting.duration * 60000);
      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sujeet Sharma//Meeting//EN',
        'BEGIN:VEVENT', `UID:${meeting.id}@sujeetsharma.in`,
        `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(dt)}`, `DTEND:${fmt(dtEnd)}`,
        `SUMMARY:${meeting.title}`, `DESCRIPTION:${(meeting.agenda || '').replace(/\n/g, '\\n')}`,
        `LOCATION:${meeting.meeting_url}`, 'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar' });
      setIcsLink(URL.createObjectURL(blob));
    }
  }, [meeting]);

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
        {/* Navbar */}
        <nav className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-6 py-3">
          <Link to="/" className="text-lg font-bold gradient-text">{profile?.name || 'Portfolio'}</Link>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-3xl w-full grid md:grid-cols-2 gap-8 items-center">
            {/* Camera preview */}
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

            {/* Meeting info + join */}
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold mb-1">{meeting.title}</h1>
                {meeting.agenda && <p className="text-sm text-surface-500 leading-relaxed">{meeting.agenda}</p>}
              </div>
              <div className="space-y-1.5 text-sm text-surface-500">
                <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(meeting.meeting_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <div className="flex items-center gap-2"><Clock size={14} /> {meeting.meeting_time} ({meeting.duration} min)</div>
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
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Video size={18} /> Join Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =================== MEETING (Jitsi embedded) =================== */
  if (phase === 'meeting' && meeting) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        {/* Navbar */}
        <nav className="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold gradient-text">{profile?.name || 'Portfolio'}</Link>
          <div className="flex items-center gap-3">
            <a href={icsLink} download="meeting.ics" className="text-xs text-primary-600 dark:text-primary-400 hover:underline hidden sm:inline">Download .ics</a>
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              <LogOut size={16} /> Leave
            </button>
          </div>
        </nav>

        <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 max-h-[calc(100vh-56px)]">
          {/* Jitsi video area */}
          <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-black">
            <div ref={jitsiContainerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
          </div>

          {/* Sidebar: meeting info + notes */}
          <div className="lg:w-80 shrink-0 flex flex-col gap-3">
            {/* Meeting info */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
              <h3 className="font-semibold text-sm mb-2">{meeting.title}</h3>
              {meeting.agenda && <p className="text-xs text-surface-500 mb-2">{meeting.agenda}</p>}
              <div className="text-xs text-surface-400 space-y-1">
                <div className="flex items-center gap-1.5"><Calendar size={11} /> {new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {meeting.meeting_time}</div>
                <div className="flex items-center gap-1.5"><Clock size={11} /> {meeting.duration} min</div>
                <div className="flex items-center gap-1.5"><Users size={11} /> {meeting.meeting_type === 'one_on_one' ? 'One-to-One' : 'Group'}</div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-primary-500" />
                <h3 className="font-semibold text-sm">Meeting Notes</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                {notes.length === 0 ? (
                  <p className="text-xs text-surface-400 text-center py-4">No notes yet. Add key points during the meeting.</p>
                ) : (
                  notes.map(n => (
                    <div key={n.id} className="text-xs rounded-lg bg-surface-50 dark:bg-surface-900 p-2.5">
                      <p className="text-surface-600 dark:text-surface-400">{n.content}</p>
                      <p className="text-surface-400 mt-1">{new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveNote(); }}
                  className="flex-1 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add a note..."
                />
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteInput.trim()}
                  className="p-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
