import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, ClipboardCheck, Loader2, Search, Shield, Star, UserRound, XCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { supabase } from "@/integrations/supabase/client";
import {
  decideCandidate, evaluateCandidate, getCandidateProgress, getEvaluations, getHistory,
  listApplications, reviewApplication, PHASE_LABEL, STATUS_META, ACTION_LABEL,
  type AppStatus, type Evaluation, type HistoryEntry, type Progress, type StaffApplication,
} from "@/lib/staffProgram";

export const Route = createFileRoute("/admin/candidatos")({
  head: () => ({ meta: [
    { title: "Candidatos a Staff — ItsaBDias" },
    { name: "description", content: "Panel privado de revisión del programa de Moderadores." },
    { property: "og:title", content: "Candidatos a Staff — ItsaBDias" },
    { property: "og:description", content: "Revisión privada de candidaturas y formación del Staff." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CandidatesAdminPage,
});

type CandidateView = StaffApplication & { profile?: { username: string; avatar_url: string | null }; progress?: Progress | null };
const emptyScores = { knowledge: 3, responsibility: 3, moderation: 3, communication: 3, security: 3, ethics: 3 };

function CandidatesAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useMyRoles();
  const [items, setItems] = useState<CandidateView[]>([]);
  const [selected, setSelected] = useState<CandidateView | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [status, setStatus] = useState<AppStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [recommendation, setRecommendation] = useState<"approve" | "reject" | "extra_training">("approve");
  const [scores, setScores] = useState(emptyScores);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!isAdmin) { setLoading(false); return; }
    const applications = await listApplications(status);
    const userIds = [...new Set(applications.map((item) => item.user_id))];
    const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds) : { data: [] };
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const rows = await Promise.all(applications.map(async (application) => ({ ...application, profile: profileMap.get(application.user_id), progress: await getCandidateProgress(application.user_id) })));
    setItems(rows);
    setSelected((current) => current ? rows.find((item) => item.id === current.id) ?? null : null);
    setLoading(false);
  };

  useEffect(() => { if (!authLoading && !rolesLoading) void load(); }, [authLoading, rolesLoading, isAdmin, status]);

  const openCandidate = async (candidate: CandidateView) => {
    setSelected(candidate); setNote("");
    const [entries, evals] = await Promise.all([getHistory(candidate.user_id), getEvaluations(candidate.id)]);
    setHistory(entries); setEvaluations(evals);
  };

  const act = async (action: () => Promise<boolean>) => {
    setBusy(true); const ok = await action(); setBusy(false);
    if (ok) { await load(); if (selected) await openCandidate(selected); }
  };

  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.profile?.username ?? ""} ${item.motivation}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }), [items, query]);

  if (authLoading || rolesLoading || loading) return <PageShell><div className="py-32 text-center"><Loader2 className="mx-auto animate-spin text-neon-cyan" /></div></PageShell>;
  if (!user || !isAdmin) return <PageShell><section className="mx-auto max-w-xl px-6 py-28 text-center"><Shield className="mx-auto h-14 w-14 text-destructive" /><h1 className="mt-5 text-3xl font-bold">Acceso restringido</h1><p className="mt-3 text-muted-foreground">Solo Administradores y Founder pueden revisar candidaturas.</p></section></PageShell>;

  return <PageShell><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <SectionTitle eyebrow="// staff control" title="Candidatos a Staff" subtitle="Revisa solicitudes, progreso, evaluaciones y decisiones con historial permanente." />
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="glass flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row lg:flex-col">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar candidato" className="w-full rounded-md border border-border bg-background/60 py-2 pl-10 pr-3 text-sm outline-none focus:border-neon-cyan" /></div>
          <select value={status} onChange={(e) => setStatus(e.target.value as AppStatus | "all")} className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="all">Todos los estados</option>{Object.entries(STATUS_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}</select>
        </div>
        {filtered.length === 0 && <div className="glass rounded-lg p-6 text-center text-muted-foreground">No hay candidaturas en esta vista.</div>}
        {filtered.map((candidate) => <Button key={candidate.id} variant="ghost" onClick={() => void openCandidate(candidate)} className={`glass h-auto w-full justify-start whitespace-normal rounded-lg border p-4 text-left ${selected?.id === candidate.id ? "border-neon-cyan" : "border-border"}`}>
          <UserRound className="h-9 w-9 text-neon-cyan" /><span className="min-w-0 flex-1"><span className="block truncate font-bold">{candidate.profile?.username || "Usuario"}</span><span className="block text-xs text-muted-foreground">{STATUS_META[candidate.status].label} · {candidate.progress?.percent ?? 0}%</span></span><ChevronRight />
        </Button>)}
      </div>

      {!selected ? <div className="glass rounded-lg border border-border p-10 text-center"><ClipboardCheck className="mx-auto h-12 w-12 text-neon-purple" /><h2 className="mt-4 text-xl font-bold">Selecciona una candidatura</h2><p className="mt-2 text-muted-foreground">Aquí aparecerá la solicitud completa y sus controles.</p></div> : <div className="space-y-5">
        <section className="glass rounded-lg border border-border p-5 sm:p-7">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:justify-between"><div className="min-w-0"><p className="truncate text-xs uppercase text-neon-cyan">{selected.profile?.username ? `@${selected.profile.username}` : selected.user_id}</p><h1 className="mt-1 truncate text-2xl font-bold">{selected.profile?.username || "Candidato"}</h1><p className="text-sm text-muted-foreground">{PHASE_LABEL[selected.phase]}</p></div><span className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs">{STATUS_META[selected.status].dot} {STATUS_META[selected.status].label}</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Progreso" value={`${selected.progress?.percent ?? 0}%`} /><Metric label="Clases" value={`${selected.progress?.lessons_done ?? 0}/${selected.progress?.lessons_total ?? 0}`} /><Metric label="Exámenes" value={`${selected.progress?.exams_passed ?? 0}/${selected.progress?.exams_total ?? 0}`} /></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><Answer title="Motivación" text={selected.motivation} /><Answer title="Aporte" text={selected.contribution} /><Answer title="Experiencia" text={selected.experience || "Sin experiencia indicada"} /><Answer title="Conocimientos" text={selected.tech_knowledge || "No indicados"} /><Answer title="Resolución de conflictos" text={selected.conflict_answer} /><Answer title="Confianza" text={selected.trust_answer} /></div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Nota obligatoria para justificar la revisión o decisión" className="mt-5 w-full rounded-md border border-border bg-background/60 p-3 text-sm outline-none focus:border-neon-cyan" />
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.status === "pending" && <Button variant="outline" disabled={busy} onClick={() => void act(() => reviewApplication(selected.id, "reviewing", note))}>Iniciar revisión</Button>}
            {(["pending", "reviewing"] as AppStatus[]).includes(selected.status) && <><Button disabled={busy} onClick={() => void act(() => reviewApplication(selected.id, "accepted", note))}><CheckCircle2 /> Aceptar candidatura</Button><Button variant="destructive" disabled={busy || !note.trim()} onClick={() => void act(() => reviewApplication(selected.id, "rejected", note))}><XCircle /> Rechazar</Button></>}
            {selected.profile?.username && <Button asChild variant="outline"><Link to="/u/$username" params={{ username: selected.profile.username }}>Ver perfil público</Link></Button>}
          </div>
        </section>

        {selected.status === "accepted" && <section className="glass rounded-lg border border-border p-5 sm:p-7"><h2 className="text-xl font-bold">Evaluación final</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.keys(scores).map((key) => <label key={key} className="rounded-md border border-border p-3 text-sm"><span className="mb-2 flex justify-between capitalize"><span>{key === "knowledge" ? "Conocimiento" : key === "responsibility" ? "Responsabilidad" : key === "moderation" ? "Moderación" : key === "communication" ? "Comunicación" : key === "security" ? "Seguridad" : "Ética"}</span><strong>{scores[key as keyof typeof scores]}/5</strong></span><input type="range" min="1" max="5" value={scores[key as keyof typeof scores]} onChange={(e) => setScores((current) => ({ ...current, [key]: Number(e.target.value) }))} className="w-full accent-primary" /></label>)}</div><select value={recommendation} onChange={(e) => setRecommendation(e.target.value as typeof recommendation)} className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="approve">Recomendar aprobación</option><option value="extra_training">Formación adicional</option><option value="reject">Recomendar rechazo</option></select><Button className="mt-4 ml-2" variant="outline" disabled={busy || !note.trim()} onClick={() => void act(() => evaluateCandidate(selected.id, scores, note, recommendation))}><Star /> Guardar evaluación</Button>
          {evaluations.length > 0 && <div className="mt-5 border-t border-border pt-5"><p className="mb-3 text-sm font-bold">Decisión protegida</p><div className="flex flex-wrap gap-2"><Button disabled={busy || !selected.progress?.training_complete} onClick={() => void act(() => decideCandidate(selected.id, "approve", note))}>Aprobar como Moderador</Button><Button variant="outline" disabled={busy || !note.trim()} onClick={() => void act(() => decideCandidate(selected.id, "extra_training", note))}>Pedir formación adicional</Button><Button variant="destructive" disabled={busy || !note.trim()} onClick={() => void act(() => decideCandidate(selected.id, "reject", note))}>Rechazar candidato</Button></div>{!selected.progress?.training_complete && <p className="mt-2 text-xs text-muted-foreground">La aprobación se habilita al completar todas las clases y exámenes.</p>}</div>}
        </section>}

        <section className="glass rounded-lg border border-border p-5 sm:p-7"><h2 className="text-xl font-bold">Historial inmutable</h2><div className="mt-4 space-y-2">{history.length === 0 ? <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p> : history.map((entry) => <div key={entry.id} className="flex flex-wrap gap-2 border-b border-border/60 py-2 text-sm"><span className="font-semibold">{ACTION_LABEL[entry.action] ?? entry.action}</span><span className="text-neon-cyan">{entry.result}</span><time className="ml-auto text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString("es-ES")}</time>{entry.detail && <p className="w-full text-muted-foreground">{entry.detail}</p>}</div>)}</div></section>
      </div>}
    </div>
  </section></PageShell>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-border bg-secondary/30 p-3"><p className="text-xl font-bold text-neon-cyan">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>; }
function Answer({ title, text }: { title: string; text: string }) { return <div><h3 className="text-xs uppercase text-neon-purple">{title}</h3><p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{text}</p></div>; }