import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import {
  applyToProgram, getMyApplication, getProgress, getHistory, getEvaluations,
  PHASE_LABEL, STATUS_META, ACTION_LABEL,
  type StaffApplication, type Progress, type HistoryEntry, type Evaluation,
} from "@/lib/staffProgram";
import { Shield, GraduationCap, Loader2, CheckCircle2, Clock, ScrollText, Award, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/programa-staff")({
  head: () => ({
    meta: [
      { title: "Programa de Moderadores — ItsaBDias" },
      { name: "description", content: "Solicita entrar al programa oficial de formación de Moderadores de ItsaBDias: formación, exámenes y evaluación del Staff." },
      { property: "og:title", content: "Programa oficial de Moderadores — ItsaBDias" },
      { property: "og:description", content: "Formación real, exámenes evaluados en el servidor y promoción protegida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffProgramPage,
});

const QUESTIONS = [
  { key: "motivation", label: "¿Por qué quieres ser Moderador?", min: 30 },
  { key: "contribution", label: "¿Qué puedes aportar a ITSABDIAS?", min: 30 },
  { key: "experience", label: "¿Qué experiencia tienes ayudando o moderando comunidades?", min: 0 },
  { key: "tech", label: "¿Qué conocimientos tecnológicos tienes?", min: 0 },
  { key: "conflict", label: "¿Cómo actuarías ante un conflicto entre usuarios?", min: 30 },
  { key: "trust", label: "¿Por qué deberíamos confiar en ti?", min: 30 },
] as const;

function StaffProgramPage() {
  const { user, loading: authLoading } = useAuth();
  const { isModerator } = useMyRoles();
  const nav = useNavigate();
  const [app, setApp] = useState<StaffApplication | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, string>>({});
  const [rules, setRules] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const a = await getMyApplication(user.id);
    setApp(a);
    const [p, h] = await Promise.all([getProgress(user.id), getHistory(user.id)]);
    setProgress(p);
    setHistory(h);
    if (a) setEvals(await getEvaluations(a.id));
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const submit = async () => {
    if (!rules) { toast.error("Debes aceptar las reglas del Staff"); return; }
    for (const q of QUESTIONS) {
      if ((form[q.key] ?? "").trim().length < q.min) {
        toast.error(`Responde con más detalle: ${q.label}`);
        return;
      }
    }
    setSending(true);
    const id = await applyToProgram({
      motivation: form["motivation"] ?? "", contribution: form["contribution"] ?? "",
      experience: form["experience"] ?? "", tech: form["tech"] ?? "",
      conflict: form["conflict"] ?? "", trust: form["trust"] ?? "",
    });
    setSending(false);
    if (id) { setForm({}); setRules(false); load(); }
  };

  if (authLoading || loading) {
    return <PageShell><div className="py-32 text-center text-muted-foreground"><Loader2 className="inline animate-spin" /></div></PageShell>;
  }

  if (!user) {
    return (
      <PageShell>
        <section className="py-24 px-6 mx-auto max-w-3xl text-center">
          <SectionTitle eyebrow="// staff program" title="Programa de Moderadores" subtitle="Inicia sesión para solicitar entrar al programa." />
          <Link to="/auth" className="mt-6 inline-flex px-6 py-3 rounded-md bg-gradient-neon text-primary-foreground font-semibold">Iniciar sesión</Link>
        </section>
      </PageShell>
    );
  }

  const isCandidate = app?.status === "accepted";
  const active = app && ["pending", "reviewing", "accepted"].includes(app.status);

  return (
    <PageShell>
      <section className="py-12 sm:py-16 px-4 sm:px-6 mx-auto max-w-5xl">
        <SectionTitle
          eyebrow="// staff program"
          title="Programa oficial de Moderadores"
          subtitle="Formación real, exámenes evaluados en el servidor y promoción protegida. Ninguna barra de progreso otorga el rango por sí sola."
        />

        {isModerator && (
          <div className="mt-6 glass neon-border rounded-xl p-4 text-sm text-muted-foreground">
            Ya formas parte del Staff. Puedes gestionar candidaturas en{" "}
            <Link to="/admin/candidatos" className="text-neon-cyan hover:underline">Admin → Candidatos</Link>.
          </div>
        )}

        {/* Estado / panel */}
        {app && (
          <div className="mt-8 glass neon-border rounded-2xl p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-neon-cyan" />
                <div>
                  <div className="font-display text-lg font-bold">
                    {isCandidate ? "Candidato a Moderador" : "Solicitud de Staff"}
                  </div>
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {PHASE_LABEL[app.phase]}
                  </div>
                </div>
              </div>
              <span
                className="px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-widest border"
                style={{
                  color: STATUS_META[app.status].color,
                  borderColor: `${STATUS_META[app.status].color}66`,
                  background: `${STATUS_META[app.status].color}14`,
                }}
              >
                {STATUS_META[app.status].dot} {STATUS_META[app.status].label}
              </span>
            </div>

            {app.review_note && (
              <p className="mt-4 text-sm text-muted-foreground border-l-2 border-neon-purple/60 pl-3">
                <span className="text-foreground font-semibold">Nota del Staff: </span>{app.review_note}
              </p>
            )}

            {isCandidate && progress && (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                    <span>Progreso general</span><span>{progress.percent}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-neon transition-all duration-700" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Metric label="Clases" value={`${progress.lessons_done}/${progress.lessons_total}`} />
                  <Metric label="Exámenes" value={`${progress.exams_passed}/${progress.exams_total}`} />
                  <Metric label="Formación" value={progress.training_complete ? "Completa" : "En curso"} />
                  <Metric label="Evaluación" value={evals.length ? "Registrada" : "Pendiente"} />
                </div>
                {progress.training_complete && (
                  <div className="glass rounded-xl p-4 border border-[#fbbf24]/50 flex items-start gap-3">
                    <Award className="h-5 w-5 text-[#fbbf24] shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-[#fbbf24]">🎓 Formación de Moderador completada</div>
                      <p className="text-muted-foreground">
                        La certificación acredita la formación. El rango depende de la evaluación y aprobación del Staff autorizado.
                      </p>
                    </div>
                  </div>
                )}
                <Link
                  to="/academia-staff"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-semibold text-sm shadow-neon-purple"
                >
                  <GraduationCap className="h-4 w-4" /> Ir a la Academia de Staff
                </Link>
              </div>
            )}

            {evals.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display font-bold mb-2 text-sm">Evaluaciones del Staff</h3>
                <div className="space-y-2">
                  {evals.map((e) => (
                    <div key={e.id} className="glass rounded-lg p-3 border border-border text-sm">
                      <div className="flex flex-wrap gap-3 text-xs font-mono text-muted-foreground">
                        <span>⭐ Conocimiento {e.knowledge}/5</span>
                        <span>⭐ Responsabilidad {e.responsibility}/5</span>
                        <span>⭐ Moderación {e.moderation}/5</span>
                        <span>⭐ Comunicación {e.communication}/5</span>
                        <span>⭐ Seguridad {e.security}/5</span>
                        <span>⭐ Ética {e.ethics}/5</span>
                      </div>
                      {e.overall_note && <p className="mt-2 text-muted-foreground">{e.overall_note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formulario */}
        {!isModerator && !active && (
          <div className="mt-8 glass neon-border rounded-2xl p-5 sm:p-7">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-neon-cyan" /> Quiero ser Moderador
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Responde con honestidad. No pedimos información personal: solo criterio y motivación.
            </p>
            <div className="mt-5 space-y-4">
              {QUESTIONS.map((q) => (
                <div key={q.key}>
                  <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                    {q.label} {q.min > 0 && <span className="text-neon-purple">*</span>}
                  </label>
                  <textarea
                    value={form[q.key] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [q.key]: e.target.value }))}
                    rows={3}
                    maxLength={1500}
                    className="w-full rounded-md bg-background/60 border border-border focus:border-neon-cyan/70 outline-none p-3 text-sm resize-y"
                    placeholder={q.min > 0 ? `Mínimo ${q.min} caracteres` : "Opcional"}
                  />
                </div>
              ))}
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} className="mt-1 accent-[hsl(var(--neon-cyan))]" />
                <span className="text-muted-foreground">
                  Acepto las reglas del Staff: imparcialidad, confidencialidad, respeto a la jerarquía y uso responsable de los permisos.
                </span>
              </label>
              <button
                onClick={submit}
                disabled={sending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gradient-neon text-primary-foreground font-semibold shadow-neon-purple disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar solicitud
              </button>
            </div>
          </div>
        )}

        {/* Historial */}
        {history.length > 0 && (
          <div className="mt-8 glass neon-border rounded-2xl p-5 sm:p-7">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
              <ScrollText className="h-5 w-5 text-neon-purple" /> Mi historial
            </h2>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-2 text-sm border-b border-border/60 pb-2">
                  {h.action.includes("approved") || h.action.includes("passed") || h.action.includes("completed")
                    ? <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                    : <Clock className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-semibold">{ACTION_LABEL[h.action] ?? h.action}</span>
                  {h.result && <span className="text-xs font-mono text-neon-cyan">{h.result}</span>}
                  <span className="ml-auto text-xs font-mono text-muted-foreground">
                    {new Date(h.created_at).toLocaleString("es-ES")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center border border-border">
      <div className="font-display text-lg font-bold text-gradient-neon">{value}</div>
      <div className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
