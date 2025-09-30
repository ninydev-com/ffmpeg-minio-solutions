"use client";

// Purpose: UI to control worker-based processing of a recorded video.
// Integrates with useRecorder to get the last recorded blob, and with useFfmpegWorker
// to offload processing into a dedicated Web Worker. Shows progress/log/output and provides
// a few parameters as simple inputs.

import React, { useMemo, useState } from "react";
import { useRecorder } from "../../../recorder/context";
import { useFfmpegWorker } from "./useFfmpegWorker";

export default function FfmpegWorkerPanel({ className }: { className?: string }) {
  const rec = useRecorder();
  const worker = useFfmpegWorker();

  const hasBlob = !!rec.blob;
  const [duration, setDuration] = useState<number>(10);
  const [start, setStart] = useState<number>(0);
  const [height, setHeight] = useState<number>(720);
  const [toMp4, setToMp4] = useState<boolean>(true);
  const [crf, setCrf] = useState<number>(28);
  const [preset, setPreset] = useState<string>("veryfast");
  const [thumbAt, setThumbAt] = useState<number>(1);
  const [thumbWidth, setThumbWidth] = useState<number>(1280);

  const canWork = hasBlob && (worker.status === "ready" || worker.status === "idle" || worker.status === "error" || worker.status === "canceled");
  const isBusy = worker.status === "loading" || worker.status === "working";

  const recordedInfo = useMemo(() => {
    return {
      mime: rec.mimeType || rec.blob?.type || "",
      size: rec.blob ? prettyBytes(rec.blob.size) : "—",
    };
  }, [rec.mimeType, rec.blob]);

  return (
    <section className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-zinc-900/60 shadow-sm p-4 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          {/* Video processing icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h9a2 2 0 002-2v-1.382l3.553 1.777A1 1 0 0020 16.5v-7a1 1 0 00-1.447-.894L15 10.382V9a2 2 0 00-2-2H4z"/></svg>
          Video Processing (Web Worker + FFmpeg)
        </h3>
        <div className="text-xs text-gray-600">Worker status: <b>{worker.status}</b></div>
      </div>

      {/* How to use */}
      <div className="mt-3 rounded-md bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-800 p-3">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">How to use</div>
        <ol className="text-xs text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
          <li>Record a video in the Recorder block above.</li>
          <li>Optionally preload FFmpeg core (from cache) to avoid first-run delay.</li>
          <li>Adjust parameters and run processing to get a 10s preview and a snapshot.</li>
        </ol>
      </div>

      {/* Status & progress */}
      <div className="mt-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {/* Progress icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 4a1 1 0 10-2 0v6a1 1 0 00.553.894l4 2a1 1 0 10.894-1.788L13 11.382V6z"/></svg>
          Progress: {(worker.progress * 100).toFixed(0)}%
        </div>
        <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-zinc-800 rounded overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, worker.progress * 100))}%` }} />
        </div>
        {worker.lastLog && <div className="text-xs mt-2 p-2 rounded bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-800 break-all">{worker.lastLog}</div>}
        {worker.error && (
          <div className="text-xs mt-2 text-red-600 flex items-center gap-2" role="alert">
            {/* Warning icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M10.29 3.86a2 2 0 013.42 0l8.07 13.45A2 2 0 0120.07 21H3.93a2 2 0 01-1.71-3.69L10.29 3.86zM13 16a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V9a1 1 0 112 0v4a1 1 0 01-1 1z"/></svg>
            {worker.error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => worker.loadCore({ preferCache: true })}
          disabled={isBusy}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 text-white text-sm py-2 px-3 rounded"
        >
          {/* Download icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L11 12.586V4a1 1 0 011-1z"/><path d="M5 20a1 1 0 110-2h14a1 1 0 110 2H5z"/></svg>
          Load FFmpeg (from cache)
        </button>
        <button
          onClick={() => worker.cancel()}
          disabled={!isBusy}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 text-white text-sm py-2 px-3 rounded"
        >
          {/* X icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 011.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12l-4.361 4.361a1 1 0 01-1.414-1.414L10.586 10.586 6.225 6.225a1 1 0 010-1.414z"/></svg>
          Cancel
        </button>
        <button
          onClick={() => worker.terminate()}
          disabled={isBusy}
          className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 text-white text-sm py-2 px-3 rounded"
        >
          {/* Restart icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 5V2l5 4-5 4V7a5 5 0 105 5 1 1 0 112 0 7 7 0 11-7-7z"/></svg>
          Restart worker
        </button>
      </div>

      {/* Parameters */}
      <div className="mt-4 rounded-md border border-gray-200 dark:border-gray-800 p-3">
        <div className="text-sm font-medium mb-2">Parameters</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <LabeledInput label="Preview duration (sec)" value={duration} onChange={setDuration} min={1} max={120} />
          <LabeledInput label="Start offset (sec)" value={start} onChange={setStart} min={0} max={600} />
          <LabeledInput label="Preview height (px)" value={height} onChange={setHeight} min={144} max={1080} />
          <LabeledInput label="CRF (MP4 quality)" value={crf} onChange={setCrf} min={18} max={35} />
          <LabeledSelect label="Preset (MP4 speed)" value={preset} onChange={setPreset} options={["ultrafast","superfast","veryfast","faster","fast","medium","slow","slower","veryslow"]} />
          <LabeledCheckbox label="Convert to MP4" checked={toMp4} onChange={setToMp4} />
          <LabeledInput label="Snapshot at (sec)" value={thumbAt} onChange={setThumbAt} min={0} max={duration} />
          <LabeledInput label="Snapshot width (px)" value={thumbWidth} onChange={setThumbWidth} min={64} max={1920} />
        </div>
      </div>

      {/* Recorded file info */}
      <div className="mt-4 text-sm text-gray-700">
        <div>Recorded file: mime={recordedInfo.mime || "?"}, size={recordedInfo.size}</div>
        {!hasBlob && <div className="text-xs text-gray-500">Record a video first in the block above.</div>}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => rec.blob && worker.makePreview(rec.blob, { duration, start, scaleHeight: height, toMp4, crf, preset: preset as any })}
          disabled={!canWork || !hasBlob}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:opacity-50 text-white text-sm py-2 px-3 rounded"
        >
          {/* Play icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M5 3.879A2 2 0 018.06 2.5l10.06 6.12a2 2 0 010 3.46L8.06 18.2A2 2 0 015 16.82V3.88z"/></svg>
          Create 10s preview
        </button>

        <button
          onClick={() => rec.blob && worker.makeSnapshot(rec.blob, { at: thumbAt, scaleWidth: thumbWidth })}
          disabled={!canWork || !hasBlob}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:opacity-50 text-white text-sm py-2 px-3 rounded"
        >
          {/* Camera icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 3a2 2 0 00-1.789 1.106L6.382 5H5a3 3 0 00-3 3v8a3 3 0 003 3h14a3 3 0 003-3V8a3 3 0 00-3-3h-1.382l-.829-1.894A2 2 0 0013.999 3H9zm3 14a4 4 0 110-8 4 4 0 010 8z"/></svg>
          Extract frame
        </button>
      </div>

      {/* Outputs */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="text-sm font-medium mb-2">Preview</div>
          {worker.previewUrl ? (
            <video src={worker.previewUrl} controls className="w-full rounded border border-gray-200 dark:border-gray-800" />
          ) : (
            <div className="text-xs text-gray-500">No result yet</div>
          )}
        </div>
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <div className="text-sm font-medium mb-2">Thumbnail</div>
          {worker.snapshotUrl ? (
            <img src={worker.snapshotUrl} alt="thumbnail" className="w-full rounded border border-gray-200 dark:border-gray-800" />
          ) : (
            <div className="text-xs text-gray-500">No result yet</div>
          )}
        </div>
      </div>
    </section>
  );
}

// Small presentational inputs
function LabeledInput({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <label className="flex flex-col text-xs">
      <span className="mb-1 text-gray-600 dark:text-gray-300">{label}</span>
      <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
    </label>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col text-xs">
      <span className="mb-1 text-gray-600 dark:text-gray-300">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function LabeledCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400" />
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
    </label>
  );
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"]; let u = -1; let num = n;
  do { num /= 1024; u++; } while (num >= 1024 && u < units.length - 1);
  return `${num.toFixed(1)} ${units[u]}`;
}
