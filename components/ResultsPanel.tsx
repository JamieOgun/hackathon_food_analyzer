"use client";

import AnnotatedImage from "@/components/AnnotatedImage";
import ScanLog from "@/components/ScanLog";
import {
  BUCKET_LABEL,
  type Recommendation,
  type ScanResult,
} from "@/lib/types";

interface ResultsPanelProps {
  scans: ScanResult[];
  recommendations: Recommendation[];
  error: string | null;
}

function clampConfidence(value: number) {
  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

function formatCost(value: number | null | undefined) {
  return value == null ? null : `¥${value.toLocaleString()}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ResultsPanel({
  scans,
  recommendations,
  error,
}: ResultsPanelProps) {
  const latestScan = scans.at(-1);
  const totalYenWasted = scans.reduce(
    (sum, scan) => sum + (scan.yen_wasted ?? 0),
    0,
  );

  return (
    <div className="contents">
      <section
        className="flex min-w-0 flex-col gap-5 rounded-[12px] border border-line bg-surface p-5 lg:col-span-4"
        aria-labelledby="latest-scan-heading"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2
              id="latest-scan-heading"
              className="text-xl font-semibold tracking-tight text-brand-deep"
            >
              {error && !latestScan ? "Scan needs attention" : "Latest scan"}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {error && !latestScan
                ? "Resolve the issue, then try the tray again."
                : "Immediate feedback for the tray at your station."}
            </p>
          </div>
          {latestScan && (
            <time
              className="shrink-0 text-xs font-medium text-stone-500"
              dateTime={latestScan.timestamp}
            >
              {formatTime(latestScan.timestamp)}
            </time>
          )}
        </div>

        {error && (
          <div
            className="rounded-[8px] border border-danger/30 bg-danger-tint px-4 py-3 text-sm text-danger"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-semibold">The scan could not be completed.</p>
            <p className="mt-1 leading-6">{error}</p>
          </div>
        )}

        {!latestScan ? (
          <div className="flex min-h-48 flex-col justify-center rounded-[12px] border border-dashed border-stone/40 bg-background px-5 py-6">
            <p className="text-base font-semibold text-brand-deep">
              {error ? "No result was saved" : "Ready for the first tray"}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
              {error
                ? "The station is still ready. Retry the scan or switch capture modes."
                : "Capture or upload a tray image. Its dish, leftovers, confidence, and cost will appear here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {latestScan.image_url && (
              <AnnotatedImage
                src={latestScan.image_url}
                alt={`Annotated scan of ${latestScan.dish_name}`}
                detections={latestScan.detections}
                className="max-h-64"
              />
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Recognized dish
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-brand-deep">
                {latestScan.dish_name}
              </h3>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] border border-line bg-background p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Leftovers
                </dt>
                <dd className="mt-1 font-semibold text-brand-deep">
                  {BUCKET_LABEL[latestScan.remaining_bucket]}
                  <span className="ml-1 font-normal text-stone-600">
                    (
                    {Math.min(
                      100,
                      Math.max(
                        0,
                        Math.round(latestScan.remaining_fraction * 100),
                      ),
                    )}
                    %)
                  </span>
                </dd>
              </div>
              <div className="rounded-[8px] border border-line bg-background p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Estimated waste
                </dt>
                <dd className="mt-1 font-semibold text-brand-deep">
                  {formatCost(latestScan.yen_wasted) ?? "Cost unavailable"}
                </dd>
              </div>
            </dl>

            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-brand-deep">
                  Confidence
                </span>
                <span className="tabular-nums text-stone-600">
                  {clampConfidence(latestScan.confidence)}%
                </span>
              </div>
              <div
                className="mt-2 h-2 w-full bg-stone-200"
                role="progressbar"
                aria-label="Recognition confidence"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clampConfidence(latestScan.confidence)}
              >
                <div
                  className="h-full bg-brand"
                  style={{
                    width: `${clampConfidence(latestScan.confidence)}%`,
                  }}
                />
              </div>
            </div>

            {latestScan.yen_wasted == null && (
              <p className="border-l border-stone-300 pl-3 text-sm leading-6 text-stone-600">
                This dish is not in the menu yet, so a yen estimate is not
                available.
              </p>
            )}

            {latestScan.reasoning && (
              <div>
                <h4 className="text-sm font-semibold text-brand-deep">
                  Why this result
                </h4>
                <p className="mt-1 text-sm leading-6 text-stone-700">
                  {latestScan.reasoning}
                </p>
              </div>
            )}

            {latestScan.visible_items?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-brand-deep">
                  Visible leftovers
                </h4>
                <p className="mt-1 text-sm leading-6 text-stone-700">
                  {latestScan.visible_items.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section
        className="lg:col-span-12 flex min-w-0 flex-col gap-6 border-t border-stone-300 pt-6"
        aria-labelledby="scan-patterns-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="scan-patterns-heading"
              className="text-xl font-semibold tracking-tight text-brand-deep"
            >
              Scan patterns
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Recommendations and history stay available while the scanner
              remains primary.
            </p>
          </div>
          <p className="text-sm text-stone-600">
            <span className="font-semibold tabular-nums text-brand-deep">
              {scans.length}
            </span>{" "}
            {scans.length === 1 ? "scan" : "scans"} ·{" "}
            <span className="font-semibold tabular-nums text-brand-deep">
              {formatCost(totalYenWasted) ?? "¥0"}
            </span>{" "}
            estimated waste
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section aria-labelledby="recommendations-heading">
            <h3
              id="recommendations-heading"
              className="text-base font-semibold text-brand-deep"
            >
              Recommendations
            </h3>
            {recommendations.length === 0 ? (
              <p className="mt-3 rounded-[12px] border border-dashed border-stone/40 bg-background px-4 py-4 text-sm leading-6 text-stone-600">
                Scan the same dish twice with meaningful leftovers to surface a
                portion pattern.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {recommendations.map((recommendation) => (
                  <li
                    key={recommendation.dish_id}
                    className="border border-stone-200 bg-waste/15 px-4 py-4"
                  >
                    <p className="text-sm leading-6 text-brand-deep">
                      {recommendation.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="history-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h3
                id="history-heading"
                className="text-base font-semibold text-brand-deep"
              >
                Session history
              </h3>
              <span className="text-xs text-stone-500">Newest first</span>
            </div>
            <div className="mt-3">
              <ScanLog scans={scans} />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
