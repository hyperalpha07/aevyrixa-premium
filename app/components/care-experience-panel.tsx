type CareExperiencePanelProps = {
  className?: string;
};

const careSignals = ["Comfort", "Discretion", "Reusable Care", "Privacy Pack"];

export default function CareExperiencePanel({
  className = "",
}: CareExperiencePanelProps) {
  return (
    <div
      className={`aev-care-panel relative isolate overflow-hidden rounded-[2rem] border border-white/12 bg-[#040817] shadow-[0_34px_120px_rgba(0,0,0,0.42)] ${className}`}
      aria-label="Aevyrixa coded care experience"
    >
      <div className="aev-care-ambient absolute inset-0" />
      <div className="aev-care-grid absolute inset-0" />
      <div className="aev-care-reflection absolute inset-y-0 -left-1/3 w-1/2" />

      <div className="aev-care-ribbon aev-care-ribbon-one absolute left-[7%] top-[13%] h-[22%] w-[84%] rounded-[54%_46%_62%_38%/46%_42%_58%_54%] border border-cyan-100/18 bg-cyan-100/[0.04]" />
      <div className="aev-care-ribbon aev-care-ribbon-two absolute left-[17%] top-[31%] h-[19%] w-[66%] rounded-[42%_58%_48%_52%/58%_44%_56%_42%] border border-violet-100/18 bg-violet-100/[0.045]" />
      <div className="aev-care-ribbon aev-care-ribbon-three absolute left-[10%] top-[50%] h-[18%] w-[78%] rounded-[48%_52%_39%_61%/42%_54%_46%_58%] border border-rose-100/16 bg-rose-100/[0.04]" />

      <div className="aev-care-core absolute left-1/2 top-[36%] h-36 w-36 -translate-x-1/2 rounded-full bg-cyan-200/16 blur-2xl" />
      <div className="absolute inset-x-[13%] top-[29%] h-px bg-gradient-to-r from-transparent via-cyan-100/65 to-transparent" />
      <div className="absolute inset-x-[20%] top-[46%] h-px bg-gradient-to-r from-transparent via-violet-100/58 to-transparent" />
      <div className="absolute inset-x-[25%] top-[61%] h-px bg-gradient-to-r from-transparent via-rose-100/52 to-transparent" />

      <div className="relative flex min-h-[26rem] flex-col justify-end p-4 sm:min-h-[32rem] sm:p-6 lg:min-h-[36rem]">
        <div className="mb-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
          {careSignals.map((signal) => (
            <div
              key={signal}
              className="aev-care-signal rounded-full border border-white/12 bg-black/20 px-3 py-2 text-center text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl"
            >
              {signal}
            </div>
          ))}
        </div>

        <div className="aev-care-copy-card rounded-[1.35rem] border border-white/12 bg-black/38 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-cyan-100/74">
            Care Experience
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            Soft motion, quiet confidence.
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/66">
            A discreet reusable routine shaped around comfort, smooth everyday
            wear, gentle care after use, and privacy-minded packaging from
            order to arrival.
          </p>
        </div>
      </div>
    </div>
  );
}
