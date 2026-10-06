import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award, CheckCircle2, ChevronRight, Crown, Flame, Gift, Lock,
  Medal, Radar, Shield, Sparkles, Star, Target, Trophy, Zap,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_RANKS, LEVEL_REWARDS, MAX_LEVEL, MISSIONS, levelFromXp,
  rankFromLevel, staffTitle, type Metric,
} from "@/lib/hunter";
import { toast } from "sonner";

export const Route = createFileRoute("/niveles")({
  head: () => ({
    meta: [
      { title: "Niveles, rangos y misiones — ItsaBDias" },
      { name: "description", content: "Consulta tu progreso, completa misiones, desbloquea 50 rangos y alcanza el nivel 100 en ItsaBDias." },
      { property: "og:title", content: "Niveles, rangos y misiones — ItsaBDias" },
      { property: "og:description", content: "100 niveles, 50 rangos, recompensas y progreso especial para el Staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LevelsPage,
});

type Tab = "overview" | "missions" | "ranks" | "staff";
type ProgressData = { xp: number; staff_xp: number; streak: number; last_daily: string | null };

const XP_SOURCES = [
  ["Publicar un proyecto", "+40 EXP"], ["Crear un tutorial", "+30 EXP"],
  ["Completar una lección", "+15 EXP"], ["Publicar en Comunidad", "+10 EXP"],
  ["Comentar", "+3 EXP"], ["Recibir un Me gusta", "+2 EXP"],
] as const;

const STAFF_SOURCES = [
  ["Resolver reportes", "Protege la comunidad y documenta la decisión."],
  ["Responder tickets", "Ayuda a los miembros con respuestas útiles."],
  ["Revisar errores", "Confirma reportes reales desde el panel."],
] as const;

function LevelsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading: rolesLoading } = useMyRoles();
  const [tab, setTab] = useState<Tab>("overview");
  const [progress, setProgress] = useState<ProgressData>({ xp: 0, staff_xp: 0, streak: 0, last_daily: null });
  const [stats, setStats] = useState<Record<string, number>>({});
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [xpResult, statsResult, claimsResult] = await Promise.all([
      supabase.from("hunter_xp").select("xp,staff_xp,streak,last_daily").eq("user_id", user.id).maybeSingle(),
      supabase.rpc("hunter_mission_stats"),
      supabase.from("mission_claims").select("mission_key").eq("user_id", user.id),
    ]);
    setProgress(xpResult.data ?? { xp: 0, staff_xp: 0, streak: 0, last_daily: null });
    setStats((statsResult.data as Record<string, number>) ?? {});
    setClaimed(new Set((claimsResult.data ?? []).map((item) => item.mission_key)));
  };

  useEffect(() => { if (!authLoading && user) void load(); }, [authLoading, user?.id]);

  const member = levelFromXp(progress.xp);
  const rank = rankFromLevel(member.level);
  const staff = levelFromXp(progress.staff_xp);
  const completedMissions = useMemo(() => MISSIONS.filter((mission) => claimed.has(mission.key)).length, [claimed]);
  const today = new Date().toISOString().slice(0, 10);
  const dailyClaimed = progress.last_daily === today;

  const claimDaily = async () => {
    setBusy("daily");
    const { data, error } = await supabase.rpc("claim_daily_xp");
    setBusy(null);
    if (error) return toast.error(error.message);
    const result = data as { reward: number; streak: number };
    toast.success(`+${result.reward} EXP · Racha de ${result.streak} día(s)`);
    await load();
  };

  const claimMission = async (key: string) => {
    setBusy(key);
    const { data, error } = await supabase.rpc("hunter_claim_mission", { _key: key });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`+${data} EXP obtenida`);
    await load();
  };

  const tabs: Array<{ key: Tab; label: string; icon: typeof Radar; hidden?: boolean }> = [
    { key: "overview", label: "Resumen", icon: Radar },
    { key: "missions", label: "Misiones", icon: Target },
    { key: "ranks", label: "Rangos", icon: Crown },
    { key: "staff", label: "Staff", icon: Shield, hidden: !isStaff },
  ];

  return (
    <PageShell>
      <main className="relative overflow-hidden">
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <header className="mb-7 border-b border-border pb-7">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase text-neon-cyan">
              <Sparkles className="h-4 w-4" /> Sistema de progreso NEXUS
            </div>
            <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl font-black sm:text-6xl">Tu camino hasta <span className="text-gradient-neon">Abdias Prime</span></h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Completa misiones, participa en la comunidad y desbloquea 100 niveles, 50 rangos y recompensas exclusivas.</p>
              </div>
              <div className="rounded-md border border-neon-cyan/40 bg-card p-4 shadow-neon-blue">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-muted-foreground">Estado de jugador</span>
                  <span className="inline-flex items-center gap-1 text-xs text-neon-cyan"><span className="h-2 w-2 rounded-full bg-neon-cyan" /> En línea</span>
                </div>
                <p className="mt-3 text-2xl font-bold">{user ? rank.name : "Recluta NEXUS"}</p>
                <p className="text-sm text-muted-foreground">{user ? `Rango ${rank.index} de 50` : "Inicia sesión para guardar tu avance"}</p>
              </div>
            </div>
          </header>

          {!user && !authLoading ? (
            <GuestPreview />
          ) : (
            <>
              <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.5fr)]">
                <div className="relative overflow-hidden rounded-md border border-neon-purple/50 bg-gradient-card p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-16 w-16 place-items-center rounded-md border border-neon-cyan/50 bg-background text-2xl font-black text-neon-cyan shadow-neon-blue">{member.level}</div>
                      <div><p className="font-mono text-xs uppercase text-muted-foreground">Nivel actual</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">{rank.name}</h2><p className="text-sm text-muted-foreground">{progress.xp.toLocaleString()} EXP acumulada</p></div>
                    </div>
                    <div className="text-right"><p className="font-mono text-xs text-muted-foreground">OBJETIVO</p><p className="text-xl font-bold text-neon-cyan">NV {Math.min(MAX_LEVEL, member.level + 1)}</p></div>
                  </div>
                  <div className="mt-6 h-3 overflow-hidden rounded-full border border-border bg-background"><div className="h-full bg-gradient-neon transition-[width] duration-700" style={{ width: `${member.pct}%` }} /></div>
                  <div className="mt-2 flex justify-between text-xs font-mono text-muted-foreground"><span>{member.pct}% completado</span><span>{member.level >= MAX_LEVEL ? "Nivel máximo" : `${member.next - progress.xp} EXP restantes`}</span></div>
                </div>
                <div className="rounded-md border border-border bg-card p-5">
                  <div className="flex items-center gap-2"><Flame className="text-neon-purple" /><span className="font-bold">Racha diaria</span></div>
                  <div className="my-4 flex items-end gap-2"><strong className="text-5xl">{progress.streak}</strong><span className="pb-1 text-muted-foreground">días</span></div>
                  <Button className="w-full" disabled={dailyClaimed || busy === "daily"} onClick={() => void claimDaily()}><Gift />{dailyClaimed ? "Recompensa obtenida" : "Reclamar EXP diaria"}</Button>
                </div>
              </section>

              <nav className="mb-7 grid grid-cols-3 gap-2 rounded-md border border-border bg-card p-1 sm:flex" aria-label="Secciones de niveles">
                {tabs.filter((item) => !item.hidden).map(({ key, label, icon: Icon }) => <Button key={key} variant={tab === key ? "default" : "ghost"} onClick={() => setTab(key)} className="min-w-0"><Icon /> <span className="truncate">{label}</span></Button>)}
              </nav>

              {tab === "overview" && <Overview level={member.level} rankName={rank.name} completedMissions={completedMissions} nextReward={LEVEL_REWARDS.find((reward) => reward.level > member.level)} />}
              {tab === "missions" && <Missions stats={stats} claimed={claimed} busy={busy} onClaim={claimMission} />}
              {tab === "ranks" && <Ranks currentLevel={member.level} />}
              {tab === "staff" && isStaff && <StaffProgress level={staff.level} pct={staff.pct} xp={progress.staff_xp} next={staff.next} />}
            </>
          )}
        </section>
      </main>
    </PageShell>
  );
}

function GuestPreview() {
  return <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="rounded-md border border-border bg-card p-6 sm:p-8"><Trophy className="h-12 w-12 text-neon-cyan" /><h2 className="mt-5 text-2xl font-bold">Tu progreso comienza aquí</h2><p className="mt-2 max-w-xl text-muted-foreground">Cada aporte cuenta: publica, aprende, comenta, ayuda a la comunidad y completa misiones para avanzar.</p><Button asChild className="mt-6"><Link to="/auth">Iniciar sesión <ChevronRight /></Link></Button></div><div className="rounded-md border border-neon-purple/40 bg-gradient-card p-6"><p className="font-mono text-xs uppercase text-neon-cyan">Máximo desbloqueo</p><Crown className="mt-5 h-12 w-12 text-neon-purple" /><p className="mt-3 text-2xl font-bold">Abdias Prime</p><p className="text-sm text-muted-foreground">Nivel 100 · Rango 50</p></div></section>;
}

function Overview({ level, rankName, completedMissions, nextReward }: { level: number; rankName: string; completedMissions: number; nextReward?: { level: number; name: string } }) {
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]"><section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Cómo ganar EXP</h2><span className="font-mono text-xs text-muted-foreground">ACTIVIDAD AUTOMÁTICA</span></div><div className="grid gap-3 sm:grid-cols-2">{XP_SOURCES.map(([label, xp], index) => <div key={label} className="flex items-center gap-3 rounded-md border border-border bg-card p-4"><span className="grid h-9 w-9 place-items-center rounded-md bg-secondary font-mono text-neon-cyan">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 font-semibold">{label}</span><span className="font-mono text-sm text-neon-cyan">{xp}</span></div>)}</div></section><aside className="space-y-3"><Metric icon={Medal} label="Rango actual" value={rankName} /><Metric icon={Target} label="Misiones reclamadas" value={`${completedMissions}/${MISSIONS.length}`} /><Metric icon={Award} label="Próxima recompensa" value={nextReward ? `Nv ${nextReward.level} · ${nextReward.name}` : "Todo desbloqueado"} /><Metric icon={Star} label="Nivel global" value={`${level}/${MAX_LEVEL}`} /></aside></div>;
}

function Missions({ stats, claimed, busy, onClaim }: { stats: Record<string, number>; claimed: Set<string>; busy: string | null; onClaim: (key: string) => Promise<void> }) {
  const groups = useMemo(() => MISSIONS.reduce<Record<string, typeof MISSIONS>>((all, mission) => { (all[mission.metric] ??= []).push(mission); return all; }, {}), []);
  return <section><div className="mb-5"><h2 className="text-2xl font-bold">Misiones de la comunidad</h2><p className="mt-1 text-muted-foreground">Completa objetivos reales y reclama su EXP. Tu progreso se registra automáticamente.</p></div><div className="space-y-7">{Object.entries(groups).map(([metric, missions]) => <MissionGroup key={metric} metric={metric as Metric} missions={missions} stats={stats} claimed={claimed} busy={busy} onClaim={onClaim} />)}</div></section>;
}

const MISSION_TITLES: Record<Metric, string> = { bugs_sent: "Cazador de errores", bugs_confirmed: "Ojo clínico", posts: "Voz de la comunidad", comments: "Conversador", projects: "Constructor", follows: "Conector", lessons: "Aprendiz NEXUS", nexus: "Explorador de IA" };

function MissionGroup({ metric, missions, stats, claimed, busy, onClaim }: { metric: Metric; missions: typeof MISSIONS; stats: Record<string, number>; claimed: Set<string>; busy: string | null; onClaim: (key: string) => Promise<void> }) {
  const have = stats[metric] ?? 0;
  return <div><div className="mb-3 flex items-center gap-2"><Zap className="text-neon-cyan" /><h3 className="text-lg font-bold">{MISSION_TITLES[metric]}</h3></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{missions.map((mission) => { const done = have >= mission.target; const got = claimed.has(mission.key); const pct = Math.min(100, (have / mission.target) * 100); return <article key={mission.key} className={`rounded-md border bg-card p-4 ${got ? "border-neon-cyan/50" : "border-border"}`}><div className="flex items-start justify-between gap-3"><p className="font-semibold">{mission.label}</p><span className="shrink-0 font-mono text-xs text-neon-cyan">+{mission.reward} EXP</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-neon" style={{ width: `${pct}%` }} /></div><div className="mt-3 flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{Math.min(have, mission.target)}/{mission.target}</span>{got ? <span className="inline-flex items-center gap-1 text-xs text-neon-cyan"><CheckCircle2 className="h-4 w-4" /> Reclamada</span> : <Button size="sm" disabled={!done || busy === mission.key} onClick={() => void onClaim(mission.key)}>Reclamar</Button>}</div></article>; })}</div></div>;
}

function Ranks({ currentLevel }: { currentLevel: number }) {
  const currentRank = rankFromLevel(currentLevel);
  return <section className="space-y-9"><div><h2 className="text-2xl font-bold">Los 50 rangos</h2><p className="mt-1 text-muted-foreground">Cada dos niveles desbloqueas una nueva identidad dentro de NEXUS.</p><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{ALL_RANKS.map((rank) => { const unlocked = rank.index <= currentRank.index; return <div key={rank.index} className={`relative overflow-hidden rounded-md border p-3 ${unlocked ? "border-neon-cyan/40 bg-card" : "border-border bg-card/40 opacity-55"}`}><div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">#{String(rank.index).padStart(2, "0")}</span>{unlocked ? <CheckCircle2 className="h-4 w-4 text-neon-cyan" /> : <Lock className="h-4 w-4 text-muted-foreground" />}</div><p className="mt-3 min-h-10 text-sm font-bold">{rank.name}</p><p className="font-mono text-[11px] text-muted-foreground">Nivel {rank.minLevel}</p></div>; })}</div></div><div><h2 className="text-2xl font-bold">Recompensas de nivel</h2><p className="mt-1 text-muted-foreground">Un premio importante cada cinco niveles.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{LEVEL_REWARDS.map((reward) => { const unlocked = currentLevel >= reward.level; return <div key={reward.level} className={`flex items-center gap-3 rounded-md border p-4 ${unlocked ? "border-neon-purple/50 bg-gradient-card" : "border-border bg-card/50"}`}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-secondary font-mono font-bold">{reward.level}</span><div><p className="text-xs uppercase text-muted-foreground">Nivel {reward.level}</p><p className="font-semibold">{reward.name}</p></div>{unlocked ? <Gift className="ml-auto text-neon-cyan" /> : <Lock className="ml-auto text-muted-foreground" />}</div>; })}</div></div></section>;
}

function StaffProgress({ level, pct, xp, next }: { level: number; pct: number; xp: number; next: number }) {
  return <section><div className="rounded-md border border-neon-cyan/50 bg-gradient-card p-5 shadow-neon-blue sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-md border border-neon-cyan/50 bg-background"><Shield className="h-7 w-7 text-neon-cyan" /></div><div><p className="font-mono text-xs uppercase text-neon-cyan">Progreso de Staff</p><h2 className="mt-1 text-2xl font-bold">{staffTitle(level)}</h2></div></div><div className="text-right"><p className="text-3xl font-black">NV {level}</p><p className="text-xs text-muted-foreground">{xp.toLocaleString()} EXP Staff</p></div></div><div className="mt-6 h-3 overflow-hidden rounded-full border border-border bg-background"><div className="h-full bg-neon-cyan transition-[width] duration-700" style={{ width: `${pct}%` }} /></div><p className="mt-2 text-right font-mono text-xs text-muted-foreground">{level >= MAX_LEVEL ? "Nivel máximo" : `${next - xp} EXP para avanzar`}</p></div><div className="mt-6 grid gap-3 md:grid-cols-3">{STAFF_SOURCES.map(([title, text]) => <article key={title} className="rounded-md border border-border bg-card p-5"><Shield className="h-6 w-6 text-neon-cyan" /><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></article>)}</div><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to="/admin">Abrir panel de Staff <ChevronRight /></Link></Button><Button asChild variant="outline"><Link to="/academia-staff">Continuar formación</Link></Button></div></section>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Medal; label: string; value: string }) {
  return <div className="rounded-md border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs uppercase text-muted-foreground"><Icon className="h-4 w-4 text-neon-cyan" />{label}</div><p className="mt-2 font-bold">{value}</p></div>;
}