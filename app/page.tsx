"use client";

import { useMemo, useState } from "react";
import Capture, { type AnalyzeOutcome } from "@/components/Capture";
import ResultsPanel from "@/components/ResultsPanel";
import { buildRecommendations } from "@/lib/agent";
import { SEED_SCANS } from "@/lib/seed";
import type { ScanResult } from "@/lib/types";

export default function Home() {
  const [scans, setScans] = useState<ScanResult[]>(SEED_SCANS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommendations = useMemo(() => buildRecommendations(scans), [scans]);

  async function handleImage(
    file: File,
    source: "upload" | "camera",
  ): Promise<AnalyzeOutcome> {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("source", source);

      const res = await fetch("/api/estimate", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Live camera triggers on anything that settles in view; a frame
        // with no plate is expected there, not an error worth shouting about.
        if (body.no_plate && source === "camera")
          return { kind: "no_plate", reasoning: body.reasoning ?? null };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const result: ScanResult = {
        ...(await res.json()),
        image_url: URL.createObjectURL(file),
      };
      setScans((prev) => [...prev, result]);
      return { kind: "scan", scan: result };
    } catch (err) {
      setError((err as Error).message);
      return { kind: "error" };
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Leftover Analyzer
        </h1>
      </header>
      <main className="grid flex-1 grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Capture
          </h2>
          <Capture onImage={handleImage} busy={busy} />
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Results &amp; recommendation
          </h2>
          <ResultsPanel
            scans={scans}
            recommendations={recommendations}
            error={error}
          />
        </section>
      </main>
    </div>
  );
}
