// Purpose: Dedicated Web Worker that runs @ffmpeg/ffmpeg off the main thread.
// It accepts commands to load the core, make a short preview clip, and extract a snapshot.
// Communication uses postMessage with small, typed payloads defined in workerMessages.ts.

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { WorkerCommand, WorkerEvent, PreviewParams, SnapshotParams } from "./workerMessages";
import { CORE_JS_URL, CORE_WASM_URL } from "../cacheFfmpeg";

// We keep a single FFmpeg instance in the worker. We recreate it on cancel/terminate.
let ffmpeg: FFmpeg | null = null;
let loading = false;
let busy = false;

function post(event: WorkerEvent) {
  // @ts-ignore
  self.postMessage(event, { transfer: event.type === "result" ? [(event as any).payload.data] : [] });
}

async function ensureLoaded(coreURL?: string, wasmURL?: string) {
  if (ffmpeg && !loading) return;
  if (!ffmpeg) ffmpeg = new FFmpeg();
  if (loading) return; // another call in-flight

  loading = true;

  // Wire logs and progress to the main thread
  ffmpeg!.on("log", ({ message }) => post({ type: "log", payload: { message } }));
  ffmpeg!.on("progress", ({ progress, time }) => post({ type: "progress", payload: { ratio: progress, time } }));

  // Use provided core URLs (likely from Cache Storage as blob: URLs). Fallback to CDN via toBlobURL.
  const resolvedCoreURL = coreURL || (await toBlobURL(CORE_JS_URL, "text/javascript"));
  const resolvedWasmURL = wasmURL || (await toBlobURL(CORE_WASM_URL, "application/wasm"));

  await ffmpeg!.load({ coreURL: resolvedCoreURL, wasmURL: resolvedWasmURL });
  loading = false;
  post({ type: "loaded" });
}

function scaleFilter(opts: { width?: number; height?: number }): string[] {
  const vf: string[] = [];
  if (opts.height && !opts.width) vf.push(`scale=-2:${opts.height}`);
  if (opts.width && !opts.height) vf.push(`scale=${opts.width}:-2`);
  if (opts.width && opts.height) vf.push(`scale=${opts.width}:${opts.height}`);
  return vf.length ? ["-vf", vf.join(",")] : [];
}

async function doPreview(p: PreviewParams) {
  if (!ffmpeg) throw new Error("FFmpeg is not loaded");
  busy = true;
  try {
    const inputName = p.inputName || "input.webm";
    const data = new Uint8Array(p.data);
    await ffmpeg.writeFile(inputName, data);

    const start = p.start ?? 0;
    const duration = p.duration ?? 10;

    const vf = scaleFilter({ width: p.scaleWidth, height: p.scaleHeight });

    let outName = "preview.mp4";
    let args: string[];

    if (p.toMp4 !== false) {
      // Universal path: H.264/AAC in MP4
      const crf = String(p.crf ?? 28);
      const preset = p.preset ?? "veryfast";
      args = [
        "-ss", String(start),
        "-t", String(duration),
        "-i", inputName,
        ...vf,
        "-c:v", "libx264",
        "-preset", preset,
        "-crf", crf,
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        outName,
      ];
    } else {
      // Fast path: keep container/codecs (works best for WebM)
      outName = "preview.webm";
      args = [
        "-ss", String(start),
        "-t", String(duration),
        "-i", inputName,
        ...vf,
        "-c", "copy",
        outName,
      ];
    }

    await ffmpeg.exec(args);

    const outData = (await ffmpeg.readFile(outName)) as Uint8Array;
    post({ type: "result", payload: { kind: "preview", name: outName,
            mime: outName.endsWith(".mp4") ? "video/mp4" : "video/webm", data: outData.buffer } });
  } finally {
    // Clean up written files to keep FS lean
    try { await ffmpeg.deleteFile("preview.mp4"); } catch {}
    try { await ffmpeg.deleteFile("preview.webm"); } catch {}
    try { await ffmpeg.deleteFile(p.inputName || "input.webm"); } catch {}
    busy = false;
  }
}

async function doSnapshot(p: SnapshotParams) {
  if (!ffmpeg) throw new Error("FFmpeg is not loaded");
  busy = true;
  try {
    const inputName = p.inputName || "input.webm";
    const data = new Uint8Array(p.data);
    await ffmpeg.writeFile(inputName, data);

    const at = p.at ?? 1;
    const vf = scaleFilter({ width: p.scaleWidth, height: p.scaleHeight });
    const outName = "thumb.jpg";

    const args = [
      "-ss", String(at),
      "-i", inputName,
      "-frames:v", "1",
      "-q:v", String(p.quality ?? 2),
      ...vf,
      outName,
    ];

    await ffmpeg.exec(args);
    const outData = (await ffmpeg.readFile(outName)) as Uint8Array;
    post({ type: "result", payload: { kind: "snapshot", name: outName, mime: "image/jpeg", data: outData.buffer } });
  } finally {
    try { await ffmpeg.deleteFile("thumb.jpg"); } catch {}
    try { await ffmpeg.deleteFile(p.inputName || "input.webm"); } catch {}
    busy = false;
  }
}

function cancelCurrent() {
  // There's no fine-grained cancel, so terminate and recreate the instance.
  if (!ffmpeg) return;
  try { ffmpeg.terminate(); } catch {}
  ffmpeg = null;
  loading = false;
  busy = false;
  post({ type: "canceled" });
}

// Message handler from the main thread
self.onmessage = async (ev: MessageEvent<WorkerCommand>) => {
  const msg = ev.data;
  try {
    if (msg.type === "load") {
      await ensureLoaded(msg.payload?.coreURL, msg.payload?.wasmURL);
      return;
    }

    if (msg.type === "preview") {
      await ensureLoaded();
      if (busy) throw new Error("FFmpeg worker is busy");
      await doPreview(msg.payload);
      return;
    }

    if (msg.type === "snapshot") {
      await ensureLoaded();
      if (busy) throw new Error("FFmpeg worker is busy");
      await doSnapshot(msg.payload);
      return;
    }

    if (msg.type === "cancel") {
      cancelCurrent();
      return;
    }

    if (msg.type === "terminate") {
      cancelCurrent();
      post({ type: "terminated" });
      return;
    }
  } catch (e: any) {
    post({ type: "error", payload: { message: e?.message || String(e) } });
  }
};
