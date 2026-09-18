"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Capture, { type AnalyzeOutcome } from "@/components/Capture";
import ResultsPanel from "@/components/ResultsPanel";
import { buildRecommendations } from "@/lib/agent";
import {
  MOCK_SCAN_SCENARIOS,
  type MockScanScenarioKey,
} from "@/lib/mock-scans";
import type { ScanResult } from "@/lib/types";

export default function Home() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewScenario, setPreviewScenario] =
    useState<MockScanScenarioKey | null>(null);
  const scanImageUrls = useRef<string[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const requested = new URLSearchParams(window.location.search).get(
      "preview",
    );
    if (requested && requested in MOCK_SCAN_SCENARIOS) {
      const timeout = window.setTimeout(
        () => setPreviewScenario(requested as MockScanScenarioKey),
        0,
      );
      return () => window.clearTimeout(timeout);
    }
  }, []);

  useEffect(
    () => () => {
      scanImageUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const recommendations = useMemo(() => buildRecommendations(scans), [scans]);
  const preview = previewScenario ? MOCK_SCAN_SCENARIOS[previewScenario] : null;
  const visibleScans = preview?.scans ?? scans;
  const visibleRecommendations = preview?.recommendations ?? recommendations;
  const visibleError = preview?.error ?? error;

  async function handleImage(
    file: File,
    source: "upload" | "camera",
  ): Promise<AnalyzeOutcome> {
    setPreviewScenario(null);
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("source", source);

      const response = await fetch("/api/estimate", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (body.no_plate && source === "camera") {
          return { kind: "no_plate", reasoning: body.reasoning ?? null };
        }
        throw new Error(body.error ?? `Request failed (${response.status})`);
      }
      const imageUrl = URL.createObjectURL(file);
      scanImageUrls.current.push(imageUrl);
      const result: ScanResult = {
        ...(await response.json()),
        image_url: imageUrl,
      };
      setScans((previous) => [...previous, result]);
      return { kind: "scan", scan: result };
    } catch (requestError) {
      setError((requestError as Error).message);
      return { kind: "error" };
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/96 shadow-[0_3px_9px_rgb(0_0_0/0.03)]">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Image
            src="/mottainai.png"
            alt="MottainAI — less leftovers, more good food"
            width={240}
            height={80}
            priority
            className="h-11 w-auto sm:h-12"
          />

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-stone sm:inline">
              Tray return station
            </span>
            <span className="rounded-full bg-sky-tint px-3 py-1.5 font-medium text-brand tabular-nums">
              {visibleScans.length}{" "}
              {visibleScans.length === 1 ? "scan" : "scans"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <div className="mb-6 max-w-5xl sm:mb-8">
          <h1 className="text-balance text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
            Scan every tray. Improve every serving.
          </h1>
          <p className="mt-5 max-w-2xl font-editorial text-lg leading-7 text-graphite sm:text-xl sm:leading-8">
            Keep the station moving while MottainAI turns every returned plate
            into clear, useful feedback.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
          <section
            aria-labelledby="scanner-heading"
            className="min-w-0 rounded-[12px] border border-line bg-white p-4 sm:p-6 lg:col-span-8"
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  id="scanner-heading"
                  className="text-2xl font-semibold tracking-[-0.02em] text-ink"
                >
                  Tray scanner
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone">
                  Place one tray in view and hold it still for a moment.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  busy ? "bg-marigold text-ink" : "bg-success-tint text-success"
                }`}
              >
                {busy ? "Analyzing tray" : "Ready for next tray"}
              </span>
            </div>

            <Capture onImage={handleImage} busy={busy} />
          </section>

          <ResultsPanel
            scans={visibleScans}
            recommendations={visibleRecommendations}
            error={visibleError}
          />
        </div>

        <p className="mt-8 text-center text-xs leading-5 text-stone">
          This session is stored in this browser tab and resets when the page
          refreshes.
        </p>
      </main>
    </div>
  );
}
