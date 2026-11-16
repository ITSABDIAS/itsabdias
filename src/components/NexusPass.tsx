import { Link } from "@tanstack/react-router";
import { Crown, Lock, Check, Flag } from "lucide-react";
import { PASS_REWARDS, cosmeticUnlocked } from "@/lib/cosmetics";
import type { MembershipPlan } from "@/lib/membership";
import { Button } from "./ui/button";
import { CosmeticAvatar, CosmeticBanner } from "./ProfileCosmetics";

export function NexusPass({ missions, plan }: { missions: number; plan: MembershipPlan }) {
  const stage = Math.min(10, Math.floor(missions / 2));
  return <section className="mb-10 border-y border-border py-7">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs text-neon-cyan">PASE NEXUS · OPERACIÓN PRIME</p><h2 className="mt-2 text-2xl font-bold">Tu siguiente desbloqueo</h2><p className="mt-2 text-muted-foreground">Cada 2 misiones reclamadas desbloquean una etapa. Sin fecha de caducidad.</p></div><Button asChild variant="outline"><Link to="/profile">Abrir colección</Link></Button></header>
    <div className="mt-5 flex items-center gap-3"><Flag className="text-neon-cyan" /><span className="font-bold">Etapa {stage} / 10</span><span className="text-sm text-muted-foreground">{missions} misiones reclamadas</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-gradient-neon" style={{ width: `${stage * 10}%` }} /></div>
    <div className="mt-6 overflow-x-auto pb-3" aria-label="Recompensas del pase">
      <div className="grid min-w-max grid-cols-[100px_repeat(10,148px)] gap-3">
        <div className="flex items-center text-sm font-bold text-neon-cyan">GRATIS</div>{PASS_REWARDS.filter(r => r.track === "free").map(r => <PassItem key={r.id} reward={r} unlocked={cosmeticUnlocked(r, 1, missions, plan)} />)}
        <div className="flex items-center gap-1 text-sm font-bold text-premium"><Crown className="h-4 w-4" />ÉLITE</div>{PASS_REWARDS.filter(r => r.track === "elite").map(r => <PassItem key={r.id} reward={r} unlocked={cosmeticUnlocked(r, 1, missions, plan)} />)}
      </div>
    </div>
    <p className="mt-3 text-sm text-muted-foreground">Élite incluido con Premium y Plus activos. Tu avance gratis se conserva.</p>
    {plan === "free" && <Button asChild variant="link"><Link to="/premium">Ver Premium y Plus</Link></Button>}
  </section>;
}
function PassItem({ reward: r, unlocked }: { reward: typeof PASS_REWARDS[number]; unlocked: boolean }) {
  return <article className={`rounded-md border p-3 ${unlocked ? "border-neon-cyan bg-card" : "border-border bg-card/50"}`}><div className="flex items-center justify-between text-xs text-muted-foreground"><span>ETAPA {r.tier}</span>{unlocked ? <Check className="h-4 w-4 text-neon-cyan" /> : <Lock className="h-4 w-4" />}</div><div className="relative mt-3 flex h-20 items-center justify-center overflow-hidden rounded-md bg-secondary">{r.kind === "background" ? <CosmeticBanner id={r.id} /> : <CosmeticAvatar name={r.name} avatar={r.kind === "avatar" ? r.id : "avatar-sentinel"} frame={r.kind === "frame" ? r.id : null} size="small" />}</div><p className="mt-3 min-h-10 text-sm font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{unlocked ? "En tu colección" : `${(r.tier ?? 0) * 2} misiones`}</p></article>;
}