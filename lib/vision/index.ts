import type { EstimateResult } from "../types";
import { estimatePlateClaude } from "./claude";
import { estimatePlateGemini } from "./gemini";

/**
 * Swappable while Gemini billing is blocked — set VISION_PROVIDER=gemini in
 * .env.local to switch back once ai.studio/projects billing is resolved.
 */
const PROVIDER = (process.env.VISION_PROVIDER ?? "claude").toLowerCase();

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
