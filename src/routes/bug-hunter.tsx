import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bug, Trophy, Bot, Send } from "lucide-react";
import { levelFromXp, rankFromLevel, MAX_LEVEL } from "@/lib/hunter";

export const Route = createFileRoute("/bug-hunter")({
  head: () => ({
    meta: [
      { title: "Bug Hunter — Reporta errores y sube de rango | ItsaBDias" },
      { name: "description", content: "Reporta errores reales de ItsaBDias, gana XP, completa misiones y sube por 100 niveles y 50 rangos." },
      { property: "og:title", content: "Bug Hunter — ItsaBDias" },
      { property: "og:description", content: "Caza bugs, gana XP y conviértete en Abdias Prime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BugHunterPage,
});

type Report = { id: string; title: string; status: string; points_awarded: number; review_note: string | null; created_at: string };
type Leader = { user_id: string; xp: number; username?: string };

const STATUS: Record<string, string> = {
  pending: "⏳ En revisión", confirmed: "✅ Confirmado", fixed: "🛠️ Arreglado", rejected: "❌ No válido", duplicate: "♻️ Duplicado",
};

function BugHunterPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"report" | "top">("report");
  const [xp, setXp] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [form, setForm] = useState({ title: "", description: "", page: "", severity: "normal" });
  const [sending, setSending] = useState(false);

  async function load() {
    const { data: top } = await supabase.rpc("get_hunter_leaderboard", { _limit: 100 });
    const ids = (top ?? []).map((t) => t.user_id);
    const { data: profs } = ids.length ? await supabase.from("profiles").select("id,username").in("id", ids) : { data: [] };
    setLeaders((top ?? []).map((t) => ({ ...t, username: profs?.find((p) => p.id === t.user_id)?.username })));
    if (!user) return;
    const [x, r] = await Promise.all([
      supabase.from("hunter_xp").select("xp").eq("user_id", user.id).maybeSingle(),
      supabase.from("bug_reports").select("id,title,status,points_awarded,review_note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setXp(x.data?.xp ?? 0);
    setReports((r.data as Report[]) ?? []);
  }
  useEffect(() => { if (!loading) load(); }, [user, loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (form.title.trim().length < 5 || form.description.trim().length < 10) return toast.error("Título mínimo 5 letras y descripción mínimo 10.");
    setSending(true);
    const { error } = await supabase.from("bug_reports").insert({ ...form, title: form.title.trim(), description: form.description.trim(), user_id: user.id });
    setSending(false);
    if (error) return toast.error("No se pudo enviar el reporte.");
    toast.success("Reporte enviado. El staff lo revisará 🐞");
    setForm({ title: "", description: "", page: "", severity: "normal" });
    load();
  }

  const lv = levelFromXp(xp);
  const rank = rankFromLevel(lv.level);
  const nexusQ = `Ayúdame a escribir un buen reporte de error para ItsaBDias. Esto es lo que pasa: ${form.description || "(describe el problema)"}`;

  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <SectionTitle as="h1" eyebrow="Bug Hunter" title="Caza errores, gana EXP" subtitle="Reporta fallos reales de la página. Si el Staff los confirma, avanzas en el sistema de niveles." />

        {!user && !loading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="mb-4">Inicia sesión para empezar a cazar bugs.</p>
            <Link to="/auth" className="px-5 py-2 rounded-lg bg-primary text-primary-foreground">Entrar</Link>
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl p-6 mb-6 border" style={{ borderColor: rank.color + "66", boxShadow: `0 0 30px ${rank.color}33` }}>
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <p className="text-xs font-mono uppercase text-muted-foreground">Rango {rank.index}/50</p>
                  <p className="text-2xl font-bold" style={{ color: rank.color }}>{rank.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono uppercase text-muted-foreground">Nivel</p>
                  <p className="text-3xl font-bold text-gradient-neon">{lv.level}<span className="text-base text-muted-foreground">/{MAX_LEVEL}</span></p>
                </div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${lv.pct}%`, background: `linear-gradient(90deg, ${rank.color}, hsl(var(--primary)))` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground font-mono">{xp} XP · {lv.level >= MAX_LEVEL ? "¡Nivel máximo!" : `${lv.next - xp} XP para el nivel ${lv.level + 1}`}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {([["report", "Reportar", Bug], ["top", "Top 100", Trophy]] as const).map(([k, l, I]) => (
                <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${tab === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
                  <I className="h-4 w-4" /> {l}
                </button>
              ))}
            </div>

            {tab === "report" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <form onSubmit={submit} className="glass rounded-2xl p-6 space-y-3">
                  <h2 className="font-bold text-lg flex items-center gap-2"><Bug className="h-5 w-5 text-primary" /> Nuevo reporte</h2>
                  <input className="w-full rounded-lg bg-background/60 border border-border px-3 py-2" placeholder="Título (ej: El botón de seguir no funciona)" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <input className="w-full rounded-lg bg-background/60 border border-border px-3 py-2" placeholder="¿En qué página? (ej: /projects)" value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} />
                  <select className="w-full rounded-lg bg-background/60 border border-border px-3 py-2" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    <option value="low">Leve</option><option value="normal">Normal</option><option value="high">Grave</option><option value="critical">Crítico</option>
                  </select>
                  <textarea className="w-full rounded-lg bg-background/60 border border-border px-3 py-2 min-h-32" placeholder="Explica qué pasó, qué esperabas y los pasos para repetirlo" maxLength={3000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    <button disabled={sending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /> Enviar</button>
                    <Link to="/ai" search={{ q: nexusQ }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/50 text-primary"><Bot className="h-4 w-4" /> Pedir ayuda a NEXUS</Link>
                  </div>
                  <p className="text-xs text-muted-foreground">Bug confirmado: de 10 a 500 XP según su gravedad. Los reportes falsos no dan puntos.</p>
                </form>
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-3">Mis reportes</h2>
                  {reports.length === 0 ? <p className="text-sm text-muted-foreground">Aún no has enviado reportes.</p> : (
                    <ul className="space-y-2 max-h-[28rem] overflow-auto">
                      {reports.map((r) => (
                        <li key={r.id} className="rounded-lg border border-border p-3">
                          <div className="flex justify-between gap-2"><span className="font-medium">{r.title}</span>{r.points_awarded > 0 && <span className="text-primary font-mono text-sm">+{r.points_awarded} XP</span>}</div>
                          <p className="text-xs text-muted-foreground">{STATUS[r.status] ?? r.status} · {new Date(r.created_at).toLocaleDateString()}</p>
                          {r.review_note && <p className="text-xs mt-1">Staff: {r.review_note}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {tab === "top" && (
              <div className="glass rounded-2xl p-4">
                {leaders.length === 0 ? <p className="text-sm text-muted-foreground p-4">Aún no hay cazadores. ¡Sé el primero!</p> : leaders.map((l, i) => {
                  const lvl = levelFromXp(l.xp).level; const rk = rankFromLevel(lvl);
                  return (
                    <div key={l.user_id} className="flex items-center gap-3 p-3 border-b border-border last:border-0">
                      <span className="w-8 font-mono text-muted-foreground">#{i + 1}</span>
                      <span className="flex-1 font-medium">{l.username ?? "Usuario"}</span>
                      <span className="text-xs hidden sm:block" style={{ color: rk.color }}>{rk.name}</span>
                      <span className="font-mono text-sm">Nv {lvl} · {l.xp} XP</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}
