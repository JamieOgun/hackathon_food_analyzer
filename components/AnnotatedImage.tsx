import type { Detection } from "@/lib/types";

interface AnnotatedImageProps {
  src: string;
  alt: string;
  detections: Detection[];
  showLabels?: boolean;
}

const KIND_STYLE: Record<Detection["kind"], { box: string; chip: string }> = {
  plate: {
    box: "border-2 border-dashed border-emerald-400",
    chip: "bg-emerald-500 text-white",
  },
  leftover: {
    box: "border-2 border-waste bg-waste/15",
    chip: "bg-waste text-brand-deep",
  },
};

/** Image with detection boxes overlaid. Boxes are positioned in percentages
 * of the rendered image, so they stay aligned at any display size. */
export default function AnnotatedImage({
  src,
  alt,
  detections,
  showLabels = true,
}: AnnotatedImageProps) {
  return (
    <div className="relative w-full self-start overflow-hidden rounded-md bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image can't optimize it */}
      <img src={src} alt={alt} className="block w-full" />
      {detections.map((d, i) => {
        const [x0, y0, x1, y1] = d.box;
        const style = KIND_STYLE[d.kind];
        return (
          <div
            key={i}
            className={`pointer-events-none absolute rounded-sm ${style.box}`}
            style={{
              left: `${x0 / 10}%`,
              top: `${y0 / 10}%`,
              width: `${(x1 - x0) / 10}%`,
              height: `${(y1 - y0) / 10}%`,
            }}
          >
            {showLabels && (
              <span
                className={`absolute left-0 max-w-full truncate rounded-sm px-1 text-[10px] font-semibold leading-4 ${style.chip} ${
                  y0 < 40 ? "top-0" : "-top-4"
                }`}
              >
                {d.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
