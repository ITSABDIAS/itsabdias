import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import {
  PRIORITY_META,
  STATUS_META,
  TARGET_LABEL,
  reportCode,
  updateReport,
  warnUser,
  type Report,
  type ReportAction,
  type ReportPriority,
  type ReportStatus,
} from "@/lib/reports";
import { SanctionDialog, PermanentBanDialog } from "@/components/SanctionDialog";
import { setUserStatus, requestPermanentBan } from "@/lib/staffActions";
import type { SanctionType } from "@/lib/sanctions";
import { Shield, ShieldAlert, Clock, Search, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { aiChat } from "@/lib/ai.functions";

export const Route = createFileRoute("/admin/reportes")({
  head: () => ({ meta: [{ title: "Admin · Reportes — ItsaBDias" }] }),
  component: AdminReportsPage,
});

const FILTERS: { key: string; label: string; status?: ReportStatus; critical?: boolean }[] = [
  { key: "all", label: "Todos" },
  { key: "new", label: "Nuevos", status: "new" },
  { key: "reviewing", label: "En revisión", status: "reviewing" },
  { key: "escalated", label: "Escalados", status: "escalated" },
  { key: "critical", label: "Críticos", critical: true },
  { key: "resolved", label: "Resueltos", status: "resolved" },
  { key: "closed", label: "Cerrados", status: "closed" },
];

function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isModerator, isAdmin, isFounder, loading: rolesLoading } = useMyRoles();

  const [rows, setRows] = useState<Report[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [prioFilter, setPrioFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useState<ReportAction[]>([]);
  const [sanction, setSanction] = useState<{ type: SanctionType; target: string; username: string } | null>(null);
  const [perma, setPerma] = useState<{ target: string; username: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (isModerator) load();
  }, [user?.id, authLoading, rolesLoading, isModerator]);

  const load = async () => {
    const { data } = await supabase.from("reports" as any).select("*").order("created_at", { ascending: false }).limit(300);
    const list = (data ?? []) as unknown as Report[];
    setRows(list);
    const ids = new Set<string>();
    list.forEach((r) => {
      ids.add(r.reporter_id);
      if (r.target_user_id) ids.add(r.target_user_id);
      if (r.assigned_to) ids.add(r.assigned_to);
    });
    if (ids.size) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", Array.from(ids));
      const m: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (m[p.id] = p.username));
      setNames(m);
    }
  };

  const openReport = async (id: string) => {
    setOpenId(id);
    setSummary(null);
    const { data } = await supabase
      .from("report_actions" as any)
      .select("*")
      .eq("report_id", id)
      .order("created_at", { ascending: true });
    setHistory((data ?? []) as unknown as ReportAction[]);
  };

  const current = rows.find((r) => r.id === openId) ?? null;

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    return rows
      .filter((r) => (f?.status ? r.status === f.status : true))
      .filter((r) => (f?.critical ? r.priority === "critical" : true))
      .filter((r) => (typeFilter === "all" ? true : r.target_type === typeFilter))
      .filter((r) => (prioFilter === "all" ? true : r.priority === prioFilter))
      .filter((r) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return (
          r.reason.toLowerCase().includes(s) ||
          (r.description ?? "").toLowerCase().includes(s) ||
          (names[r.reporter_id] ?? "").toLowerCase().includes(s) ||
          (r.target_user_id ? (names[r.target_user_id] ?? "").toLowerCase().includes(s) : false) ||
          reportCode(r.number).includes(s)
        );
      })
      .sort((a, b) => {
        const w = PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
        if (w !== 0) return w;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [rows, filter, typeFilter, prioFilter, q, names]);

  const doUpdate = async (patch: Parameters<typeof updateReport>[1]) => {
    if (!current) return;
    if (await updateReport(current.id, patch)) {
      await load();
      await openReport(current.id);
    }
  };

  const applySanction = async (reason: string, until: string) => {
    if (!sanction || !current) return;
    if (await setUserStatus(sanction.target, sanction.type, until, reason)) {
      await updateReport(current.id, { status: "resolved", resolution: `Sanción aplicada: ${sanction.type} — ${reason}` });
      setSanction(null);
      await load();
      await openReport(current.id);
    }
  };

  const sendPerma = async (reason: string, evidence: string) => {
    if (!perma || !current) return;
    if (await requestPermanentBan(perma.target, reason, evidence || undefined)) {
      await updateReport(current.id, { status: "escalated", resolution: "Solicitud de ban permanente enviada al Founder" });
      setPerma(null);
      await load();
      await openReport(current.id);
    }
  };

  const summarize = async () => {
    if (!current) return;
    setSummarizing(true);
    const related = rows.filter(
      (r) => r.id !== current.id && current.target_user_id && r.target_user_id === current.target_user_id,
    );
    try {
      const res = await aiChat({
        data: {
          messages: [
            {
              role: "user",
              content:
                `Eres asistente de moderación. Resume este reporte para el staff en español, en máximo 6 líneas: ` +
                `motivo, contexto, posibles duplicados y una prioridad sugerida (Baja/Normal/Alta/Crítica). ` +
                `No decidas sanciones.\n\n` +
                `Reporte ${reportCode(current.number)}\nTipo: ${TARGET_LABEL[current.target_type]}\nMotivo: ${current.reason}\n` +
                `Descripción: ${current.description ?? "—"}\nEvidencia: ${current.evidence ?? "—"}\n` +
                `Antecedentes del reportado: ${related.length} reporte(s) previos (${related.map((r) => r.reason).join(", ") || "ninguno"}).`,
            },
          ],
        },
      } as any);
      setSummary((res as any)?.content ?? "No se pudo generar el resumen.");
    } catch (e: any) {
      toast.error("NEXUS no está disponible ahora mismo");
    }
    setSummarizing(false);
  };

  if (authLoading || rolesLoading)
    return (
      <PageShell>
        <section className="py-32 text-center text-muted-foreground">Cargando…</section>
      </PageShell>
    );

  if (!isModerator)
    return (
      <PageShell>
        <section className="py-32 px-6 text-center">
          <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Solo staff</h1>
          <p className="text-muted-foreground text-sm">Esta sección es exclusiva para Moderadores, Administradores y el Founder.</p>
        </section>
      </PageShell>
    );

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle
          as="h1"
          eyebrow="// admin.reportes"
          title="Centro de reportes"
          subtitle="Gestiona reportes según tus permisos reales. Cada acción queda registrada en el historial."
        />
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link to="/admin" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/admin/usuarios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Usuarios</Link>
            <Link to="/admin/bans" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Bans permanentes</Link>
            <Link to="/admin/historial" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Historial</Link>
          </div>

          {!current && (
            <>
              {/* Filters */}
              <div className="glass rounded-xl p-3 border border-border mb-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`px-3 py-1.5 rounded-md text-xs border transition ${
                        filter === f.key ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[12rem]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar por usuario, motivo o #número"
                      className="w-full pl-8 pr-3 py-2 rounded-md bg-input/40 border border-border text-xs"
                    />
                  </div>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-md bg-input/40 border border-border text-xs">
                    <option value="all">Todo tipo</option>
                    {Object.entries(TARGET_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)} className="px-3 py-2 rounded-md bg-input/40 border border-border text-xs">
                    <option value="all">Toda prioridad</option>
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.dot} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filtered.map((r) => {
                  const st = STATUS_META[r.status];
                  const pr = PRIORITY_META[r.priority];
                  return (
                    <button
                      key={r.id}
                      onClick={() => openReport(r.id)}
                      className="w-full text-left glass rounded-xl p-4 border border-border hover:border-neon-cyan/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-400" />
                        <span className="font-mono text-xs text-muted-foreground">{reportCode(r.number)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded border font-mono uppercase" style={{ color: st.color, borderColor: `${st.color}80`, background: `${st.color}18` }}>
                          {st.dot} {st.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded border font-mono uppercase" style={{ color: pr.color, borderColor: `${pr.color}80`, background: `${pr.color}18` }}>
                          {pr.dot} {pr.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground font-mono uppercase">
                          {TARGET_LABEL[r.target_type]}
                        </span>
                        <span className="ml-auto text-[11px] font-mono text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-bold">{r.reason}</span>
                        <span className="text-muted-foreground"> · @{names[r.reporter_id] ?? "?"} → @{r.target_user_id ? names[r.target_user_id] ?? "?" : "—"}</span>
                      </p>
                      {r.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                    </button>
                  );
                })}
                {filtered.length === 0 && <p className="text-muted-foreground text-sm p-4">Sin reportes para este filtro.</p>}
              </div>
            </>
          )}

          {current && (
            <ReportDetail
              report={current}
              names={names}
              history={history}
              isAdmin={isAdmin}
              isFounder={isFounder}
              summary={summary}
              summarizing={summarizing}
              onSummarize={summarize}
              onBack={() => setOpenId(null)}
              onUpdate={doUpdate}
              onWarn={async (reason) => {
                if (!current.target_user_id) return toast.error("Este reporte no tiene usuario asociado");
                if (await warnUser(current.target_user_id, reason, current.id)) {
                  await load();
                  await openReport(current.id);
                }
              }}
              onSanction={(type) => {
                if (!current.target_user_id) return toast.error("Este reporte no tiene usuario asociado");
                setSanction({ type, target: current.target_user_id, username: names[current.target_user_id] ?? "usuario" });
              }}
              onPerma={() => {
                if (!current.target_user_id) return toast.error("Este reporte no tiene usuario asociado");
                setPerma({ target: current.target_user_id, username: names[current.target_user_id] ?? "usuario" });
              }}
            />
          )}
        </div>
      </section>

      {sanction && (
        <SanctionDialog
          type={sanction.type}
          username={sanction.username}
          onCancel={() => setSanction(null)}
          onConfirm={({ reason, until }) => applySanction(reason, until)}
        />
      )}
      {perma && (
        <PermanentBanDialog
          username={perma.username}
          staffName={user?.email ?? "staff"}
          onCancel={() => setPerma(null)}
          onConfirm={({ reason, evidence }) => sendPerma(reason, evidence)}
        />
      )}
    </PageShell>
  );
}

function ReportDetail({
  report,
  names,
  history,
  isAdmin,
  isFounder,
  summary,
  summarizing,
  onSummarize,
  onBack,
  onUpdate,
  onWarn,
  onSanction,
  onPerma,
}: {
  report: Report;
  names: Record<string, string>;
  history: ReportAction[];
  isAdmin: boolean;
  isFounder: boolean;
  summary: string | null;
  summarizing: boolean;
  onSummarize: () => void;
  onBack: () => void;
  onUpdate: (patch: { status?: ReportStatus; priority?: ReportPriority; resolution?: string | null; falseReport?: boolean; assignTo?: string | null }) => void;
  onWarn: (reason: string) => void;
  onSanction: (type: SanctionType) => void;
  onPerma: () => void;
}) {
  const st = STATUS_META[report.status];
  const pr = PRIORITY_META[report.priority];
  const [resolution, setResolution] = useState("");
  const closed = report.status === "resolved" || report.status === "closed";

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a la lista
      </button>

      <div className="glass rounded-2xl p-5 border border-border">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-black">Reporte {reportCode(report.number)}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded border font-mono uppercase" style={{ color: st.color, borderColor: `${st.color}80`, background: `${st.color}18` }}>
            {st.dot} {st.label}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border font-mono uppercase" style={{ color: pr.color, borderColor: `${pr.color}80`, background: `${pr.color}18` }}>
            {pr.dot} {pr.label}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <Info label="Reportante" value={`@${names[report.reporter_id] ?? report.reporter_id.slice(0, 8)}`} />
          <Info label="Reportado" value={report.target_user_id ? `@${names[report.target_user_id] ?? report.target_user_id.slice(0, 8)}` : "—"} />
          <Info label="Tipo" value={`${TARGET_LABEL[report.target_type]} · ${report.reason}`} />
          <Info label="Fecha" value={new Date(report.created_at).toLocaleString()} />
          {report.assigned_to && <Info label="Asignado a" value={`@${names[report.assigned_to] ?? "staff"}`} />}
          {report.target_content_id && <Info label="Contenido" value={report.target_content_id} />}
        </div>

        {report.description && (
          <div className="mt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Descripción</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{report.description}</p>
          </div>
        )}
        {report.evidence && (
          <div className="mt-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Evidencias</p>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words">{report.evidence}</p>
          </div>
        )}
        {report.screenshot_url && (
          <a href={report.screenshot_url} target="_blank" rel="noreferrer" className="mt-3 inline-block">
            <img src={report.screenshot_url} alt="Captura adjunta al reporte" className="max-h-56 rounded-lg border border-border" />
          </a>
        )}
        {report.resolution && (
          <p className="mt-3 text-xs text-emerald-300 border-l-2 border-emerald-500/50 pl-2">Resolución: {report.resolution}</p>
        )}

        <div className="mt-4">
          <button
            onClick={onSummarize}
            disabled={summarizing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-neon-purple/60 text-neon-purple bg-neon-purple/10 disabled:opacity-50"
          >
            {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Resumir con NEXUS
          </button>
          {summary && <p className="mt-2 text-xs whitespace-pre-wrap glass rounded-lg p-3 border border-neon-purple/30">{summary}</p>}
        </div>
      </div>

      {/* Estado y prioridad */}
      <div className="glass rounded-2xl p-5 border border-border">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Estado</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.keys(STATUS_META) as ReportStatus[]).map((s) => {
            const m = STATUS_META[s];
            const disabled = closed && s !== "resolved" && s !== "closed" && !isAdmin;
            return (
              <button
                key={s}
                disabled={disabled}
                title={disabled ? "Solo Admin+ puede reabrir un reporte" : undefined}
                onClick={() => onUpdate({ status: s, resolution: resolution.trim() || null })}
                className="px-3 py-1.5 rounded-md text-xs border transition disabled:opacity-30"
                style={
                  report.status === s
                    ? { color: m.color, borderColor: m.color, background: `${m.color}22` }
                    : { borderColor: "hsl(var(--border))" }
                }
              >
                {m.dot} {m.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Prioridad</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.keys(PRIORITY_META) as ReportPriority[]).map((p) => {
            const m = PRIORITY_META[p];
            return (
              <button
                key={p}
                onClick={() => onUpdate({ priority: p })}
                className="px-3 py-1.5 rounded-md text-xs border transition"
                style={report.priority === p ? { color: m.color, borderColor: m.color, background: `${m.color}22` } : { borderColor: "hsl(var(--border))" }}
              >
                {m.dot} {m.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Nota / resolución (se envía al reportante al resolver)…"
          className="mt-4 w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => onUpdate({ status: "closed", falseReport: true, resolution: resolution.trim() || "Reporte descartado" })}
            className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-red-500/60">
            Descartar como falso
          </button>
          <button onClick={() => onUpdate({ status: "closed", resolution: resolution.trim() || "Reporte duplicado" })}
            className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">
            Marcar duplicado
          </button>
          <button onClick={() => onUpdate({ assignTo: null, status: "reviewing" })}
            className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">
            Tomar caso
          </button>
        </div>
      </div>

      {/* Acciones */}
      <div className="glass rounded-2xl p-5 border border-border">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Acciones sobre el usuario</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <ActionBtn color="#facc15" onClick={() => {
            const reason = prompt("Motivo de la advertencia:");
            if (reason && reason.trim()) onWarn(reason.trim());
          }}>⚠️ Advertir</ActionBtn>
          <ActionBtn color="#facc15" onClick={() => onSanction("muted")}>🔇 Silenciar</ActionBtn>
          <ActionBtn color="#fb923c" onClick={() => onSanction("suspended")} disabled={!isAdmin} title={!isAdmin ? "Solo Admin+ puede suspender" : undefined}>⏸️ Suspender</ActionBtn>
          <ActionBtn color="#ef4444" onClick={() => onSanction("banned")} disabled={!isAdmin} title={!isAdmin ? "Solo Admin+ puede banear" : undefined}>🚫 Ban temporal</ActionBtn>
          <ActionBtn color="#ef4444" onClick={onPerma}>👑 Solicitar ban permanente</ActionBtn>
          <ActionBtn color="#a855f7" onClick={() => onUpdate({ status: "escalated", resolution: resolution.trim() || null })}>
            🔺 Escalar {isAdmin ? "al Founder" : "a Administración"}
          </ActionBtn>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Los permisos se validan en el servidor: el botón puede aparecer, pero la acción se rechaza si tu rango no la permite.
          {isFounder && " Como Founder tienes control total."}
        </p>
      </div>

      {/* Historial */}
      <div className="glass rounded-2xl p-5 border border-border">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Historial del reporte</p>
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="flex flex-wrap gap-2 items-center text-xs border-b border-border/50 pb-2">
              <span className="font-mono text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
              <span className="px-1.5 py-0.5 rounded bg-neon-purple/15 border border-neon-purple/40 text-neon-purple font-mono text-[10px]">{h.action}</span>
              <span className="text-neon-cyan">@{h.staff_id ? names[h.staff_id] ?? h.staff_id.slice(0, 8) : "sistema"}</span>
              {h.result && <span className="text-muted-foreground">{h.result}</span>}
              {h.reason && <span className="italic text-muted-foreground">“{h.reason}”</span>}
            </div>
          ))}
          {history.length === 0 && <p className="text-xs text-muted-foreground">Sin movimientos todavía.</p>}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ color, children, onClick, disabled, title }: { color: string; children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-3 py-2 rounded-md text-xs font-bold border transition disabled:opacity-30"
      style={{ color, borderColor: `${color}90`, background: `${color}18` }}
    >
      {children}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words">{value}</p>
    </div>
  );
}
