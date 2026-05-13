import type { ProductVisualTheme } from "@/app/lib/products";

type ProductVisualProps = {
  visualTheme?: ProductVisualTheme;
  label?: string;
  compact?: boolean;
  className?: string;
};

const themeClasses: Record<
  ProductVisualTheme,
  {
    shell: string;
    glow: string;
    trim: string;
    gusset: string;
  }
> = {
  "blush-violet": {
    shell: "from-[#fff7ef] via-[#f4c4d4] to-[#a855f7]",
    glow: "bg-fuchsia-300/28",
    trim: "border-fuchsia-100/65 bg-white/22",
    gusset: "bg-[#fff7ef]/42",
  },
  "cyan-night": {
    shell: "from-[#07111f] via-[#122542] to-[#22d3ee]",
    glow: "bg-cyan-300/28",
    trim: "border-cyan-100/55 bg-cyan-100/16",
    gusset: "bg-cyan-100/24",
  },
  "rose-gold": {
    shell: "from-[#fff7ef] via-[#f4c4d4] to-[#d4af37]",
    glow: "bg-rose-200/28",
    trim: "border-rose-100/70 bg-white/24",
    gusset: "bg-white/42",
  },
};

export default function ProductVisual({
  visualTheme = "blush-violet",
  label = "Her Care",
  compact = false,
  className = "",
}: ProductVisualProps) {
  const theme = themeClasses[visualTheme];

  return (
    <div
      className={`aev-product-visual relative isolate flex h-full min-h-full w-full items-center justify-center overflow-hidden rounded-[inherit] bg-[#07101f] ${className}`}
      aria-label={`${label} CSS product visual`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.shell}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.58),transparent_26%),radial-gradient(circle_at_80%_76%,rgba(255,255,255,0.22),transparent_34%)]" />
      <div className="aev-product-visual-halo absolute left-1/2 top-[18%] h-[58%] w-[74%] -translate-x-1/2 rounded-full bg-cyan-100/18 blur-3xl" />
      <div className="aev-product-visual-plate aev-product-visual-plate-back absolute left-[20%] right-[20%] top-[18%] h-[50%] rounded-[46%_54%_34%_38%/44%_43%_55%_56%] border border-violet-100/18 bg-violet-100/[0.045] shadow-[0_34px_90px_rgba(0,0,0,0.2)] backdrop-blur-sm" />
      <div
        className={`aev-product-visual-shell absolute left-[16%] right-[16%] top-[22%] h-[48%] rounded-[44%_44%_30%_30%/40%_40%_52%_52%] border ${theme.trim} shadow-[inset_0_1px_24px_rgba(255,255,255,0.18),0_28px_80px_rgba(0,0,0,0.24)] backdrop-blur-md`}
      />
      <div className="aev-product-visual-plate aev-product-visual-plate-front absolute left-[23%] right-[23%] top-[38%] h-[32%] rounded-[42%_58%_54%_46%/48%_52%_46%_54%] border border-cyan-100/18 bg-cyan-100/[0.05] shadow-[inset_0_1px_18px_rgba(255,255,255,0.14),0_22px_70px_rgba(34,211,238,0.1)] backdrop-blur-sm" />
      <div className="aev-product-visual-trim absolute left-[29%] right-[29%] top-[28%] h-[12%] rounded-b-full border-b border-white/45 bg-white/20" />
      <div
        className={`aev-product-visual-core absolute bottom-[26%] left-[31%] right-[31%] h-[22%] rounded-[48%_48%_56%_56%] ${theme.gusset} shadow-[inset_0_1px_16px_rgba(255,255,255,0.22)]`}
      />
      <div className={`absolute bottom-[18%] h-[22%] w-[56%] rounded-full ${theme.glow} blur-2xl`} />
      <div className="absolute inset-x-[18%] top-[20%] h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <div className="aev-product-visual-reflection absolute inset-y-[12%] -left-1/3 w-1/2" />

      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/18 bg-black/20 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-white/86 backdrop-blur-md">
          {label}
        </div>
      )}
    </div>
  );
}
