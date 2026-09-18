import { menuDishNames } from "../menu";
import type { Detection, EstimateResult } from "../types";

export const TIMEOUT_MS = 18_000;

/** JSON-schema-shaped description of the fields we need back, reused as
 * Gemini's response_schema and as the input_schema of Claude's forced tool
 * call — both accept plain JSON Schema for this. */
export const ESTIMATE_SCHEMA_PROPERTIES = {
  // First on purpose: the model writes its observations before committing
  // to a dish and bucket.
  reasoning: { type: "string" },
  dish_name: { type: "string" },
  remaining_bucket: {
    type: "string",
    enum: ["empty", "light", "half", "most", "untouched"],
  },
  visible_items: { type: "array", items: { type: "string" } },
  confidence: { type: "number" },
  plate_present: { type: "boolean" },
  detections: {
    type: "array",
    items: {
      type: "object",
      properties: {
        label: { type: "string" },
        kind: { type: "string", enum: ["plate", "leftover"] },
        box: { type: "array", items: { type: "integer" } },
      },
      required: ["label", "kind", "box"],
    },
  },
};

export const ESTIMATE_SCHEMA_REQUIRED = [
  "reasoning",
  "dish_name",
  "remaining_bucket",
  "visible_items",
  "confidence",
  "plate_present",
  "detections",
];

export function buildPrompt(): string {
  const dishes = menuDishNames();
  return `You are looking at a photo (often a top-down view of a tray return area) of a restaurant plate after a customer has finished eating (or not).

Menu dishes — choose the closest match from this exact list, or "unrecognized" if none plausibly match:
${dishes.map((d) => `- ${d}`).join("\n")}

Return strict JSON matching the schema:
- reasoning: 2-4 plain sentences a restaurant manager could read — which visual cues identified the dish (e.g. breaded cutlet, miso bowl, curry sauce) and what remains vs. what was eaten that justifies the leftover level
- dish_name: exactly one string from the list above, or "unrecognized"
- remaining_bucket: one of "empty" (nothing left), "light" (a few bites left), "half" (about half left), "most" (mostly untouched), "untouched" (essentially a full portion)
- visible_items: short list of specific food items still visible on the plate (e.g. "rice", "cabbage garnish"); exclude bones, shells, napkins, lemon wedges, and other non-edible items
- confidence: your confidence in dish_name, 0 to 1
- plate_present: true whenever any plate, bowl, or tray is in view — including a completely clean/empty plate or an empty tray with dishes on it (that is a valid "empty" result). false ONLY when there is no dishware at all (bare surface, just hands, camera covered). When false, use "unrecognized" and "empty" for the other fields and explain what you see in reasoning
- detections: bounding boxes for the plate/tray (kind "plate") and for each distinct leftover food region (kind "leftover", label = the food item). box is [x_min, y_min, x_max, y_max] as integers 0-1000 relative to image width and height. Return [] when plate_present is false

Judge remaining_bucket by the fraction of edible food still visible on the plate, not by plate cleanliness.`;
}

export function parseJsonLoose(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

export function isValidEstimate(value: unknown): value is EstimateResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.dish_name === "string" &&
    typeof v.remaining_bucket === "string" &&
    ["empty", "light", "half", "most", "untouched"].includes(
      v.remaining_bucket as string,
    ) &&
    Array.isArray(v.visible_items) &&
    typeof v.confidence === "number" &&
    (v.reasoning === undefined || typeof v.reasoning === "string") &&
    (v.detections === undefined || Array.isArray(v.detections)) &&
    (v.plate_present === undefined || typeof v.plate_present === "boolean")
  );
}

/** One retry on any failure — parse error, malformed shape, transient
 * network error. The vision call is the riskiest step in the demo; a lone
 * retry catches most flakiness without adding meaningful latency. */
export async function withRetry(
  call: () => Promise<unknown>,
): Promise<EstimateResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = await call();
      if (isValidEstimate(parsed)) return parsed;
      lastError = new Error("Response did not match the expected shape");
    } catch (err) {
      lastError = err;
    }
  }
  const detail =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Vision estimate failed after retry: ${detail}`);
}

/** Drop malformed boxes and clamp the rest to the 0-1000 grid — models
 * occasionally emit swapped corners or values slightly out of range. */
export function sanitizeDetections(raw: unknown): Detection[] {
  if (!Array.isArray(raw)) return [];
  const clamp = (n: number) => Math.min(1000, Math.max(0, Math.round(n)));
  const out: Detection[] = [];
  for (const d of raw) {
    if (!d || typeof d !== "object") continue;
    const { label, kind, box } = d as Record<string, unknown>;
    if (typeof label !== "string" || !Array.isArray(box) || box.length !== 4)
      continue;
    if (!box.every((n) => typeof n === "number" && Number.isFinite(n)))
      continue;
    const [a, b, c, e] = (box as number[]).map(clamp);
    const [x0, x1] = a <= c ? [a, c] : [c, a];
    const [y0, y1] = b <= e ? [b, e] : [e, b];
    if (x1 - x0 < 5 || y1 - y0 < 5) continue;
    out.push({
      label,
      kind: kind === "plate" ? "plate" : "leftover",
      box: [x0, y0, x1, y1],
    });
  }
  return out;
}
