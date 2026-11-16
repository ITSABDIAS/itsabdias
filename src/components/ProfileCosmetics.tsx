import { User } from "lucide-react";
import { rewardById } from "@/lib/cosmetics";
import { MembershipBanner } from "./MembershipBanner";
import { PremiumAvatarRing } from "./PremiumName";

export type Equipped = { equipped_avatar: string | null; equipped_frame: string | null; equipped_background: string | null };
export function CosmeticBanner({ id, legacy, plan }: { id?: string | null; legacy?: string | null; plan?: "free" | "premium" | "plus" }) {
  const reward = rewardById(id);
  if (reward?.plan && reward.kind === "background") return <MembershipBanner plan={reward.plan} />;
  if (reward) return <div className="absolute inset-0" style={{ background: reward.style }}><div className="banner-grid absolute inset-0" /></div>;
  if (legacy) return <img src={legacy} alt="Banner" className="absolute inset-0 h-full w-full object-cover" />;
  return plan && plan !== "free" ? <MembershipBanner plan={plan} /> : <div className="absolute inset-0 bg-gradient-neon opacity-40" />;
}
export function CosmeticAvatar({ avatar, frame, legacy, name, size = "large" }: { avatar?: string | null; frame?: string | null; legacy?: string | null; name: string; size?: "large" | "small" }) {
  const picture = rewardById(avatar)?.image ?? legacy;
  const border = rewardById(frame);
  return <div className="rounded-full p-1" style={border && !border.plan ? { background: border.style } : undefined}>
    <PremiumAvatarRing plus={border?.plan === "plus"} premium={border?.plan === "premium"}>
      <div className={`${size === "large" ? "h-28 w-28" : "h-10 w-10"} rounded-full bg-background overflow-hidden flex items-center justify-center ring-2 ring-border`}>
        {picture ? <img src={picture} alt={name} width={112} height={112} loading="lazy" className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-neon-cyan" />}
      </div>
    </PremiumAvatarRing>
  </div>;
}