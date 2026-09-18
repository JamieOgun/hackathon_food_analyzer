"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SAMPLE_INTERVAL_MS,
  THUMB_H,
  THUMB_W,
  grabThumb,
  initialWatchState,
  stepWatch,
  type WatchPhase,
} from "@/lib/motion";
import { BUCKET_LABEL, type ScanResult } from "@/lib/types";

type Mode = "upload" | "camera";

export type AnalyzeOutcome =
  | { kind: "scan"; scan: ScanResult }
  | { kind: "no_plate"; reasoning: string | null }
  | { kind: "error" };

interface CaptureProps {
  onImage: (file: File, source: "upload" | "camera") => Promise<AnalyzeOutcome>;
  busy: boolean;
}

const PHASE_UI: Record<
  WatchPhase,
  { label: string; ring: string; dot: string }
> = {
  calibrating: {
    label: "Learning the clear surface — keep the area clear",
    ring: "ring-[#94a3b8]",
    dot: "bg-[#64748b]",
  },
  empty: {
    label: "Ready for a tray",
    ring: "ring-[#4d9b6a]",
    dot: "bg-[#278653]",
  },
  moving: {
    label: "Movement detected",
    ring: "ring-[#2584aa]",
    dot: "bg-[#2584aa]",
  },
  settling: {
    label: "Tray detected — hold still",
    ring: "ring-[#c88a17]",
    dot: "bg-[#c88a17]",
  },
  analyzing: {
    label: "Analyzing tray",
    ring: "ring-[#5964c5]",
    dot: "bg-[#5964c5] motion-safe:animate-pulse",
  },
  done: {
    label: "Scan logged — clear the surface",
    ring: "ring-[#278653]",
    dot: "bg-[#278653]",
  },
};

/** Continuity Camera shows up with the phone's name, e.g. "Jamie's iPhone
 * Camera" or "… Desk View Camera" — prefer it over the built-in webcam. */
const PHONE_CAMERA_RE = /iphone|continuity|desk view/i;
const CAMERA_STORAGE_KEY = "mottainai:camera-id";

function readSavedCamera(): string | null {
  try {
    return localStorage.getItem(CAMERA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveCamera(id: string) {
  try {
    localStorage.setItem(CAMERA_STORAGE_KEY, id);
  } catch {
    // Storage blocked (private window) — the choice just won't persist.
  }
}

export default function Capture({ onImage, busy }: CaptureProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [phase, setPhase] = useState<WatchPhase>("calibrating");
  const [lastLive, setLastLive] = useState<AnalyzeOutcome | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchRef = useRef(initialWatchState());
  // Set synchronously around our own requests so the sampling loop never
  // double-fires before the parent's `busy` prop catches up.
  const analyzingRef = useRef(false);
  // Latest parent callback, so the sampling loop isn't torn down and
  // restarted every time the page re-renders with a new function identity.
  const onImageRef = useRef(onImage);
  useEffect(() => {
    onImageRef.current = onImage;
  });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const refreshCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const all = await navigator.mediaDevices.enumerateDevices();
    const cams = all.filter((d) => d.kind === "videoinput");
    setCameras(cams);
    return cams;
  }, []);

  /** Open a stream on `id` (or the browser's default) and return the
   * device id actually in use. */
  const openStream = useCallback(async (id?: string) => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    const stream = await navigator.mediaDevices.getUserMedia({
      video: id
        ? { deviceId: { exact: id }, width: { ideal: 1920 } }
        : { facingMode: "environment" },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    return stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
  }, []);

  const startCamera = useCallback(
    async (requestedId?: string) => {
      setCameraError(null);
      try {
        const saved = requestedId ?? readSavedCamera();
        let activeId: string;
        try {
          activeId = await openStream(saved ?? undefined);
        } catch (err) {
          // Saved camera unplugged (e.g. iPhone out of range) — use default.
          if (!saved) throw err;
          activeId = await openStream();
        }

        // Device labels are only readable after permission is granted, so
        // look for a phone camera now and switch to it on first run.
        const cams = await refreshCameras();
        if (!saved) {
          const phone = cams.find((c) => PHONE_CAMERA_RE.test(c.label));
          if (phone && phone.deviceId !== activeId) {
            activeId = await openStream(phone.deviceId);
          }
        }

        setCameraId(activeId);
        watchRef.current = initialWatchState();
        setPhase("calibrating");
        setLastLive(null);
        setStreaming(true);
      } catch {
        // Camera permission denied or unavailable — fall back to upload,
        // never leave the user at a dead screen.
        stopCamera();
        setCameraError(
          "Camera unavailable or permission denied — use file upload instead.",
        );
        setMode("upload");
      }
    },
    [openStream, refreshCameras, stopCamera],
  );

  const handleCameraChange = (id: string) => {
    saveCamera(id);
    void startCamera(id);
  };

  // Pick up an iPhone that connects (or drops) after the camera started.
  useEffect(() => {
    if (mode !== "camera" || !navigator.mediaDevices?.addEventListener) return;
    const onChange = () => void refreshCameras();
    navigator.mediaDevices.addEventListener("devicechange", onChange);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", onChange);
  }, [mode, refreshCameras]);

  useEffect(() => stopCamera, [stopCamera]);

  // Preview URLs are browser-owned resources. Revoke each prior preview so
  // repeated scans do not retain every captured blob in memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    if (mode === "camera") stopCamera();
    if (next === "upload") setCameraError(null);
    setMode(next);
    if (next === "camera") void startCamera();
  };

  const handleFile = (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    void onImage(file, "upload");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const captureFrame = useCallback((): Promise<File | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return Promise.resolve(null);

    const maxEdge = 1024;
    const scale = Math.min(
      1,
      maxEdge / Math.max(video.videoWidth, video.videoHeight),
    );
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) =>
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          setPreviewUrl(URL.createObjectURL(blob));
          resolve(
            new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" }),
          );
        },
        "image/jpeg",
        0.8,
      ),
    );
  }, []);

  const analyzeCurrentFrame = useCallback(async () => {
    if (analyzingRef.current) return;
    analyzingRef.current = true;
    // Mark the scene as handled so auto-detect doesn't re-log a tray that
    // was just analyzed manually via "Analyze now".
    const watch = watchRef.current;
    if (watch.prev) watch.lastAnalyzed = watch.prev;
    try {
      const file = await captureFrame();
      if (!file) return;
      const outcome = await onImageRef.current(file, "camera");
      setLastLive(outcome);
      if (outcome.kind === "no_plate") {
        // What settled was just the surface (lighting shift, a moved
        // object) — adopt it as the new empty reference.
        if (watch.lastAnalyzed) watch.background = watch.lastAnalyzed;
      }
    } finally {
      analyzingRef.current = false;
    }
  }, [captureFrame]);

  // Sampling loop: diff tiny thumbnails on-device, and only call the vision
  // model once a new tray has settled in view.
  useEffect(() => {
    if (!streaming || !autoDetect) return;
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = THUMB_W;
    thumbCanvas.height = THUMB_H;
    const ctx = thumbCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const frame = grabThumb(video, ctx);
      const { phase: next, trigger } = stepWatch(
        watchRef.current,
        frame,
        performance.now(),
        analyzingRef.current,
      );
      setPhase(next);
      if (trigger) void analyzeCurrentFrame();
    }, SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [streaming, autoDetect, analyzeCurrentFrame]);

  const recalibrate = () => {
    watchRef.current = initialWatchState();
    setPhase("calibrating");
    setLastLive(null);
  };

  const ui = PHASE_UI[phase];

  return (
    <div className="flex min-w-0 flex-col gap-4 text-charcoal">
      <div
        className="grid min-w-0 grid-cols-2 gap-1 rounded-[12px] border border-line bg-paper-deep p-1"
        role="group"
        aria-label="Capture mode"
      >
        <button
          type="button"
          aria-pressed={mode === "upload"}
          aria-controls="upload-panel"
          onClick={() => handleModeChange("upload")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === "upload"
              ? "min-h-11 bg-white text-brand"
              : "min-h-11 text-stone hover:bg-white/70 hover:text-charcoal"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          aria-pressed={mode === "camera"}
          aria-controls="camera-panel"
          onClick={() => handleModeChange("camera")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === "camera"
              ? "min-h-11 bg-white text-brand"
              : "min-h-11 text-stone hover:bg-white/70 hover:text-charcoal"
          }`}
        >
          Live camera
        </button>
      </div>

      <div
        className="flex min-h-11 items-center gap-3 rounded-[8px] border border-line bg-paper px-3 py-2.5 text-sm font-medium text-graphite"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-stone"
          aria-hidden="true"
        />
        <span>
          {busy
            ? "Sending the captured tray for analysis"
            : mode === "camera"
              ? streaming
                ? ui.label
                : "Starting camera"
              : previewUrl
                ? "Photo ready to review"
                : "Ready for a photo"}
        </span>
      </div>

      {cameraError && (
        <div
          role="alert"
          className="rounded-[8px] border border-danger/30 bg-danger-tint px-4 py-3 text-sm text-danger"
        >
          {cameraError}
        </div>
      )}

      {mode === "upload" && (
        <div id="upload-panel" aria-label="Upload a tray photo">
          <label className="group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[12px] border-2 border-dashed border-stone/45 bg-paper px-6 py-10 text-center text-sm text-stone transition-colors motion-reduce:transition-none hover:border-brand hover:bg-sky-tint focus-within:border-brand">
            <span className="text-base font-semibold text-ink">
              {previewUrl
                ? "Choose a different tray photo"
                : "Choose a tray photo"}
            </span>
            <span>
              {previewUrl
                ? "The last capture is shown below."
                : "JPG, PNG, or HEIC. Use one tray in view."}
            </span>
            {previewUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview URL, next/image can't optimize it */}
                <img
                  src={previewUrl}
                  alt="Last captured tray"
                  className="mt-3 h-32 w-full max-w-xs object-cover"
                />
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileInput}
              disabled={busy}
            />
          </label>
        </div>
      )}

      {mode === "camera" && (
        <div
          id="camera-panel"
          aria-label="Live camera capture"
          className="flex flex-col gap-4"
        >
          {cameras.length > 0 && (
            <label
              htmlFor="camera-select"
              className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[#334155]"
            >
              Camera source
              <select
                id="camera-select"
                value={cameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-[8px] border border-line bg-white px-3 py-2 text-sm text-charcoal"
              >
                {cameras.map((c, i) => (
                  <option key={c.deviceId || i} value={c.deviceId}>
                    {c.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div
            className={`relative overflow-hidden rounded-lg ${
              streaming && autoDetect ? `ring-4 ${ui.ring}` : ""
            } transition-shadow`}
          >
            <video
              ref={videoRef}
              className="aspect-[4/3] w-full bg-midnight object-cover"
              muted
              playsInline
              aria-label="Live tray camera preview"
            />
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-midnight px-6 text-center text-white">
                <p className="text-sm font-semibold">
                  Connecting to the camera
                </p>
                <p className="max-w-xs text-xs leading-5 text-[#c7d0dd]">
                  Allow camera access, then place one tray under the lens.
                </p>
              </div>
            )}
            {streaming && autoDetect && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-midnight/95 px-3 py-2 text-xs font-semibold text-white">
                <span className={`h-2 w-2 rounded-full ${ui.dot}`} />
                {ui.label}
              </div>
            )}
            {streaming && autoDetect && lastLive?.kind === "no_plate" && (
              <div className="absolute inset-x-3 bottom-3 border border-[#f3d4cc] bg-[#fff8f5] px-3 py-2.5 text-xs text-[#7d3328]">
                <span className="font-semibold">No plate found.</span>{" "}
                {lastLive.reasoning ??
                  "Clear the surface and try the next tray."}
              </div>
            )}
            {streaming && autoDetect && lastLive?.kind === "scan" && (
              <div className="absolute inset-x-3 bottom-3 border border-[#b9d6c5] bg-[#f1fbf4] px-3 py-2.5 text-sm text-[#205c3b]">
                <span className="font-semibold">{lastLive.scan.dish_name}</span>{" "}
                · {BUCKET_LABEL[lastLive.scan.remaining_bucket]}
                {lastLive.scan.yen_wasted != null &&
                  ` · ¥${lastLive.scan.yen_wasted} wasted`}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e0d9cf] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-[#475467]">
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                className="h-5 w-5 accent-[#1b61d1]"
              />
              Auto-detect settled trays
            </label>
            <button
              type="button"
              onClick={() => void analyzeCurrentFrame()}
              disabled={!streaming || busy}
              className="min-h-11 rounded-[9px] bg-[#1b61d1] px-4 py-2 text-sm font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-[#164fae] disabled:cursor-not-allowed disabled:bg-[#aeb7c5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b61d1]"
            >
              Analyze now
            </button>
            {autoDetect && (
              <button
                type="button"
                onClick={recalibrate}
                disabled={!streaming}
                className="min-h-11 rounded-[9px] border border-[#c8c1b7] bg-white px-3 py-2 text-sm font-semibold text-[#475467] transition-colors motion-reduce:transition-none hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b61d1]"
              >
                Re-learn empty surface
              </button>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {previewUrl && mode === "camera" && (
        <div className="flex items-center gap-3 border-t border-[#e0d9cf] pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview URL, next/image can't optimize it */}
          <img
            src={previewUrl}
            alt="Last captured plate"
            className="h-20 w-20 rounded-[10px] object-cover"
          />
          <span className="text-sm text-[#667085]">
            {busy ? "Analyzing…" : "Last capture"}
          </span>
        </div>
      )}
    </div>
  );
}
