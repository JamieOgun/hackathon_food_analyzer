import type { EstimateResult } from "../types";
import {
  ESTIMATE_SCHEMA_PROPERTIES,
  ESTIMATE_SCHEMA_REQUIRED,
  TIMEOUT_MS,
  buildPrompt,
  withRetry,
} from "./shared";

const MODEL = process.env.CLAUDE_VISION_MODEL ?? "claude-sonnet-5";
const ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const TOOL_NAME = "report_plate_estimate";

async function callClaude(
  imageBase64: string,
  mimeType: string,
): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      tools: [
        {
          name: TOOL_NAME,
          description: "Report the plate estimate as strict structured data.",
          input_schema: {
            type: "object",
            properties: ESTIMATE_SCHEMA_PROPERTIES,
            required: ESTIMATE_SCHEMA_REQUIRED,
          },
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildPrompt() },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const toolUse = (data?.content as Array<Record<string, unknown>>)?.find(
    (block) => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude response had no tool_use block");
  }
  return toolUse.input;
}

export async function estimatePlateClaude(
  imageBase64: string,
  mimeType: string,
): Promise<EstimateResult> {
  return withRetry(() => callClaude(imageBase64, mimeType));
}
