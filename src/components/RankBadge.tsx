import { Crown, Shield, Gavel, Code, Brain, Sparkles, BadgeCheck, User as UserIcon } from "lucide-react";

export type RankSlug =
  | "founder"
  | "admin"
  | "moderator"
  | "developer"
  | "ai_expert"
  | "premium"
  | "verified"
  | "member";

export const RANK_META: Record<RankSlug, { label: string; color: string; Icon: any; gradient: string }> = {
  founder:   { label: "Founder",       color: "#ff00aa", Icon: Crown,      gradient: "from-[#ff00aa] via-[#a855f7] to-[#22d3ee]" },
  admin:     { label: "Administrador", color: "#a855f7", Icon: Shield,     gradient: "from-[#a855f7] to-[#7c3aed]" },
  moderator: { label: "Moderador",     color: "#3b82f6", Icon: Gavel,      gradient: "from-[#3b82f6] to-[#0ea5e9]" },
  developer: { label: "Developer",     color: "#22d3ee", Icon: Code,       gradient: "from-[#22d3ee] to-[#06b6d4]" },
  ai_expert: { label: "Experto IA",    color: "#10b981", Icon: Brain,      gradient: "from-[#10b981] to-[#059669]" },
  premium:   { label: "Premium",       color: "#fbbf24", Icon: Sparkles,   gradient: "from-[#fbbf24] to-[#f59e0b]" },
  verified:  { label: "Verificado",    color: "#06b6d4", Icon: BadgeCheck, gradient: "from-[#06b6d4] to-[#0891b2]" },
  member:    { label: "Miembro",       color: "#94a3b8", Icon: UserIcon,   gradient: "from-[#94a3b8] to-[#64748b]" },
};

export const RANK_PRIORITY: RankSlug[] = [
  "founder", "admin", "moderator", "developer", "ai_expert", "premium", "verified", "member",
];

export function topRank(roles: string[] | undefined | null): RankSlug | undefined {
  if (!roles?.length) return undefined;
  return RANK_PRIORITY.find((r) => roles.includes(r));
}

type Size = "xs" | "sm" | "md" | "lg";

const sizes: Record<Size, { wrap: string; icon: string; text: string }> = {
  xs: { wrap: "px-1.5 py-0.5 gap-1 text-[9px]",  icon: "h-2.5 w-2.5", text: "tracking-wider" },
  sm: { wrap: "px-2 py-0.5 gap-1 text-[10px]",   icon: "h-3 w-3",     text: "tracking-widest" },
  md: { wrap: "px-2.5 py-1 gap-1.5 text-xs",     icon: "h-3.5 w-3.5", text: "tracking-widest" },
  lg: { wrap: "px-3 py-1.5 gap-2 text-sm",       icon: "h-4 w-4",     text: "tracking-widest" },
};

export function RankBadge({
  slug,
  size = "sm",
  showLabel = true,
}: {
  slug: RankSlug;
  size?: Size;
  showLabel?: boolean;
}) {
  const meta = RANK_META[slug];
  if (!meta) return null;
  const s = sizes[size];
  const Icon = meta.Icon;

  if (slug === "founder") {
    // Special animated holographic badge for founder
    return (
      <span
        className={`relative inline-flex items-center font-mono uppercase font-bold rounded-md ${s.wrap} ${s.text}
          text-white bg-gradient-to-r ${meta.gradient}
          shadow-[0_0_12px_rgba(255,0,170,0.6)] animate-glow-pulse`}
        title={meta.label}
      >
        <Icon className={`${s.icon} drop-shadow`} />
        {showLabel && meta.label}
        <span className="absolute inset-0 rounded-md ring-1 ring-white/20 pointer-events-none" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-mono uppercase font-semibold rounded-md border ${s.wrap} ${s.text}`}
      style={{
        color: meta.color,
        borderColor: `${meta.color}66`,
        background: `${meta.color}14`,
        boxShadow: `0 0 8px ${meta.color}33`,
      }}
      title={meta.label}
    >
      <Icon className={s.icon} />
      {showLabel && meta.label}
    </span>
  );
}
