/// <reference types="vite/client" />

interface JitsiMeetExternalAPIInstance {
  dispose(): void;
  executeCommand(command: string, ...args: unknown[]): void;
  addEventListener(event: string, callback: (payload: unknown) => void): void;
  removeEventListener(event: string, callback: (payload: unknown) => void): void;
  getParticipantsInfo(): { id: string; displayName: string }[];
}
