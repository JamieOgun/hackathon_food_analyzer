export type Bucket = "empty" | "light" | "half" | "most" | "untouched";

export const BUCKET_FRACTION: Record<Bucket, number> = {
  empty: 0,
  light: 0.15,
  half: 0.4,
  most: 0.7,
  untouched: 1.0,
};

export const BUCKET_LABEL: Record<Bucket, string> = {
  empty: "Empty plate",
  light: "Light leftovers",
  half: "Half left",
  most: "Mostly left",
  untouched: "Untouched",
};

export type Daypart = "lunch" | "dinner";

export interface MenuItem {
  dish_id: string;
  dish_name: string;
  price_yen: number;
  food_cost_yen: number;
  daypart: Daypart;
}

/** Raw shape returned by the vision model. */
export interface EstimateResult {
  dish_name: string; // one of the menu's dish names, or "unrecognized"
  remaining_bucket: Bucket;
  visible_items: string[];
  confidence: number; // 0-1
}

/** A single scan after joining the vision estimate to the menu. */
export interface ScanResult extends EstimateResult {
  id: string;
  source: "upload" | "camera";
  timestamp: string;
  remaining_fraction: number;
  dish_id: string | null;
  food_cost_yen: number | null;
  yen_wasted: number | null;
}

export interface Recommendation {
  dish_id: string;
  dish_name: string;
  n: number;
  mean_remaining_fraction: number;
  weekly_yen_wasted: number;
  message: string;
}
