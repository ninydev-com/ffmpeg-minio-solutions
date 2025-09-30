/**
 * VideoRecorder
 * - Renders a <video> element to preview the camera stream in real-time.
 * - Initializes the camera when mounted (if not initialized yet).
 * - Keeps the preview synced with the current MediaStream from the store.
 * - Does NOT handle starting/stopping; that is done by the dashboard controls.
 *
 * Accessibility and UX notes:
 * - The video is muted and plays inline to allow autoplay on mobile devices.
 * - We provide aria-live regions for non-visual feedback (status and errors).
 */

"use client";

import React, { useEffect, useRef } from "react";
import { useRecorder } from "./context";

export default function VideoRecorder({
  width = 640,
  height = 360,
  className,
  constraints,
}: {
  width?: number;
  height?: number;
  className?: string;
  /** Optional custom constraints (e.g., { video: { width: 1280, height: 720 }, audio: true }) */
  constraints?: MediaStreamConstraints;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { stream, status, errorMessage, init } = useRecorder();

  // Initialize camera on first mount if not ready yet.
  useEffect(() => {
    if (status === "idle") {
      // best effort; errors will be reflected via errorMessage in the store
      init(constraints).catch(() => void 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to <video> element when available.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      // Try to play; some browsers may require user gesture first.
      video.play().catch(() => {
        // ignore autoplay errors; user will interact via controls
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <div className={className}>
      <video
        ref={videoRef}
        width={width}
        height={height}
        muted
        playsInline
        autoPlay
        style={{ backgroundColor: "#000", borderRadius: 8, width: "100%", height: "auto" }}
      />

      {/* Status region for screen readers */}
      <div aria-live="polite" style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
        Status: {status}
      </div>

      {errorMessage && (
        <div role="alert" style={{ marginTop: 8, color: "#b00020", fontSize: 12 }}>
          Error: {errorMessage}
        </div>
      )}
    </div>
  );
}
