/// <reference types="vite/client" />

interface JitsiMeetExternalAPI {
  dispose(): void;
  executeCommand(command: string, ...args: unknown[]): void;
  addEventListener(event: string, callback: (payload: unknown) => void): void;
  removeEventListener(event: string, callback: (payload: unknown) => void): void;
}

interface Window {
  JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiMeetExternalAPI;
}
