import { BUCKET_LABEL, type Recommendation, type ScanResult } from "@/lib/types";

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
  const totalYenWasted = scans.reduce((sum, s) => sum + (s.yen_wasted ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Top recommendation
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Scan the same dish a couple of times to surface a pattern.
          </p>
        ) : (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {recommendations[0].message}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Scans ({scans.length}) &middot; &yen;{totalYenWasted.toLocaleString()}{" "}
          wasted so far
        </h3>
        <ul className="flex flex-col gap-2">
          {scans
            .slice()
            .reverse()
            .map((scan) => (
              <li
                key={scan.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {scan.dish_name}
                  </span>
                  <span className="ml-2 text-zinc-500">
                    {BUCKET_LABEL[scan.remaining_bucket]}
                  </span>
                  {scan.visible_items.length > 0 && (
                    <div className="text-xs text-zinc-400">
                      Left behind: {scan.visible_items.join(", ")}
                    </div>
                  )}
                </div>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {scan.yen_wasted != null
                    ? `¥${scan.yen_wasted.toLocaleString()}`
                    : "—"}
                </span>
              </li>
            ))}
          {scans.length === 0 && (
            <li className="text-sm text-zinc-400">No scans yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
