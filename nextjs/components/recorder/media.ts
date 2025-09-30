// Media-related helpers. Encapsulate browser differences and feature detection.

export function pickSupportedMimeType(candidates: string[]): string | null {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    return null;
  }
  for (const t of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported(t)) {
          return t;
        }
      }
    } catch {
      // continue
    }
  }
  return null;
}

// Cross-browser, safe wrapper around getUserMedia with clear errors.
export async function requestUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof window === "undefined") {
    throw new Error("getUserMedia cannot run on the server");
  }
  if (!window.isSecureContext && location.hostname !== "localhost") {
    throw new Error("MediaDevices API requires a secure context (HTTPS). Please use HTTPS or localhost.");
  }

  type LegacyGUM = (
    c: MediaStreamConstraints,
    onSuccess: (s: MediaStream) => void,
    onError: (e: unknown) => void
  ) => void;

  const anyNavigator = navigator as unknown as {
    mediaDevices?: { getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream> };
    getUserMedia?: LegacyGUM;
    webkitGetUserMedia?: LegacyGUM;
    mozGetUserMedia?: LegacyGUM;
    msGetUserMedia?: LegacyGUM;
  };

  if (anyNavigator.mediaDevices && typeof anyNavigator.mediaDevices.getUserMedia === "function") {
    return anyNavigator.mediaDevices.getUserMedia(constraints);
  }

  const legacy =
    anyNavigator.getUserMedia ||
    anyNavigator.webkitGetUserMedia ||
    anyNavigator.mozGetUserMedia ||
    anyNavigator.msGetUserMedia;

  if (legacy) {
    return new Promise<MediaStream>((resolve, reject) => {
      try {
        legacy.call(navigator, constraints, resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  throw new Error(
    "MediaDevices.getUserMedia is not supported in this browser. Please try a modern browser and ensure HTTPS or localhost."
  );
}
