"use client";

import { useCallback, useRef, useState } from "react";

type Mode = "upload" | "camera";

interface CaptureProps {
  onImage: (file: File, source: "upload" | "camera") => void;
  busy: boolean;
}

export default function Capture({ onImage, busy }: CaptureProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      // Camera permission denied or unavailable — fall back to upload,
      // never leave the user at a dead screen.
      setCameraError(
        "Camera unavailable or permission denied — use file upload instead.",
      );
      setMode("upload");
    }
  }, []);

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    if (mode === "camera") stopCamera();
    if (next === "upload") setCameraError(null);
    setMode(next);
    if (next === "camera") startCamera();
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

  const handleSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const maxEdge = 1024;
    const scale = Math.min(
      1,
      maxEdge / Math.max(video.videoWidth, video.videoHeight),
    );
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `scan-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setPreviewUrl(URL.createObjectURL(blob));
        onImage(file, "camera");
      },
      "image/jpeg",
      0.8,
    );
  };

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
          Camera
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
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-black"
            muted
            playsInline
          />
          <button
            type="button"
            onClick={handleSnapshot}
            disabled={!streaming || busy}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Scan plate
          </button>
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
