import { menuDishNames } from "../menu";
import type { EstimateResult } from "../types";

export const TIMEOUT_MS = 12_000;

/** JSON-schema-shaped description of the fields we need back, reused as
 * Gemini's response_schema and as the input_schema of Claude's forced tool
 * call — both accept plain JSON Schema for this. */
export const ESTIMATE_SCHEMA_PROPERTIES = {
  dish_name: { type: "string" },
  remaining_bucket: {
    type: "string",
    enum: ["empty", "light", "half", "most", "untouched"],
  },
  visible_items: { type: "array", items: { type: "string" } },
  confidence: { type: "number" },
};

export const ESTIMATE_SCHEMA_REQUIRED = [
  "dish_name",
  "remaining_bucket",
  "visible_items",
  "confidence",
];

export function buildPrompt(): string {
  const dishes = menuDishNames();
  return `You are looking at a photo of a restaurant plate after a customer has finished eating (or not).

Menu dishes — choose the closest match from this exact list, or "unrecognized" if none plausibly match:
${dishes.map((d) => `- ${d}`).join("\n")}

Return strict JSON matching the schema:
- dish_name: exactly one string from the list above, or "unrecognized"
- remaining_bucket: one of "empty" (nothing left), "light" (a few bites left), "half" (about half left), "most" (mostly untouched), "untouched" (essentially a full portion)
- visible_items: short list of specific food items still visible on the plate (e.g. "rice", "cabbage garnish"); exclude bones, shells, napkins, lemon wedges, and other non-edible items
- confidence: your confidence in dish_name, 0 to 1

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
    typeof v.confidence === "number"
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
