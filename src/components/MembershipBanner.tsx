export function MembershipBanner({ plan }: { plan: "premium" | "plus" }) {
  const plus = plan === "plus";
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${plus ? "banner-plus" : "banner-premium"}`}>
      <div className="banner-grid absolute inset-0" />
      <div className="banner-sweep absolute inset-0" />
      <div className={`absolute inset-0 ${plus ? "text-neon-cyan" : "text-premium"}`}>
        {Array.from({ length: plus ? 18 : 10 }, (_, i) => (
          <span key={i} className="banner-particle" style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i * 0.37) % 4}s` }} />
        ))}
      </div>
      <span className={`absolute right-4 top-4 rounded-sm border px-2 py-1 font-display text-xs font-bold tracking-[0.3em] ${plus ? "plus-badge" : "border-premium/60 text-premium"}`}>
        {plus ? "NEXUS PLUS" : "PREMIUM"}
      </span>
      {plus && <>
        <div className="absolute -left-10 top-6 h-32 w-32 rounded-full border border-neon-cyan/40" />
        <div className="absolute bottom-6 right-24 h-20 w-20 rotate-45 border border-neon-purple/50" />
      </>}
    </div>
  );
}
