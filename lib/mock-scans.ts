import type { Recommendation, ScanResult } from "@/lib/types";

/** Stable states for reviewing the scanning workspace without a camera or API. */
export type MockScanScenarioKey = "empty" | "single" | "many" | "error";

export interface MockScanScenario {
  label: string;
  description: string;
  scans: ScanResult[];
  recommendations: Recommendation[];
  error: string | null;
}

const singleScan: ScanResult = {
  id: "preview-scan-001",
  source: "camera",
  timestamp: "2026-09-18T09:14:00+09:00",
  dish_name: "Pork Katsu Set",
  remaining_bucket: "light",
  remaining_fraction: 0.15,
  confidence: 0.94,
  plate_present: true,
  reasoning:
    "The plate is clearly visible. Most of the set has been eaten, with a small amount of rice and cabbage remaining.",
  visible_items: ["Rice", "Cabbage"],
  detections: [
    { label: "Plate", kind: "plate", box: [105, 84, 895, 912] },
    { label: "Rice", kind: "leftover", box: [356, 388, 548, 546] },
    { label: "Cabbage", kind: "leftover", box: [592, 272, 731, 412] },
  ],
  dish_id: "katsu_set",
  food_cost_yen: 420,
  yen_wasted: 63,
  image_url: "/mocks/tray-katsu.png",
};

const manyScans: ScanResult[] = [
  {
    id: "preview-scan-101",
    source: "camera",
    timestamp: "2026-09-18T09:08:00+09:00",
    dish_name: "Pork Katsu Set",
    remaining_bucket: "half",
    remaining_fraction: 0.4,
    confidence: 0.92,
    plate_present: true,
    reasoning: "A clear tray view shows about half of the set remaining.",
    visible_items: ["Rice", "Katsu", "Cabbage"],
    detections: [
      { label: "Plate", kind: "plate", box: [90, 76, 910, 923] },
      { label: "Rice", kind: "leftover", box: [278, 338, 543, 602] },
      { label: "Katsu", kind: "leftover", box: [548, 362, 768, 604] },
    ],
    dish_id: "katsu_set",
    food_cost_yen: 420,
    yen_wasted: 168,
    image_url: "/mocks/tray-katsu.png",
  },
  {
    id: "preview-scan-102",
    source: "upload",
    timestamp: "2026-09-18T09:10:00+09:00",
    dish_name: "Pork Katsu Set",
    remaining_bucket: "most",
    remaining_fraction: 0.7,
    confidence: 0.89,
    plate_present: true,
    reasoning:
      "The tray contains most of the original serving, including the main and side portions.",
    visible_items: ["Rice", "Katsu", "Cabbage", "Miso soup"],
    detections: [
      { label: "Plate", kind: "plate", box: [96, 82, 904, 918] },
      { label: "Rice", kind: "leftover", box: [240, 310, 532, 636] },
      { label: "Katsu", kind: "leftover", box: [516, 286, 786, 638] },
    ],
    dish_id: "katsu_set",
    food_cost_yen: 420,
    yen_wasted: 294,
    image_url: "/mocks/tray-katsu.png",
  },
  {
    id: "preview-scan-103",
    source: "camera",
    timestamp: "2026-09-18T09:12:00+09:00",
    dish_name: "Salmon Teishoku",
    remaining_bucket: "light",
    remaining_fraction: 0.15,
    confidence: 0.96,
    plate_present: true,
    reasoning:
      "The meal is mostly finished, with a small portion of rice and vegetables visible.",
    visible_items: ["Rice", "Pickles"],
    detections: [
      { label: "Plate", kind: "plate", box: [104, 90, 897, 914] },
      { label: "Rice", kind: "leftover", box: [372, 402, 556, 548] },
    ],
    dish_id: "salmon_teishoku",
    food_cost_yen: 550,
    yen_wasted: 83,
  },
  {
    id: "preview-scan-104",
    source: "camera",
    timestamp: "2026-09-18T09:13:00+09:00",
    dish_name: "Miso Ramen",
    remaining_bucket: "half",
    remaining_fraction: 0.4,
    confidence: 0.87,
    plate_present: true,
    reasoning:
      "The bowl and remaining noodles are visible, but steam slightly softens the detection.",
    visible_items: ["Noodles", "Corn", "Green onion"],
    detections: [
      { label: "Bowl", kind: "plate", box: [122, 118, 874, 882] },
      { label: "Noodles", kind: "leftover", box: [350, 354, 700, 658] },
    ],
    dish_id: "miso_ramen",
    food_cost_yen: 380,
    yen_wasted: 152,
  },
];

const manyRecommendations: Recommendation[] = [
  {
    dish_id: "katsu_set",
    dish_name: "Pork Katsu Set",
    n: 2,
    mean_remaining_fraction: 0.55,
    weekly_yen_wasted: 11550,
    message:
      "Preview recommendation: review Pork Katsu Set portions. The last 2 demo scans averaged 55% remaining.",
  },
];

export const MOCK_SCAN_SCENARIOS: Record<
  MockScanScenarioKey,
  MockScanScenario
> = {
  empty: {
    label: "Empty station",
    description: "No scans yet; shows the ready-to-scan state.",
    scans: [],
    recommendations: [],
    error: null,
  },
  single: {
    label: "Single successful scan",
    description: "One camera scan with a recognized dish and cost estimate.",
    scans: [singleScan],
    recommendations: [],
    error: null,
  },
  many: {
    label: "Populated session",
    description: "Four demo scans with a repeated-dish recommendation.",
    scans: manyScans,
    recommendations: manyRecommendations,
    error: null,
  },
  error: {
    label: "Analysis error",
    description: "A recoverable analysis failure with no saved scan.",
    scans: [],
    recommendations: [],
    error:
      "Preview error: the analysis service is unavailable. Try the scan again or switch to photo upload.",
  },
};

export const DEFAULT_MOCK_SCAN_SCENARIO: MockScanScenarioKey = "empty";

export function getMockScanScenario(
  key: MockScanScenarioKey,
): MockScanScenario {
  return MOCK_SCAN_SCENARIOS[key];
}
