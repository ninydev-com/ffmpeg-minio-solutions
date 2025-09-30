// Purpose: Define message types between main thread and the FFmpeg Web Worker.
// Keep this file tiny and dependency-free so it can be imported by both sides.

export type WorkerCommand =
  | { type: "load"; payload?: { coreURL?: string; wasmURL?: string } }
  | { type: "preview"; payload: PreviewParams }
  | { type: "snapshot"; payload: SnapshotParams }
  | { type: "cancel" }
  | { type: "terminate" };

export interface PreviewParams {
  // Raw binary of the recorded file
  data: ArrayBuffer;
  // File name hint (only for FFmpeg virtual FS naming); extension can help
  inputName?: string; // e.g. 'input.webm'
  // Start position for trimming (seconds)
  start?: number; // default 0
  // Duration to keep (seconds)
  duration?: number; // default 10
  // Resize video: target height or width. If omitted, keep original.
  // Provide one dimension and FFmpeg will keep aspect ratio with -2.
  scaleHeight?: number; // e.g., 720
  scaleWidth?: number; // alternative to scaleHeight
  // If true, re-encode to MP4 (H.264/AAC). Otherwise, try fast copy to WebM when possible.
  toMp4?: boolean; // default true for compatibility
  // Encoding tuning (used only when toMp4=true)
  crf?: number; // default 28
  preset?: "ultrafast"|"superfast"|"veryfast"|"faster"|"fast"|"medium"|"slow"|"slower"|"veryslow"; // default 'veryfast'
}

export interface SnapshotParams {
  data: ArrayBuffer;
  inputName?: string;
  at?: number; // seconds, default 1
  scaleWidth?: number; // e.g., 1280
  scaleHeight?: number; // alternative
  quality?: number; // JPEG qscale 2..31, default 2 (best)
}

export type WorkerEvent =
  | { type: "loaded" }
  | { type: "progress"; payload: { ratio: number; time?: number } }
  | { type: "log"; payload: { message: string } }
  | { type: "result"; payload: { kind: "preview"|"snapshot"; name: string; mime: string; data: ArrayBufferLike } }
  | { type: "error"; payload: { message: string } }
  | { type: "canceled" }
  | { type: "terminated" };
