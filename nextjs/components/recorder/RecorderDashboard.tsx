/**
 * RecorderDashboard
 * - Provides control buttons to manage the recording session:
 *   Initialize camera, Start, Stop, Download, Reset, and Cleanup.
 * - Reflects current recording status and disables actions when not applicable.
 * - Exposes a Download link when a Blob is available.
 *
 * Best practices implemented:
 * - Clear separation of concerns: no direct media logic here; uses the store API.
 * - Button disabling to prevent illegal states (e.g., starting twice).
 * - Minimal inline styles; easily customizable from parent.
 * - Accessible labels and keyboard focusability are automatic for <button>/<a>.
 */

"use client";

import React, { useMemo } from "react";
import { useRecorder } from "./context";

export default function RecorderDashboard({ className }: { className?: string }) {
  const {
    status,
    objectUrl,
    blob,
    mimeType,
    init,
    start,
    stop,
    reset,
    cleanup,
  } = useRecorder();

  const filename = useMemo(() => {
    // Propose a time-stamped file name; extension based on mimeType if known
    const ext = mimeType?.includes("webm") ? "webm" : mimeType?.includes("mp4") ? "mp4" : "webm";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `recording-${stamp}.${ext}`;
  }, [mimeType]);

  const canInit = status === "idle" || status === "error";
  const canStart = status === "ready" || status === "stopped"; // allow re-record without re-init
  const canStop = status === "recording";
  const canDownload = Boolean(objectUrl && blob);
  const canReset = status === "ready" || status === "stopped" || status === "error";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ""}`}>
      <button
        onClick={() => init().catch(() => void 0)}
        disabled={!canInit}
        title="Initialize camera and microphone"
        aria-label="Initialize camera and microphone"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        {/* Camera icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 3a2 2 0 00-1.789 1.106L6.382 5H5a3 3 0 00-3 3v8a3 3 0 003 3h14a3 3 0 003-3V8a3 3 0 00-3-3h-1.382l-.829-1.894A2 2 0 0013.999 3H9z"/></svg>
        Initialize
      </button>

      <button
        onClick={start}
        disabled={!canStart}
        title="Start recording"
        aria-label="Start recording"
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      >
        {/* Record icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="6"/></svg>
        Start
      </button>

      <button
        onClick={stop}
        disabled={!canStop}
        title="Stop recording"
        aria-label="Stop recording"
        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        {/* Stop icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
        Stop
      </button>

      <button
        onClick={reset}
        disabled={!canReset}
        title="Reset output and prepare for another take"
        aria-label="Reset output and prepare for another take"
        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-3 rounded disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {/* Reset icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 5V2l5 4-5 4V7a5 5 0 105 5 1 1 0 112 0 7 7 0 11-7-7z"/></svg>
        Reset
      </button>

      <button
        onClick={cleanup}
        title="Stop devices and clear everything"
        aria-label="Stop devices and clear everything"
        className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        {/* Trash icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 3a1 1 0 00-1 1v1H5a1 1 0 100 2h14a1 1 0 100-2h-3V4a1 1 0 00-1-1H9z"/><path d="M7 9a1 1 0 012 0v8a1 1 0 11-2 0V9zm4 0a1 1 0 012 0v8a1 1 0 11-2 0V9zm4 0a1 1 0 012 0v8a1 1 0 11-2 0V9z"/></svg>
        Cleanup
      </button>

      {canDownload && (
        <a
          href={objectUrl!}
          download={filename}
          title="Download the recorded video file"
          aria-label="Download the recorded video file"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {/* Download icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L11 12.586V4a1 1 0 011-1z"/><path d="M5 20a1 1 0 110-2h14a1 1 0 110 2H5z"/></svg>
          Download
        </a>
      )}
    </div>
  );
}
