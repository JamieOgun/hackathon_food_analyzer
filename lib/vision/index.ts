import type { EstimateResult } from "../types";
import { estimatePlateClaude } from "./claude";
import { estimatePlateGemini } from "./gemini";

/**
 * Gemini is the default image-analysis provider. Claude remains available as
 * an explicit fallback by setting VISION_PROVIDER=claude.
 */
const PROVIDER = (process.env.VISION_PROVIDER ?? "gemini").toLowerCase();

export function estimatePlate(
  imageBase64: string,
  mimeType: string,
): Promise<EstimateResult> {
  switch (PROVIDER) {
    case "claude":
      return estimatePlateClaude(imageBase64, mimeType);
    case "gemini":
      return estimatePlateGemini(imageBase64, mimeType);
    default:
      throw new Error(
        `Unknown VISION_PROVIDER "${PROVIDER}" — expected "claude" or "gemini"`,
      );
  }
}
