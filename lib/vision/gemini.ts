import type { EstimateResult } from "../types";
import {
  ESTIMATE_SCHEMA_PROPERTIES,
  ESTIMATE_SCHEMA_REQUIRED,
  TIMEOUT_MS,
  buildPrompt,
  parseJsonLoose,
  withRetry,
} from "./shared";

const MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.7-flash",
];

async function callGemini(
  model: string,
  imageBase64: string,
  mimeType: string,
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set on the server",
    );
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(endpoint, {
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
        // Plate evaluation does not need the model's default reasoning depth.
        // Low keeps interactive uploads within the route's latency budget.
        thinkingConfig: { thinkingLevel: "low" },
        response_mime_type: "application/json",
        response_schema: {
          type: "object",
          properties: ESTIMATE_SCHEMA_PROPERTIES,
          required: ESTIMATE_SCHEMA_REQUIRED,
        },
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Gemini ${model} API error ${res.status}: ${body.slice(0, 300)}`,
    );
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response had no text content");
  }
  return parseJsonLoose(text);
}

export async function estimatePlateGemini(
  imageBase64: string,
  mimeType: string,
): Promise<EstimateResult> {
  let attempt = 0;
  return withRetry(() => {
    const model = MODELS[Math.min(attempt, MODELS.length - 1)];
    attempt += 1;
    return callGemini(model, imageBase64, mimeType);
  });
}
