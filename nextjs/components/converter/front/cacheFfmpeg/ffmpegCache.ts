// Purpose: A tiny cache manager around the Cache Storage API for ffmpeg core assets.
// It provides: status check, pre-cache (warm), clear cache, and retrieval as blob URLs.
// This does NOT register a Service Worker; it's a simple runtime cache you can control from UI.

"use client";

import { CORE_JS_URL, CORE_WASM_URL, FFMPEG_CACHE_NAME } from "./ffmpegCoreConfig";

// Helper to safely access window.caches only in the browser.
function getCaches(): CacheStorage | null {
  if (typeof window === "undefined") return null;
  if (!("caches" in window)) return null;
  return window.caches;
}

// Check if both JS and WASM are present in our cache bucket.
export async function isCoreCached(): Promise<boolean> {
  const caches = getCaches();
  if (!caches) return false;
  const cache = await caches.open(FFMPEG_CACHE_NAME);
  const [jsRes, wasmRes] = await Promise.all([
    cache.match(CORE_JS_URL),
    cache.match(CORE_WASM_URL),
  ]);
  return !!(jsRes && wasmRes);
}

// Preload and store core assets into the cache bucket.
export async function cacheCoreAssets(signal?: AbortSignal): Promise<void> {
  const caches = getCaches();
  if (!caches) throw new Error("Cache Storage API is not available in this environment");
  const cache = await caches.open(FFMPEG_CACHE_NAME);

  // Fetch with no-cache to ensure a fresh copy if CDN updates, but we still store the response in our cache.
  const [js, wasm] = await Promise.all([
    fetch(CORE_JS_URL, { cache: "no-store", signal }),
    fetch(CORE_WASM_URL, { cache: "no-store", signal }),
  ]);
  if (!js.ok) throw new Error(`Failed to fetch ffmpeg-core.js: ${js.status}`);
  if (!wasm.ok) throw new Error(`Failed to fetch ffmpeg-core.wasm: ${wasm.status}`);

  await Promise.all([
    cache.put(CORE_JS_URL, js.clone()),
    cache.put(CORE_WASM_URL, wasm.clone()),
  ]);
}

// Clear our dedicated cache bucket.
export async function clearCoreCache(): Promise<void> {
  const caches = getCaches();
  if (!caches) return; // silently ignore on non-browser
  await caches.delete(FFMPEG_CACHE_NAME);
}

// Read cached responses and convert to blob URLs, to be used with FFmpeg.load({ coreURL, wasmURL }).
export async function getCoreBlobURLsFromCache(): Promise<{ coreURL: string; wasmURL: string } | null> {
  const caches = getCaches();
  if (!caches) return null;
  const cache = await caches.open(FFMPEG_CACHE_NAME);
  const [jsRes, wasmRes] = await Promise.all([
    cache.match(CORE_JS_URL),
    cache.match(CORE_WASM_URL),
  ]);
  if (!jsRes || !wasmRes) return null;

  const [jsBlob, wasmBlob] = await Promise.all([jsRes.blob(), wasmRes.blob()]);
  const coreURL = URL.createObjectURL(jsBlob);
  const wasmURL = URL.createObjectURL(wasmBlob);
  return { coreURL, wasmURL };
}
