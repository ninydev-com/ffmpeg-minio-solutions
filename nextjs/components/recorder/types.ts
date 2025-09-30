// Shared types for the recorder components
// Keep this file minimal and focused on type declarations only.

export type RecordingStatus =
  | "idle" // Not initialized yet; no stream or recorder
  | "ready" // Stream initialized; preview available; recorder ready
  | "recording" // Actively recording
  | "stopped" // Recording stopped; blob is available
  | "error"; // Some error occurred; see errorMessage

export interface RecorderState {
  status: RecordingStatus;
  errorMessage?: string;
  stream: MediaStream | null; // Current camera+mic stream for preview and recorder
  recorder: MediaRecorder | null; // Current MediaRecorder instance
  chunks: Blob[]; // Accumulated chunks while recording
  blob: Blob | null; // Final blob after stop
  objectUrl: string | null; // Object URL created from blob for download/playback
  mimeType: string | null; // Selected mimeType used for MediaRecorder
}

export interface RecorderApi extends RecorderState {
  init: (constraints?: MediaStreamConstraints) => Promise<void>;
  start: () => void;
  stop: () => void;
  reset: () => void;
  cleanup: () => void;
}
