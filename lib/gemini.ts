import { menuDishNames } from "./menu";
import type { EstimateResult } from "./types";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 12_000;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    dish_name: { type: "string" },
    remaining_bucket: {
      type: "string",
      enum: ["empty", "light", "half", "most", "untouched"],
    },
    visible_items: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["dish_name", "remaining_bucket", "visible_items", "confidence"],
};

function buildPrompt(): string {
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

function parseJsonLoose(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

function isValidEstimate(value: unknown): value is EstimateResult {
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

async function callGemini(
  imageBase64: string,
  mimeType: string,
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set on the server");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt() },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: RESPONSE_SCHEMA,
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response had no text content");
  }
  return parseJsonLoose(text);
}

/**
 * One retry on any failure (parse error, malformed shape, transient network
 * error) — the vision call is the single riskiest step in the demo, and a
 * lone retry catches most flakiness without adding meaningful latency.
 */
export async function estimatePlate(
  imageBase64: string,
  mimeType: string,
): Promise<EstimateResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = await callGemini(imageBase64, mimeType);
      if (isValidEstimate(parsed)) return parsed;
      lastError = new Error("Response did not match the expected shape");
    } catch (err) {
      lastError = err;
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Vision estimate failed after retry: ${detail}`);
}
