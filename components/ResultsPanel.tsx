"use client";

import { useState } from "react";
import ScanLog from "@/components/ScanLog";
import { BUCKET_LABEL, type Recommendation, type ScanResult } from "@/lib/types";

type Tab = "overview" | "log";

interface ResultsPanelProps {
  scans: ScanResult[];
  recommendations: Recommendation[];
  error: string | null;
}

export default function ResultsPanel({
  scans,
  recommendations,
  error,
}: ResultsPanelProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const totalYenWasted = scans.reduce((sum, s) => sum + (s.yen_wasted ?? 0), 0);
  const latestScan = scans[scans.length - 1];

  const tabClass = (t: Tab) =>
    `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
      tab === t
        ? "border-brand text-brand"
        : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex border-b border-stone-200 dark:border-stone-800">
        <button
          type="button"
          className={tabClass("overview")}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={tabClass("log")}
          onClick={() => setTab("log")}
        >
          Scan log ({scans.length})
        </button>
      </div>

      {tab === "log" ? (
        <ScanLog scans={scans} />
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Latest evaluation
            </h3>
            {latestScan ? (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/40">
                <p className="mb-2 font-semibold text-foreground">
                  {latestScan.dish_name}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-300">
                  <li>
                    Whole dish leftover: {Math.round(latestScan.remaining_fraction * 100)}%
                  </li>
                  <li>
                    Evaluation confidence: {Math.round(latestScan.confidence * 100)}%
                  </li>
                  <li>
                    Estimated waste: {latestScan.yen_wasted != null
                      ? `¥${latestScan.yen_wasted.toLocaleString()}`
                      : "Unavailable — dish not on menu"}
                  </li>
                  <li>
                    Timestamp: {new Date(latestScan.timestamp).toLocaleString("ja-JP")}
                  </li>
                </ul>
              </div>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Upload a dish image to see its evaluation.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Top recommendation
            </h3>
            {recommendations.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Scan the same dish a couple of times to surface a pattern.
              </p>
            ) : (
              <div className="rounded-lg border border-waste/40 bg-waste/10 p-4 text-sm text-brand-deep dark:border-waste/50 dark:bg-waste/15 dark:text-waste">
                {recommendations[0].message}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Scans ({scans.length}) &middot;{" "}
              <span className="rounded-sm bg-waste px-1 font-semibold text-brand-deep">
                &yen;{totalYenWasted.toLocaleString()} wasted
              </span>{" "}
              so far
            </h3>
            <ul className="flex max-h-[65dvh] flex-col gap-2 overflow-y-auto pr-1">
              {scans
                .slice()
                .reverse()
                .map((scan) => (
                  <li
                    key={scan.id}
                    className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-sm dark:border-stone-800"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {scan.dish_name}
                      </span>
                      <span className="ml-2 text-stone-500 dark:text-stone-400">
                        {BUCKET_LABEL[scan.remaining_bucket]}
                      </span>
                      {scan.visible_items.length > 0 && (
                        <div className="text-xs text-stone-400">
                          Left behind: {scan.visible_items.join(", ")}
                        </div>
                      )}
                    </div>
                    <span className="font-mono font-medium text-brand-deep dark:text-waste">
                      {scan.yen_wasted != null
                        ? `¥${scan.yen_wasted.toLocaleString()}`
                        : "—"}
                    </span>
                  </li>
                ))}
              {scans.length === 0 && (
                <li className="text-sm text-stone-400">No scans yet.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
