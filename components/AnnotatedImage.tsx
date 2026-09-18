import type { Detection } from "@/lib/types";

interface AnnotatedImageProps {
  src: string;
  alt: string;
  detections?: Detection[] | null;
  showLabels?: boolean;
  className?: string;
}

const KIND_STYLE: Record<Detection["kind"], { box: string; chip: string }> = {
  plate: {
    box: "border border-dashed border-emerald-600",
    chip: "bg-emerald-700 text-white",
  },
  leftover: {
    box: "border border-waste bg-waste/15",
    chip: "bg-waste text-brand-deep",
  },
};

/** Image with detection boxes overlaid. Boxes use the model's 0-1000 grid. */
export default function AnnotatedImage({
  src,
  alt,
  detections,
  showLabels = true,
  className = "",
}: AnnotatedImageProps) {
  return (
    <div
      className={`relative w-full self-start overflow-hidden rounded-[8px] border border-line bg-stone-100 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image can't optimize it */}
      <img src={src} alt={alt} className="block h-auto w-full object-contain" />
      {(detections ?? []).map((d, i) => {
        const [x0, y0, x1, y1] = d.box;
        const style = KIND_STYLE[d.kind];
        const left = Math.min(100, Math.max(0, x0 / 10));
        const top = Math.min(100, Math.max(0, y0 / 10));
        const width = Math.min(100 - left, Math.max(0, (x1 - x0) / 10));
        const height = Math.min(100 - top, Math.max(0, (y1 - y0) / 10));

        return (
          <div
            key={`${d.kind}-${d.label}-${i}`}
            className={`pointer-events-none absolute rounded-sm ${style.box}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            {showLabels && (
              <span
                className={`absolute left-0 max-w-full truncate px-1 text-[10px] font-semibold leading-4 ${style.chip} ${
                  top < 4 ? "top-0" : "-top-4"
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
