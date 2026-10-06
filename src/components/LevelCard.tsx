import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Shield, Gift, Flame, Lock } from "lucide-react";
import { levelFromXp, rankFromLevel, staffTitle, LEVEL_REWARDS, MAX_LEVEL } from "@/lib/hunter";

export function LevelCard({ userId, isStaff, own }: { userId: string; isStaff: boolean; own: boolean }) {
  const [d, setD] = useState<{ xp: number; staff_xp: number; streak: number; last_daily: string | null } | null>(null);

  async function load() {
    if (own) {
      const { data } = await supabase.from("hunter_xp").select("xp,staff_xp,streak,last_daily").eq("user_id", userId).maybeSingle();
      setD(data ?? { xp: 0, staff_xp: 0, streak: 0, last_daily: null });
      return;
    }
    const { data } = await supabase.rpc("get_user_level", { _user_id: userId });
    const row = (data as any[] | null)?.[0];
    setD(row ? { ...row, last_daily: null } : { xp: 0, staff_xp: 0, streak: 0, last_daily: null });
  }
  useEffect(() => { load(); }, [userId]);

  async function daily() {
    const { data, error } = await supabase.rpc("claim_daily_xp");
    if (error) return toast.error(error.message);
    const r = data as { reward: number; streak: number };
    toast.success(`+${r.reward} EXP · Racha de ${r.streak} día(s) 🔥`);
    load();
  }

  if (!d) return null;
  const m = levelFromXp(d.xp);
  const rank = rankFromLevel(m.level);
  const s = levelFromXp(d.staff_xp);
  const today = new Date().toISOString().slice(0, 10);
  const claimedToday = d.last_daily === today;

  return (
    <div className="glass rounded-2xl p-6 border border-neon-purple/40 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-lg font-bold"><span className="text-neon-cyan">//</span> nivel de miembro</h3>
        <Link to="/niveles" className="text-xs text-neon-cyan hover:underline">Ver niveles y misiones →</Link>
      </div>
      <Progress icon={<Star className="h-5 w-5" />} level={m.level} pct={m.pct} xp={d.xp} next={m.next} title={rank.name} color={rank.color} />

      {own && (
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={claimedToday} onClick={daily} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-semibold disabled:opacity-50">
            <Gift className="h-4 w-4" /> {claimedToday ? "Recompensa diaria reclamada" : "Reclamar EXP diaria"}
          </button>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Flame className="h-4 w-4 text-orange-400" /> Racha: {d.streak} día(s)</span>
        </div>
      )}

      {isStaff && (
        <div className="pt-4 border-t border-border">
          <h4 className="font-display font-bold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-neon-cyan" /> Nivel de Staff</h4>
          <Progress icon={<Shield className="h-5 w-5" />} level={s.level} pct={s.pct} xp={d.staff_xp} next={s.next} title={staffTitle(s.level)} color="#22d3ee" />
          <p className="mt-2 text-xs text-muted-foreground">Ganas EXP de Staff resolviendo reportes, respondiendo tickets y revisando errores.</p>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <h4 className="font-display font-bold mb-3">Recompensas por nivel</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LEVEL_REWARDS.map((r) => {
            const ok = m.level >= r.level;
            return (
              <div key={r.level} className={`rounded-lg border p-2 text-center text-xs ${ok ? "border-neon-cyan/50 bg-neon-cyan/5" : "border-border opacity-50"}`}>
                <p className="font-mono text-muted-foreground flex items-center justify-center gap-1">{!ok && <Lock className="h-3 w-3" />} Nivel {r.level}</p>
                <p className="font-semibold">{r.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Progress({ icon, level, pct, xp, next, title, color }: { icon: React.ReactNode; level: number; pct: number; xp: number; next: number; title: string; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-bold" style={{ color }}>{icon} Nivel {level} · {title}</span>
        <span className="font-mono text-sm">{pct}%</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-input/40 overflow-hidden border border-border">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #a855f7)`, boxShadow: `0 0 12px ${color}88` }} />
      </div>
      <p className="mt-1 text-xs font-mono text-muted-foreground">{level >= MAX_LEVEL ? `${xp} EXP · nivel máximo` : `${xp.toLocaleString()} / ${next.toLocaleString()} EXP`}</p>
    </div>
  );
}
