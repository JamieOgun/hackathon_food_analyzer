import { NextResponse } from "next/server";
import { estimatePlate } from "@/lib/vision";
import { sanitizeDetections } from "@/lib/vision/shared";
import { findMenuItem } from "@/lib/menu";
import { BUCKET_FRACTION, type ScanResult } from "@/lib/types";

// Two vision attempts can each use up to 30 seconds.
export const maxDuration = 65;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");
  const source = formData.get("source") === "camera" ? "camera" : "upload";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  let estimate;
  try {
    estimate = await estimatePlate(base64, mimeType);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[estimate] vision providers failed:", detail);
    const temporaryFailure =
      /\b(429|502|503|504)\b|timeout|timed out|aborted|high demand|unavailable/i.test(
        detail,
      );
    return NextResponse.json(
      {
        error: temporaryFailure
          ? "Image analysis is temporarily busy. Please try the upload again."
          : "Image analysis failed. Please try another image.",
      },
      { status: 502 },
    );
  }

  if (estimate.plate_present === false) {
    console.info("[estimate] skipped, no plate:", estimate.reasoning);
    return NextResponse.json(
      {
        error: `No plate detected in the image${
          estimate.reasoning ? ` — ${estimate.reasoning}` : ""
        }`,
        no_plate: true,
        reasoning: estimate.reasoning ?? null,
      },
      { status: 422 },
    );
  }

  const menuItem = findMenuItem(estimate.dish_name);
  const remaining_fraction = BUCKET_FRACTION[estimate.remaining_bucket];

  const result: ScanResult = {
    ...estimate,
    reasoning: estimate.reasoning?.trim() || undefined,
    detections: sanitizeDetections(estimate.detections),
    id: crypto.randomUUID(),
    source,
    timestamp: new Date().toISOString(),
    remaining_fraction,
    dish_id: menuItem?.dish_id ?? null,
    food_cost_yen: menuItem?.food_cost_yen ?? null,
    yen_wasted: menuItem
      ? Math.round(menuItem.food_cost_yen * remaining_fraction)
      : null,
  };

  return NextResponse.json(result);
}
