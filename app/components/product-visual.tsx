import type { Product } from "@/app/lib/products";

type ProductVisualProps = {
  accent?: Product["accent"];
  label?: string;
  compact?: boolean;
  className?: string;
};

const accentClasses: Record<Product["accent"], string> = {
  cyan: "from-cyan-200/70 via-sky-300/35 to-fuchsia-300/55",
  fuchsia: "from-fuchsia-200/75 via-rose-300/35 to-cyan-200/55",
  amber: "from-rose-200/70 via-amber-100/35 to-fuchsia-300/55",
};

export default function ProductVisual({
  accent = "fuchsia",
  label = "Her Care",
  compact = false,
  className = "",
}: ProductVisualProps) {
  return (
    <div
      className={`relative isolate flex h-full min-h-full w-full items-center justify-center overflow-hidden rounded-[inherit] bg-[#07101f] ${className}`}
      aria-label={`${label} visual placeholder`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accentClasses[accent]} opacity-90`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_28%),radial-gradient(circle_at_78%_74%,rgba(255,255,255,0.22),transparent_34%)]" />
      <div className="absolute inset-x-[14%] bottom-[16%] top-[18%] rounded-[45%_45%_34%_34%/38%_38%_52%_52%] border border-white/35 bg-white/18 shadow-[inset_0_1px_24px_rgba(255,255,255,0.2),0_28px_80px_rgba(0,0,0,0.24)] backdrop-blur-md" />
      <div className="absolute left-[26%] right-[26%] top-[24%] h-[18%] rounded-b-[60%] border-b border-white/45 bg-white/20 blur-[0.2px]" />
      <div className="absolute bottom-[22%] left-[24%] right-[24%] h-[18%] rounded-full bg-[#050816]/18 blur-xl" />
      {!compact && (
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-white/82 backdrop-blur-md">
          {label}
        </div>
      )}
    </div>
  );
}
