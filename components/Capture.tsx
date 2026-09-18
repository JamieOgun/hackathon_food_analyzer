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
    label: "Learning empty surface — keep the area clear",
    ring: "ring-zinc-400",
    dot: "bg-zinc-400",
  },
  empty: {
    label: "Waiting for a tray",
    ring: "ring-zinc-400",
    dot: "bg-zinc-400",
  },
  moving: {
    label: "Movement detected",
    ring: "ring-sky-400",
    dot: "bg-sky-400",
  },
  settling: {
    label: "Tray detected — holding still…",
    ring: "ring-amber-400",
    dot: "bg-amber-400",
  },
  analyzing: {
    label: "Analyzing tray…",
    ring: "ring-violet-500",
    dot: "bg-violet-500 animate-pulse",
  },
  done: {
    label: "Logged — swap in the next tray",
    ring: "ring-emerald-500",
    dot: "bg-emerald-500",
  },
};

/** Continuity Camera shows up with the phone's name, e.g. "Jamie's iPhone
 * Camera" or "… Desk View Camera" — prefer it over the built-in webcam. */
const PHONE_CAMERA_RE = /iphone|continuity|desk view/i;
const CAMERA_STORAGE_KEY = "leftover-analyzer:camera-id";

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
    if (mode !== "camera") return;
    const onChange = () => void refreshCameras();
    navigator.mediaDevices.addEventListener("devicechange", onChange);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", onChange);
  }, [mode, refreshCameras]);

  useEffect(() => stopCamera, [stopCamera]);

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    if (mode === "camera") stopCamera();
    if (next === "upload") setCameraError(null);
    setMode(next);
    if (next === "camera") void startCamera();
  };

  const handleFile = (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    onImage(file, "upload");
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
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange("upload")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === "upload"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("camera")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === "camera"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          Live camera
        </button>
      </div>

      {cameraError && (
        <p className="text-sm text-red-600 dark:text-red-400">{cameraError}</p>
      )}

      {mode === "upload" && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 hover:border-zinc-400 dark:border-zinc-700">
          <span>Click to choose a plate photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={busy}
          />
        </label>
      )}

      {mode === "camera" && (
        <div className="flex flex-col gap-3">
          {cameras.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              Camera
              <select
                value={cameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
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
              className="w-full bg-black"
              muted
              playsInline
            />
            {streaming && autoDetect && (
              <div className="absolute left-2 top-2 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                <span className={`h-2 w-2 rounded-full ${ui.dot}`} />
                {ui.label}
              </div>
            )}
            {streaming && autoDetect && lastLive?.kind === "no_plate" && (
              <div className="absolute inset-x-2 bottom-2 rounded-md bg-black/75 px-3 py-2 text-xs text-zinc-200">
                <span className="font-semibold text-white">
                  Skipped — no plate seen.
                </span>{" "}
                {lastLive.reasoning}
              </div>
            )}
            {streaming && autoDetect && lastLive?.kind === "scan" && (
              <div className="absolute inset-x-2 bottom-2 rounded-md bg-black/75 px-3 py-2 text-sm text-white">
                <span className="font-semibold">{lastLive.scan.dish_name}</span>{" "}
                · {BUCKET_LABEL[lastLive.scan.remaining_bucket]}
                {lastLive.scan.yen_wasted != null &&
                  ` · ¥${lastLive.scan.yen_wasted} wasted`}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
              />
              Auto-detect trays
            </label>
            <button
              type="button"
              onClick={() => void analyzeCurrentFrame()}
              disabled={!streaming || busy}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
            >
              Analyze now
            </button>
            {autoDetect && (
              <button
                type="button"
                onClick={recalibrate}
                disabled={!streaming}
                className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Re-learn empty surface
              </button>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {previewUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview URL, next/image can't optimize it */}
          <img
            src={previewUrl}
            alt="Last captured plate"
            className="h-20 w-20 rounded-md object-cover"
          />
          <span className="text-sm text-zinc-500">
            {busy ? "Analyzing…" : "Last capture"}
          </span>
        </div>
      )}
    </div>
  );
}
