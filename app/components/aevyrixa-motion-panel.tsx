import fs from "node:fs";
import path from "node:path";

type AevyrixaMotionPanelProps = {
  mp4Src?: string;
  webmSrc?: string;
  posterSrc?: string;
  eyebrow?: string;
  title?: string;
  copy?: string;
  labels?: string[];
  className?: string;
  variant?: "hero" | "care" | "experience";
};

function existingPublicAsset(src?: string) {
  if (!src) {
    return undefined;
  }

  if (!src.startsWith("/")) {
    return src;
  }

  const publicPath = path.join(process.cwd(), "public", src);
  return fs.existsSync(publicPath) ? src : undefined;
}

export default function AevyrixaMotionPanel({
  mp4Src,
  webmSrc,
  posterSrc,
  eyebrow = "Motion System",
  title = "Aevyrixa Care Motion",
  copy = "Cinematic care layers with soft glow, discreet structure, and lightweight coded motion.",
  labels = ["Comfort Knit", "Absorbent Core", "Protective Layer"],
  className = "",
  variant = "care",
}: AevyrixaMotionPanelProps) {
  const safeMp4Src = existingPublicAsset(mp4Src);
  const safeWebmSrc = existingPublicAsset(webmSrc);
  const safePosterSrc = existingPublicAsset(posterSrc);
  const hasVideo = Boolean(safeMp4Src || safeWebmSrc);

  return (
    <div
      className={`aev-motion-panel aev-motion-panel-${variant} group relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-[#030714] shadow-[0_34px_120px_rgba(0,0,0,0.42)] ${className}`}
      aria-label={title}
      data-video-state={hasVideo ? "video" : "fallback"}
    >
      <div className="aev-motion-ambient absolute inset-0" />
      <div className="aev-motion-grid absolute inset-0" />

      {hasVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.86]"
          poster={safePosterSrc}
          autoPlay
          muted
          loop
          playsInline
        >
          {safeWebmSrc ? <source src={safeWebmSrc} type="video/webm" /> : null}
          {safeMp4Src ? <source src={safeMp4Src} type="video/mp4" /> : null}
        </video>
      ) : (
        <div className="aev-motion-fallback absolute inset-0">
          <div className="aev-motion-depth-plate absolute left-[11%] top-[10%] h-[58%] w-[78%] rounded-[48%_52%_58%_42%/46%_42%_58%_54%] border border-white/10 bg-white/[0.035]" />
          <div className="aev-motion-ribbon aev-motion-ribbon-one absolute left-[7%] top-[13%] h-[22%] w-[84%] rounded-[54%_46%_62%_38%/46%_42%_58%_54%] border border-cyan-100/18 bg-cyan-100/[0.045]" />
          <div className="aev-motion-ribbon aev-motion-ribbon-two absolute left-[17%] top-[31%] h-[19%] w-[66%] rounded-[42%_58%_48%_52%/58%_44%_56%_42%] border border-violet-100/18 bg-violet-100/[0.05]" />
          <div className="aev-motion-ribbon aev-motion-ribbon-three absolute left-[10%] top-[50%] h-[18%] w-[78%] rounded-[48%_52%_39%_61%/42%_54%_46%_58%] border border-rose-100/16 bg-rose-100/[0.045]" />
          <div className="aev-motion-core absolute left-1/2 top-[39%] h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-200/16 blur-2xl" />
          <div className="aev-motion-fabric-line absolute left-[18%] top-[37%] h-[18%] w-[64%] rounded-full border-t border-white/20" />
          <div className="aev-motion-fabric-line aev-motion-fabric-line-two absolute left-[25%] top-[53%] h-[16%] w-[52%] rounded-full border-t border-cyan-100/20" />
          <div className="absolute inset-x-[13%] top-[29%] h-px bg-gradient-to-r from-transparent via-cyan-100/65 to-transparent" />
          <div className="absolute inset-x-[20%] top-[46%] h-px bg-gradient-to-r from-transparent via-violet-100/58 to-transparent" />
          <div className="absolute inset-x-[25%] top-[61%] h-px bg-gradient-to-r from-transparent via-rose-100/52 to-transparent" />
        </div>
      )}

      <div className="aev-motion-shine absolute inset-y-0 -left-1/3 w-1/2" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.13)_42%,transparent_58%)] opacity-45" />

      <div className="relative flex min-h-[26rem] flex-col justify-between p-4 sm:min-h-[32rem] sm:p-6 lg:min-h-[36rem]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {labels.map((label) => (
            <div
              key={label}
              className="aev-motion-chip rounded-full border border-white/12 bg-black/24 px-3 py-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/72 backdrop-blur-xl"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="aev-motion-copy-card rounded-[1.35rem] border border-white/12 bg-black/40 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-cyan-100/74">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/66">{copy}</p>
        </div>
      </div>
    </div>
  );
}
