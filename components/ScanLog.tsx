import AnnotatedImage from "@/components/AnnotatedImage";
import { BUCKET_LABEL, type ScanResult } from "@/lib/types";

interface ScanLogProps {
  scans: ScanResult[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clampConfidence(value: number) {
  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

export default function ScanLog({ scans }: ScanLogProps) {
  if (scans.length === 0) {
    return (
      <p className="rounded-[12px] border border-dashed border-stone/40 bg-background px-4 py-4 text-sm leading-6 text-stone-600">
        No scans yet. Your completed tray scans will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-600"
        aria-label="Detection legend"
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 border border-dashed border-emerald-600"
          />
          Plate / tray
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 border border-waste bg-waste/15"
          />
          Leftover food
        </span>
      </div>

      <ol className="flex flex-col gap-3">
        {scans
          .slice()
          .reverse()
          .map((scan) => {
            const leftovers = (scan.detections ?? []).filter(
              (d) => d.kind === "leftover",
            );
            const confidence = clampConfidence(scan.confidence);

            return (
              <li
                key={scan.id}
                className="rounded-[12px] border border-line bg-surface p-4"
              >
                <article className="grid gap-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
                  {scan.image_url ? (
                    <AnnotatedImage
                      src={scan.image_url}
                      alt={`Annotated scan of ${scan.dish_name}`}
                      detections={scan.detections}
                    />
                  ) : (
                    <div className="flex min-h-24 items-center justify-center rounded-[8px] border border-dashed border-stone/40 bg-background px-3 text-center text-xs text-stone-500">
                      Image unavailable
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-brand-deep">
                          {scan.dish_name}
                        </h4>
                        <time
                          className="mt-1 block text-xs text-stone-500"
                          dateTime={scan.timestamp}
                        >
                          {formatTime(scan.timestamp)} ·{" "}
                          {scan.source === "camera" ? "Live camera" : "Upload"}
                        </time>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-brand-deep">
                        {scan.yen_wasted != null
                          ? `¥${scan.yen_wasted.toLocaleString()} wasted`
                          : "Cost unavailable"}
                      </p>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <dt className="text-stone-500">Leftovers</dt>
                        <dd className="mt-0.5 font-medium text-brand-deep">
                          {BUCKET_LABEL[scan.remaining_bucket]} (
                          {Math.min(
                            100,
                            Math.max(
                              0,
                              Math.round(scan.remaining_fraction * 100),
                            ),
                          )}
                          %)
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Confidence</dt>
                        <dd className="mt-0.5 font-medium text-brand-deep">
                          {confidence}%
                        </dd>
                      </div>
                    </dl>

                    {scan.reasoning && (
                      <p className="mt-3 text-sm leading-6 text-stone-700">
                        {scan.reasoning}
                      </p>
                    )}

                    {(leftovers.length > 0 ||
                      scan.visible_items?.length > 0) && (
                      <div className="mt-3">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Visible leftovers
                        </h5>
                        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-stone-700">
                          {(leftovers.length > 0
                            ? leftovers.map((d) => d.label)
                            : scan.visible_items
                          ).map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
      </ol>
    </div>
  );
}
