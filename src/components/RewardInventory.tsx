import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ALL_COSMETICS, cosmeticUnlocked, type Cosmetic } from "@/lib/cosmetics";
import { activePlan } from "@/lib/membership";
import { Button } from "./ui/button";
import { CosmeticAvatar, CosmeticBanner, type Equipped } from "./ProfileCosmetics";

export function RewardInventory({ userId, equipped, onEquip }: { userId: string; equipped: Equipped; onEquip: (next: Equipped) => void }) {
  const [items, setItems] = useState<Cosmetic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"background" | "frame" | "avatar">("background");
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let stopped = false;
    Promise.all([supabase.rpc("member_level", { _uid: userId }), supabase.from("mission_claims").select("id", { count: "exact", head: true }).eq("user_id", userId), supabase.from("subscriptions").select("plan,status,expires_at").eq("user_id", userId).maybeSingle()]).then(([level, missions, sub]) => {
      if (stopped) return;
      if (level.error || missions.error || sub.error) toast.error("No se pudieron cargar tus recompensas");
      else setItems(ALL_COSMETICS.filter(r => r.kind !== "rare" && cosmeticUnlocked(r, level.data ?? 1, missions.count ?? 0, activePlan(sub.data))));
      setLoading(false);
    });
    return () => { stopped = true; };
  }, [userId]);
  const equip = async (r: Cosmetic) => {
    const key = r.kind === "frame" ? "equipped_frame" : r.kind === "avatar" ? "equipped_avatar" : "equipped_background";
    const next = { ...equipped, [key]: equipped[key] === r.id ? null : r.id };
    setBusy(r.id);
    const { error } = await supabase.from("profiles").update({ [key]: next[key] }).eq("id", userId);
    setBusy(null);
    if (error) return toast.error(error.message);
    onEquip(next); toast.success(next[key] ? `${r.name} equipado` : "Recompensa quitada");
  };
  return <section className="border-t border-border pt-5">
    <h3 className="text-lg font-bold">Tu colección</h3>
    <div className="my-4 flex flex-wrap gap-2" role="tablist" aria-label="Colección de perfil">
      {(["background", "frame", "avatar"] as const).map(kind => <Button type="button" role="tab" aria-selected={tab === kind} key={kind} variant={tab === kind ? "default" : "outline"} onClick={() => setTab(kind)}>{kind === "background" ? "Banners" : kind === "frame" ? "Marcos" : "Avatares"}</Button>)}
    </div>
    {loading ? <Loader2 className="animate-spin" /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.filter(r => r.kind === tab).map(r => { const on = Object.values(equipped).includes(r.id); return <article key={r.id} className={`rounded-md border p-3 ${on ? "border-neon-cyan" : "border-border"}`}>
        <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-md bg-secondary">
          {r.kind === "background" ? <CosmeticBanner id={r.id} /> : <CosmeticAvatar name={r.name} avatar={r.kind === "avatar" ? r.id : "avatar-sentinel"} frame={r.kind === "frame" ? r.id : null} size="small" />}
        </div>
        <p className="mt-2 min-h-10 text-sm font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.source === "membership" ? "Membresía especial" : r.source === "pass" ? `Pase · Etapa ${r.tier}` : `Nivel ${r.level}`}</p>
        <Button type="button" size="sm" variant={on ? "default" : "outline"} className="mt-2 w-full" disabled={busy !== null} onClick={() => void equip(r)}>{on ? <Check /> : null}{on ? "Equipado" : "Equipar"}</Button>
      </article>; })}
    </div>}
    {!loading && !items.some(r => r.kind === tab) && <p className="py-4 text-muted-foreground"><Lock className="mr-2 inline h-4 w-4" />Aún no tienes recompensas en esta colección.</p>}
    <Button type="button" asChild variant="link" className="mt-3"><Link to="/niveles">Ver misiones y pase NEXUS</Link></Button>
  </section>;
}