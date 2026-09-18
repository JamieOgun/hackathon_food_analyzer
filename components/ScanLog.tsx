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
    return <p className="text-sm text-zinc-400">No scans yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-dashed border-emerald-400" />
          Plate / tray
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-amber-400 bg-amber-400/15" />
          Leftover food
        </span>
      </div>

      <ul className="flex flex-col gap-3">
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
                className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,11rem)_1fr] dark:border-zinc-800"
              >
                {scan.image_url ? (
                  <AnnotatedImage
                    src={scan.image_url}
                    alt={`Scanned ${scan.dish_name}`}
                    detections={scan.detections ?? []}
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">
                    Sample scan — no image
                  </div>
                )}

                <div className="flex min-w-0 flex-col gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {scan.dish_name}
                    </span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                      {scan.yen_wasted != null
                        ? `¥${scan.yen_wasted.toLocaleString()} wasted`
                        : "—"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      {BUCKET_LABEL[scan.remaining_bucket]} (
                      {Math.round(scan.remaining_fraction * 100)}%)
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {Math.round(scan.confidence * 100)}% confident
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {scan.source === "camera" ? "Live camera" : "Upload"} ·{" "}
                      {formatTime(scan.timestamp)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Reasoning
                    </h4>
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {scan.reasoning ?? (
                        <span className="text-zinc-400">
                          No reasoning recorded for this scan.
                        </span>
                      )}
                    </p>
                  </div>

                  {(leftovers.length > 0 || scan.visible_items.length > 0) && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Detected leftovers
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(leftovers.length > 0
                          ? leftovers.map((d) => d.label)
                          : scan.visible_items
                        ).map((item, i) => (
                          <span
                            key={i}
                            className="rounded-sm bg-amber-400/20 px-1.5 py-0.5 text-xs text-amber-900 dark:text-amber-200"
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
