"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Capture, { type AnalyzeOutcome } from "@/components/Capture";
import ResultsPanel from "@/components/ResultsPanel";
import { buildRecommendations } from "@/lib/agent";
import { useMottainaiVoice } from "@/lib/useMottainaiVoice";
import type { ScanResult } from "@/lib/types";

export default function Home() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voice = useMottainaiVoice();
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
      // Praise a clean plate; otherwise scold, angrier the more is left.
      void voice.say(result.remaining_bucket);
      return { kind: "scan", scan: result };
    } catch (err) {
      setError((err as Error).message);
      return { kind: "error" };
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Light bar: the wordmark is navy on transparent, so it needs a light
          ground; the navy stripe keeps the brand color. */}
      <header className="border-b-4 border-brand-deep bg-white px-4 py-1 sm:px-5">
        <h1>
          <Image
            src="/mottainai.png"
            alt="MottainAI — less leftovers, more good food"
            width={240}
            height={80}
            loading="eager"
            className="h-16 w-auto sm:h-20"
          />
        </h1>
      </header>
      <main className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 md:gap-6 md:p-6">
        <section className="rounded-lg border border-stone-200 bg-surface p-4 dark:border-stone-800">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Capture
          </h2>
          <Capture onImage={handleImage} busy={busy} />
        </section>
        <section className="rounded-lg border border-stone-200 bg-surface p-4 dark:border-stone-800">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
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
