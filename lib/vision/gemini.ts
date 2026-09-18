import type { EstimateResult } from "../types";
import {
  ESTIMATE_SCHEMA_PROPERTIES,
  ESTIMATE_SCHEMA_REQUIRED,
  TIMEOUT_MS,
  buildPrompt,
  parseJsonLoose,
  withRetry,
} from "./shared";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini(
  imageBase64: string,
  mimeType: string,
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set on the server",
    );
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

export async function estimatePlateGemini(
  imageBase64: string,
  mimeType: string,
): Promise<EstimateResult> {
  return withRetry(() => callGemini(imageBase64, mimeType));
}
