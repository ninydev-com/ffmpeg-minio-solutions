// Purpose: React hook that manages the FFmpeg Web Worker lifecycle and exposes
// a simple API to load the core (optionally from cache), create a 10s preview, and extract a snapshot.
// It also reports progress and logs for UI.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkerCommand, WorkerEvent, PreviewParams, SnapshotParams } from "./workerMessages";
import { getCoreBlobURLsFromCache } from "../cacheFfmpeg";

// Lightweight state shape for the worker controller
export type WorkerStatus = "idle" | "loading" | "ready" | "working" | "canceled" | "error";

export interface UseFfmpegWorkerState {
  status: WorkerStatus;
  progress: number; // 0..1
  time?: number; // processed time in seconds (approx reported by ffmpeg)
  lastLog?: string;
  error?: string;
  previewUrl?: string; // object URL to processed preview
  snapshotUrl?: string; // object URL to processed image
}

export interface UseFfmpegWorkerApi extends UseFfmpegWorkerState {
  loadCore: (opts?: { preferCache?: boolean }) => Promise<void>;
  makePreview: (file: Blob, opts?: Omit<PreviewParams, "data">) => Promise<void>;
  makeSnapshot: (file: Blob, opts?: Omit<SnapshotParams, "data">) => Promise<void>;
  cancel: () => void;
  terminate: () => void;
}

export function useFfmpegWorker(): UseFfmpegWorkerApi {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseFfmpegWorkerState>({ status: "idle", progress: 0 });
  const previewUrlRef = useRef<string | null>(null);
  const snapshotUrlRef = useRef<string | null>(null);

  // Create worker lazily
  const ensureWorker = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL("./ffmpegWorker.ts", import.meta.url), { type: "module" });
    w.onmessage = (ev: MessageEvent<WorkerEvent>) => {
      const msg = ev.data;
      if (msg.type === "loaded") {
        setState((s) => ({ ...s, status: "ready" }));
        return;
      }
      if (msg.type === "progress") {
        setState((s) => ({ ...s, progress: msg.payload.ratio ?? 0, time: msg.payload.time }));
        return;
      }
      if (msg.type === "log") {
        setState((s) => ({ ...s, lastLog: msg.payload.message }));
        return;
      }
      if (msg.type === "result") {
        const blob = new Blob([msg.payload.data], { type: msg.payload.mime });
        const url = URL.createObjectURL(blob);
        if (msg.payload.kind === "preview") {
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = url;
          setState((s) => ({ ...s, status: "ready", progress: 1, previewUrl: url }));
        } else if (msg.payload.kind === "snapshot") {
          if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
          snapshotUrlRef.current = url;
          setState((s) => ({ ...s, status: "ready", progress: 1, snapshotUrl: url }));
        }
        return;
      }
      if (msg.type === "canceled") {
        setState((s) => ({ ...s, status: "canceled", progress: 0 }));
        return;
      }
      if (msg.type === "terminated") {
        setState({ status: "idle", progress: 0 });
        return;
      }
      if (msg.type === "error") {
        setState((s) => ({ ...s, status: "error", error: msg.payload.message }));
        return;
      }
    };
    workerRef.current = w;
    return w;
  }, []);

  // Cleanup URLs on unmounting
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
      workerRef.current?.terminate?.();
      workerRef.current = null;
    };
  }, []);

  const loadCore = useCallback(async (opts?: { preferCache?: boolean }) => {
    const w = ensureWorker();
    if (!w) return;
    setState((s) => ({ ...s, status: "loading", progress: 0, error: undefined }));

    let payload: { coreURL?: string; wasmURL?: string } | undefined = undefined;
    if (opts?.preferCache !== false) {
      const cached = await getCoreBlobURLsFromCache();
      if (cached) payload = cached;
    }

    const cmd: WorkerCommand = { type: "load", payload };
    w.postMessage(cmd);
  }, [ensureWorker]);

  const makePreview = useCallback(async (file: Blob, opts?: Omit<PreviewParams, "data">) => {
    const w = ensureWorker();
    if (!w) return;
    if (state.status === "working") return;
    setState((s) => ({ ...s, status: "working", progress: 0, error: undefined }));

    const data = await file.arrayBuffer();
    const cmd: WorkerCommand = {
      type: "preview",
      payload: {
        data,
        inputName: opts?.inputName ?? inferInputName(file),
        start: opts?.start ?? 0,
        duration: opts?.duration ?? 10,
        scaleHeight: opts?.scaleHeight,
        scaleWidth: opts?.scaleWidth,
        toMp4: opts?.toMp4 ?? true,
        crf: opts?.crf ?? 28,
        preset: opts?.preset ?? "veryfast",
      },
    };
    w.postMessage(cmd, [data as unknown as ArrayBuffer]);
  }, [ensureWorker, state.status]);

  const makeSnapshot = useCallback(async (file: Blob, opts?: Omit<SnapshotParams, "data">) => {
    const w = ensureWorker();
    if (!w) return;
    if (state.status === "working") return;
    setState((s) => ({ ...s, status: "working", progress: 0, error: undefined }));

    const data = await file.arrayBuffer();
    const cmd: WorkerCommand = {
      type: "snapshot",
      payload: {
        data,
        inputName: opts?.inputName ?? inferInputName(file),
        at: opts?.at ?? 1,
        scaleHeight: opts?.scaleHeight,
        scaleWidth: opts?.scaleWidth,
        quality: opts?.quality ?? 2,
      },
    };
    w.postMessage(cmd, [data as unknown as ArrayBuffer]);
  }, [ensureWorker, state.status]);

  const cancel = useCallback(() => {
    const w = ensureWorker();
    if (!w) return;
    const cmd: WorkerCommand = { type: "cancel" };
    w.postMessage(cmd);
  }, [ensureWorker]);

  const terminate = useCallback(() => {
    const w = ensureWorker();
    if (!w) return;
    const cmd: WorkerCommand = { type: "terminate" };
    w.postMessage(cmd);
    w.terminate();
    workerRef.current = null;
  }, [ensureWorker]);

  return useMemo(() => ({
    ...state,
    loadCore,
    makePreview,
    makeSnapshot,
    cancel,
    terminate,
  }), [state, loadCore, makePreview, makeSnapshot, cancel, terminate]);
}

// Infer a reasonable virtual filename from a Blob's type
function inferInputName(file: Blob): string {
  const ext = mimeToExt(file.type);
  return `input.${ext}`;
}

function mimeToExt(mime: string | undefined): string {
  if (!mime) return "webm";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogv";
  return "webm";
}
