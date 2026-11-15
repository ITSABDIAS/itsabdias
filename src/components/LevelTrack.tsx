import { useEffect, useRef, useState } from "react";
import { Check, Gem, Image as ImageIcon, Lock, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LEVEL_REWARDS_FULL, type LevelReward } from "@/lib/cosmetics";

const KIND_LABEL = { frame: "Marco de perfil", background: "Fondo de perfil", rare: "Objeto raro" } as const;
const KIND_ICON = { frame: Square, background: ImageIcon, rare: Gem } as const;

export function LevelTrack({ userId, level }: { userId: string; level: number }) {
  const [equipped, setEquipped] = useState<{ frame: string | null; background: string | null }>({ frame: null, background: null });
  const [busy, setBusy] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("profiles").select("equipped_frame,equipped_background").eq("id", userId).maybeSingle().then(({ data }) => {
      if (data) setEquipped({ frame: data.equipped_frame, background: data.equipped_background });
    });
  }, [userId]);

  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-level="${level}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [level]);

  const equip = async (r: LevelReward) => {
    const col = r.kind === "frame" ? "equipped_frame" : "equipped_background";
    const key = r.kind === "frame" ? "frame" : "background";
    const value = equipped[key] === r.id ? null : r.id;
    setBusy(r.id);
    const { error } = await supabase.from("profiles").update({ [col]: value }).eq("id", userId);
    setBusy(null);
    if (error) return toast.error(error.message);
    setEquipped((e) => ({ ...e, [key]: value }));
    toast.success(value ? `${r.name} equipado en tu perfil` : "Recompensa quitada");
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">Camino de niveles</h2>
          <p className="text-muted-foreground">Cada nivel desbloquea algo nuevo. Desliza para ver todo el camino.</p>
        </div>
        <span className="font-mono text-xs text-neon-cyan">NV {level} / 100</span>
      </div>
      <div ref={scroller} className="flex snap-x gap-3 overflow-x-auto pb-4" role="list" aria-label="Recompensas por nivel">
        {LEVEL_REWARDS_FULL.map((r) => {
          const unlocked = r.level <= level;
          const Icon = KIND_ICON[r.kind];
          const isOn = equipped.frame === r.id || equipped.background === r.id;
          return (
            <div key={r.id} role="listitem" data-level={r.level}
              className={`relative w-40 shrink-0 snap-center rounded-md border bg-card p-3 transition ${r.level === level ? "border-neon-cyan shadow-neon-blue" : unlocked ? "border-primary/40" : "border-border opacity-60"}`}>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className={unlocked ? "text-neon-cyan" : "text-muted-foreground"}>NV {r.level}</span>
                {unlocked ? <Check className="h-4 w-4 text-neon-cyan" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="mt-3 grid h-20 place-items-center rounded-md" style={{ background: r.kind === "background" ? r.style : undefined }}>
                {r.kind === "frame" ? <div className="rounded-full p-1" style={{ background: r.style }}><div className="h-14 w-14 rounded-full bg-background" /></div>
                  : r.kind === "rare" ? <div className="grid h-14 w-14 place-items-center rounded-md" style={{ background: r.style }}><Icon className="h-6 w-6 text-foreground" /></div> : null}
              </div>
              <p className="mt-2 line-clamp-1 text-sm font-semibold">{unlocked ? r.name : "???"}</p>
              <p className="text-xs text-muted-foreground">{KIND_LABEL[r.kind]}</p>
              {r.kind !== "rare" && unlocked && (
                <Button size="sm" variant={isOn ? "default" : "outline"} className="mt-2 w-full" disabled={busy === r.id} onClick={() => void equip(r)}>
                  {isOn ? "Equipado" : "Equipar"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
