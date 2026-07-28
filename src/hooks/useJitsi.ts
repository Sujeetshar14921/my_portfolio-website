import { useRef, useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiMeetExternalAPIInstance;
  }
}

// Use the same interface name as vite-env.d.ts to avoid conflicts
interface JitsiMeetExternalAPIInstance {
  dispose(): void;
  executeCommand(command: string, ...args: unknown[]): void;
  addEventListener(event: string, callback: (payload: unknown) => void): void;
  removeEventListener(event: string, callback: (payload: unknown) => void): void;
  getParticipantsInfo(): { id: string; displayName: string }[];
}

export interface JitsiOptions {
  roomName: string;
  displayName: string;
  startWithAudioMuted: boolean;
  startWithVideoMuted: boolean;
  onParticipantJoined?: (data: { id: string; displayName: string }) => void;
  onParticipantLeft?: (data: { id: string; displayName: string }) => void;
  onVideoConferenceJoined?: (data: { id: string; displayName: string }) => void;
  onVideoConferenceLeft?: () => void;
  onAudioMuteStatusChanged?: (muted: boolean) => void;
  onVideoMuteStatusChanged?: (muted: boolean) => void;
}

export function useJitsi() {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiMeetExternalAPIInstance | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => setLoaded(true);
      script.onerror = () => console.error('Failed to load Jitsi External API');
      document.body.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  const join = useCallback((opts: JitsiOptions) => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

    const domain = 'meet.jit.si';
    const config: Record<string, unknown> = {
      roomName: opts.roomName,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      configOverwrite: {
        startWithAudioMuted: opts.startWithAudioMuted,
        startWithVideoMuted: opts.startWithVideoMuted,
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
      userInfo: { displayName: opts.displayName },
    };

    const api = new window.JitsiMeetExternalAPI(domain, config);
    apiRef.current = api;

    if (opts.onParticipantJoined) api.addEventListener('participantJoined', (payload) => {
      const p = payload as { id: string; displayName: string };
      opts.onParticipantJoined?.(p);
    });
    if (opts.onParticipantLeft) api.addEventListener('participantLeft', (payload) => {
      const p = payload as { id: string; displayName: string };
      opts.onParticipantLeft?.(p);
    });
    if (opts.onVideoConferenceJoined) api.addEventListener('videoConferenceJoined', (payload) => {
      const p = payload as { id: string; displayName: string };
      opts.onVideoConferenceJoined?.(p);
    });
    if (opts.onVideoConferenceLeft) api.addEventListener('videoConferenceLeft', () => {
      opts.onVideoConferenceLeft?.();
    });
    if (opts.onAudioMuteStatusChanged) api.addEventListener('audioMuteStatusChanged', (payload) => {
      const p = payload as { muted: boolean };
      opts.onAudioMuteStatusChanged?.(p.muted);
    });
    if (opts.onVideoMuteStatusChanged) api.addEventListener('videoMuteStatusChanged', (payload) => {
      const p = payload as { muted: boolean };
      opts.onVideoMuteStatusChanged?.(p.muted);
    });
  }, []);

  const leave = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
  }, []);

  const toggleAudio = useCallback((muted: boolean) => {
    apiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback((muted: boolean) => {
    apiRef.current?.executeCommand('toggleVideo');
  }, []);

  return { containerRef, join, leave, toggleAudio, toggleVideo, loaded };
}
