// Purpose: UI widget that shows whether FFmpeg core is cached and
// provides actions to pre-cache (download) or clear the cache.
// Uses Cache Storage API via helpers from ffmpegCache.ts.

"use client";

import React, { useEffect, useState } from "react";
import { isCoreCached, cacheCoreAssets, clearCoreCache } from "./ffmpegCache";

export default function FfmpegCacheManager({ className }: { className?: string }) {
  const [cached, setCached] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check cache status on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ok = await isCoreCached();
        if (mounted) setCached(ok);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Action: Pre-cache (download) ffmpeg core into Cache Storage
  async function handlePrecache() {
    setBusy(true);
    setError(null);
    try {
      await cacheCoreAssets();
      setCached(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to cache FFmpeg core");
    } finally {
      setBusy(false);
    }
  }

  // Action: Clear cache bucket
  async function handleClear() {
    setBusy(true);
    setError(null);
    try {
      await clearCoreCache();
      setCached(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to clear cache");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-zinc-900/60 shadow-sm p-4 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${cached ? "bg-green-500" : "bg-gray-400"}`}
            aria-hidden
          />
          <h3 className="text-sm font-semibold">FFmpeg Core Cache</h3>
        </div>
        <span className="text-xs text-gray-500">Status: <b>{cached ? "cached" : "not cached"}</b></span>
      </div>

      {/* Quick steps */}
      <ol className="mt-3 text-xs text-gray-600 space-y-1 list-decimal list-inside">
        <li>Check status above.</li>
        <li>Preload core now to avoid delays on first processing.</li>
        <li>Use the Processing panel below to create preview and snapshot.</li>
      </ol>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handlePrecache}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 text-white text-sm py-2 px-3 rounded"
          aria-label="Preload FFmpeg core into cache"
        >
          {/* Download icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L11 12.586V4a1 1 0 011-1z"/><path d="M5 20a1 1 0 110-2h14a1 1 0 110 2H5z"/></svg>
          Preload to cache
        </button>
        <button
          onClick={handleClear}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 text-white text-sm py-2 px-3 rounded"
          aria-label="Clear FFmpeg cache"
        >
          {/* Trash icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 3a1 1 0 00-1 1v1H5a1 1 0 100 2h14a1 1 0 100-2h-3V4a1 1 0 00-1-1H9z"/><path d="M7 9a1 1 0 012 0v8a1 1 0 11-2 0V9zm4 0a1 1 0 012 0v8a1 1 0 11-2 0V9zm4 0a1 1 0 012 0v8a1 1 0 11-2 0V9z"/></svg>
          Clear cache
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Hint for users */}
      <p className="mt-3 text-xs text-gray-500">
        Hint: files are stored in the browser Cache Storage. If you clear the cache, they will be downloaded again when needed.
      </p>
    </div>
  );
}
