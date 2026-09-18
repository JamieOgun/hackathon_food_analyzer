import type { Recommendation, ScanResult } from "./types";

/** Need at least this many scans of a dish before calling out a pattern. */
const MIN_SCANS_FOR_PATTERN = 2;
/** Below this mean remaining-fraction, it's not worth flagging. */
const WASTE_THRESHOLD = 0.2;
/**
 * Assumed covers/week for a dish, used only to turn a handful of live scans
 * into a relative weekly-¥ figure for the demo. Disclosed, not measured —
 * there's no real order volume behind this build (see docs/hackathon-plan.md).
 */
const ASSUMED_WEEKLY_COVERS = 50;

export function buildRecommendations(scans: ScanResult[]): Recommendation[] {
  const byDish = new Map<string, ScanResult[]>();
  for (const scan of scans) {
    if (!scan.dish_id) continue; // unrecognized dish — no cost basis
    const list = byDish.get(scan.dish_id) ?? [];
    list.push(scan);
    byDish.set(scan.dish_id, list);
  }

  const recommendations: Recommendation[] = [];

  for (const [dish_id, dishScans] of byDish) {
    if (dishScans.length < MIN_SCANS_FOR_PATTERN) continue;

    const n = dishScans.length;
    const mean_remaining_fraction =
      dishScans.reduce((sum, s) => sum + s.remaining_fraction, 0) / n;
    if (mean_remaining_fraction < WASTE_THRESHOLD) continue;

    const meanYenWastedPerCover =
      dishScans.reduce((sum, s) => sum + (s.yen_wasted ?? 0), 0) / n;
    const weekly_yen_wasted = Math.round(
      meanYenWastedPerCover * ASSUMED_WEEKLY_COVERS,
    );

    const dish_name = dishScans[0].dish_name;
    const pct = Math.round(mean_remaining_fraction * 100);
    const cutPct = mean_remaining_fraction >= 0.5 ? 30 : 20;

    recommendations.push({
      dish_id,
      dish_name,
      n,
      mean_remaining_fraction,
      weekly_yen_wasted,
      message:
        `${dish_name} comes back ${pct}% uneaten across ${n} scan${n === 1 ? "" : "s"} — ` +
        `roughly ¥${weekly_yen_wasted.toLocaleString()}/week in food cost at ~${ASSUMED_WEEKLY_COVERS} covers. ` +
        `Cut the portion ~${cutPct}% to recover most of it.`,
    });
  }

  return recommendations.sort((a, b) => b.weekly_yen_wasted - a.weekly_yen_wasted);
}
