type VideoReadyPanelProps = {
  mp4Src?: string;
  webmSrc?: string;
  posterSrc?: string;
  label?: string;
  className?: string;
};

export default function VideoReadyPanel({
  mp4Src,
  webmSrc,
  posterSrc,
  label = "Noromi Care Experience",
  className = "",
}: VideoReadyPanelProps) {
  const hasVideo = Boolean(mp4Src || webmSrc);

  return (
    <div
      className={`aev-video-panel relative isolate overflow-hidden rounded-[2rem] border border-white/12 bg-[#040817] shadow-[0_34px_120px_rgba(0,0,0,0.42)] ${className}`}
      aria-label={label}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_78%_68%,rgba(168,85,247,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_44%)]" />

      {hasVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.88]"
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
        >
          {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
          {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
        </video>
      ) : (
        <div className="aev-video-fallback absolute inset-0">
          <div className="aev-video-orbit absolute left-[8%] top-[12%] h-[72%] w-[84%] rounded-[48%_52%_44%_56%/42%_44%_56%_58%] border border-cyan-100/16 bg-cyan-100/[0.035]" />
          <div className="aev-video-orbit aev-video-orbit-2 absolute left-[18%] top-[21%] h-[54%] w-[64%] rounded-[55%_45%_58%_42%/42%_55%_45%_58%] border border-violet-200/16 bg-violet-200/[0.035]" />
          <div className="aev-video-scan absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-200/18 to-transparent" />
          <div className="absolute inset-x-[13%] top-[34%] h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" />
          <div className="absolute inset-x-[20%] top-[48%] h-px bg-gradient-to-r from-transparent via-violet-100/62 to-transparent" />
          <div className="absolute inset-x-[28%] top-[62%] h-px bg-gradient-to-r from-transparent via-rose-100/54 to-transparent" />
          <div className="aev-video-core absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/16 blur-2xl" />
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:46px_46px] opacity-30" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.13)_42%,transparent_58%)] opacity-55" />

      <div className="relative flex min-h-[22rem] items-end p-4 sm:min-h-[28rem] sm:p-6 lg:min-h-[34rem]">
        <div className="w-full rounded-[1.35rem] border border-white/12 bg-black/36 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-cyan-100/74">
                Motion Preview
              </p>
              <p className="mt-2 truncate text-lg font-semibold text-white sm:text-2xl">
                {label}
              </p>
            </div>
            <div className="aev-video-pulse flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-100/20 bg-cyan-100/10">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
