"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { RecorderApi } from "./types";
import { initialState, reducer } from "./reducer";
import { pickSupportedMimeType, requestUserMedia } from "./media";

const RecorderContext = createContext<RecorderApi | null>(null);

export function RecorderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const urlRef = useRef<string | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  const cleanup = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
    }

    try {
      state.recorder?.stop();
    } catch {
      // ignore
    }

    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    dispatch({ type: "SET_STREAM", stream: null });
    dispatch({ type: "SET_RECORDER", recorder: null, mimeType: state.mimeType });
    dispatch({ type: "SET_BLOB", blob: null });
    dispatch({ type: "SET_OBJECT_URL", url: null });
    dispatch({ type: "CLEAR_CHUNKS" });
    chunksRef.current = [];
    dispatch({ type: "SET_STATUS", status: "idle" });
  }, [state.stream, state.recorder, state.mimeType]);

  const init = useCallback(async (constraints?: MediaStreamConstraints) => {
    if (typeof window === "undefined") return;

    try {
      const defaultConstraints: MediaStreamConstraints = { video: true, audio: true };
      const stream = await requestUserMedia(constraints ?? defaultConstraints);

      const mimeCandidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      const picked = pickSupportedMimeType(mimeCandidates);

      const recorder = picked ? new MediaRecorder(stream, { mimeType: picked }) : new MediaRecorder(stream);

      dispatch({ type: "SET_STREAM", stream });
      dispatch({ type: "SET_RECORDER", recorder, mimeType: picked });
      dispatch({ type: "SET_STATUS", status: "ready" });
      dispatch({ type: "CLEAR_CHUNKS" });
      dispatch({ type: "SET_BLOB", blob: null });
      dispatch({ type: "SET_OBJECT_URL", url: null });

      recorder.ondataavailable = (e: Event & { data?: Blob }) => {
        const maybe = (e as unknown as { data?: Blob }).data;
        const data = maybe && maybe.size > 0 ? maybe : undefined;
        if (data && data.size > 0) {
          chunksRef.current.push(data);
          dispatch({ type: "PUSH_CHUNK", chunk: data });
        }
      };
      recorder.onerror = (e: unknown) => {
        const message = (e as { error?: { message?: string } })?.error?.message ?? "Recorder error";
        dispatch({ type: "SET_ERROR", message });
      };
      recorder.onstop = () => {
        const type = picked || "video/webm";
        const blob = new Blob(chunksRef.current, { type });
        dispatch({ type: "SET_BLOB", blob });
        dispatch({ type: "CLEAR_CHUNKS" });
        chunksRef.current = [];

        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
        }
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        dispatch({ type: "SET_OBJECT_URL", url });
        dispatch({ type: "SET_STATUS", status: "stopped" });
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ type: "SET_ERROR", message });
    }
  }, []);

  const start = useCallback(() => {
    if (!state.recorder || state.status === "recording") return;
    try {
      dispatch({ type: "CLEAR_CHUNKS" });
      chunksRef.current = [];
      state.recorder.start();
      dispatch({ type: "SET_STATUS", status: "recording" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ type: "SET_ERROR", message });
    }
  }, [state.recorder, state.status]);

  const stop = useCallback(() => {
    if (!state.recorder || state.status !== "recording") return;
    try {
      state.recorder.stop();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ type: "SET_ERROR", message });
    }
  }, [state.recorder, state.status]);

  const reset = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    dispatch({ type: "SET_OBJECT_URL", url: null });
    dispatch({ type: "CLEAR_CHUNKS" });
    chunksRef.current = [];
    dispatch({ type: "SET_STATUS", status: state.stream ? "ready" : "idle" });
  }, [state.stream]);

  const value: RecorderApi = useMemo(
    () => ({
      ...state,
      init,
      start,
      stop,
      reset,
      cleanup,
    }),
    [state, init, start, stop, reset, cleanup]
  );

  return <RecorderContext.Provider value={value}>{children}</RecorderContext.Provider>;
}

export function useRecorder(): RecorderApi {
  const ctx = useContext(RecorderContext);
  if (!ctx) {
    throw new Error("useRecorder must be used within a RecorderProvider");
  }
  return ctx;
}
