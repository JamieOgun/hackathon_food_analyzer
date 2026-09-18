import AnnotatedImage from "@/components/AnnotatedImage";
import { BUCKET_LABEL, type ScanResult } from "@/lib/types";

interface ScanLogProps {
  scans: ScanResult[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ScanLog({ scans }: ScanLogProps) {
  if (scans.length === 0) {
    return <p className="text-sm text-stone-400">No scans yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-dashed border-emerald-400" />
          Plate / tray
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-waste bg-waste/15" />
          Leftover food
        </span>
      </div>

      <ul className="flex max-h-[65dvh] flex-col gap-3 overflow-y-auto pr-1">
        {scans
          .slice()
          .reverse()
          .map((scan) => {
            const leftovers = (scan.detections ?? []).filter(
              (d) => d.kind === "leftover",
            );
            return (
              <li
                key={scan.id}
                className={`grid gap-3 rounded-lg border border-stone-200 p-3 dark:border-stone-800 ${
                  scan.image_url
                    ? "grid-cols-[7rem_1fr] sm:grid-cols-[minmax(0,11rem)_1fr]"
                    : "grid-cols-1"
                }`}
              >
                {scan.image_url && (
                  <AnnotatedImage
                    src={scan.image_url}
                    alt={`Scanned ${scan.dish_name}`}
                    detections={scan.detections ?? []}
                  />
                )}

                <div className="flex min-w-0 flex-col gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      {scan.dish_name}
                    </span>
                    <span className="font-mono font-medium text-brand-deep dark:text-waste">
                      {scan.yen_wasted != null
                        ? `¥${scan.yen_wasted.toLocaleString()} wasted`
                        : "—"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-waste/15 px-2 py-0.5 font-medium text-brand-deep dark:bg-waste/20 dark:text-waste">
                      {BUCKET_LABEL[scan.remaining_bucket]} (
                      {Math.round(scan.remaining_fraction * 100)}%)
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {Math.round(scan.confidence * 100)}% confident
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {scan.source === "camera" ? "Live camera" : "Upload"} ·{" "}
                      {formatTime(scan.timestamp)}
                    </span>
                  </div>

                  {scan.reasoning && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                        Reasoning
                      </h4>
                      <p className="text-stone-700 dark:text-stone-300">
                        {scan.reasoning}
                      </p>
                    </div>
                  )}

                  {(leftovers.length > 0 || scan.visible_items.length > 0) && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                        Detected leftovers
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(leftovers.length > 0
                          ? leftovers.map((d) => d.label)
                          : scan.visible_items
                        ).map((item, i) => (
                          <span
                            key={i}
                            className="rounded-sm bg-waste/20 px-1.5 py-0.5 text-xs text-brand-deep dark:bg-waste/25 dark:text-waste"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
