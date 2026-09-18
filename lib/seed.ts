import type { ScanResult } from "./types";

/**
 * Known-good scans, run through the real pipeline once before the demo and
 * hardcoded here. Keeps the results list and recommendation card non-empty
 * at cold start, and gives the demo something to show if live vision fails
 * entirely on stage (see docs/hackathon-plan.md, risk R1).
 */
export const SEED_SCANS: ScanResult[] = [
  {
    id: "seed-1",
    source: "upload",
    timestamp: "2026-09-18T10:00:00.000Z",
    dish_name: "Pork Katsu Set",
    remaining_bucket: "half",
    remaining_fraction: 0.4,
    visible_items: ["rice", "shredded cabbage"],
    confidence: 0.91,
    dish_id: "katsu_set",
    food_cost_yen: 420,
    yen_wasted: 168,
  },
  {
    id: "seed-2",
    source: "upload",
    timestamp: "2026-09-18T10:05:00.000Z",
    dish_name: "Pork Katsu Set",
    remaining_bucket: "most",
    remaining_fraction: 0.7,
    visible_items: ["rice", "katsu", "shredded cabbage"],
    confidence: 0.88,
    dish_id: "katsu_set",
    food_cost_yen: 420,
    yen_wasted: 294,
  },
  {
    id: "seed-3",
    source: "upload",
    timestamp: "2026-09-18T10:10:00.000Z",
    dish_name: "Pork Katsu Set",
    remaining_bucket: "light",
    remaining_fraction: 0.15,
    visible_items: ["rice"],
    confidence: 0.85,
    dish_id: "katsu_set",
    food_cost_yen: 420,
    yen_wasted: 63,
  },
  {
    id: "seed-4",
    source: "upload",
    timestamp: "2026-09-18T10:15:00.000Z",
    dish_name: "Salmon Teishoku",
    remaining_bucket: "light",
    remaining_fraction: 0.15,
    visible_items: ["miso soup"],
    confidence: 0.93,
    dish_id: "salmon_teishoku",
    food_cost_yen: 550,
    yen_wasted: 83,
  },
  {
    id: "seed-5",
    source: "upload",
    timestamp: "2026-09-18T10:20:00.000Z",
    dish_name: "Salmon Teishoku",
    remaining_bucket: "empty",
    remaining_fraction: 0,
    visible_items: [],
    confidence: 0.95,
    dish_id: "salmon_teishoku",
    food_cost_yen: 550,
    yen_wasted: 0,
  },
];
