import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { reviewBanRequest } from "@/lib/staffActions";
import { Shield, Gavel, Check, X, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/bans")({
  head: () => ({ meta: [{ title: "Admin · Bans permanentes — ItsaBDias" }] }),
  component: AdminBansPage,
});

type Req = {
  id: string;
  target_user_id: string;
  requester_id: string;
  reason: string;
  evidence: string | null;
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "border-yellow-400/60 text-yellow-300 bg-yellow-400/10",
  approved: "border-red-500/60 text-red-300 bg-red-500/10",
  rejected: "border-emerald-500/60 text-emerald-300 bg-emerald-500/10",
};

function AdminBansPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isModerator, isFounder, loading: rolesLoading } = useMyRoles();
  const [rows, setRows] = useState<Req[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (isModerator) load();
  }, [user, authLoading, rolesLoading, isModerator]);

  const load = async () => {
    const { data } = await supabase.from("ban_requests" as any).select("*").order("created_at", { ascending: false }).limit(200);
    const list = (data ?? []) as unknown as Req[];
    setRows(list);
    const ids = new Set<string>();
    list.forEach((r) => { ids.add(r.target_user_id); ids.add(r.requester_id); });
    if (ids.size) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", Array.from(ids));
      const m: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { m[p.id] = p.username; });
      setNames(m);
    }
  };

  const review = async (id: string, approve: boolean) => {
    if (await reviewBanRequest(id, approve, note[id])) load();
  };

  if (authLoading || rolesLoading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!isModerator) return (
    <PageShell>
      <section className="py-32 px-6 text-center">
        <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Solo staff</h1>
      </section>
    </PageShell>
  );

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle as="h1" eyebrow="// admin.bans" title="Solicitudes de ban permanente" subtitle="Solo el Founder puede aprobar o rechazar estas solicitudes." />
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link to="/admin" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/admin/usuarios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Usuarios</Link>
            <Link to="/admin/historial" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Historial</Link>
          </div>

          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="glass rounded-xl p-4 border border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <Gavel className="h-4 w-4 text-red-400" />
                  <span className="font-bold">{names[r.target_user_id] ?? r.target_user_id.slice(0, 8)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${STATUS_STYLE[r.status] ?? ""}`}>{r.status}</span>
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{r.reason}</p>
                {r.evidence && (
                  <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap border-l-2 border-border pl-2">{r.evidence}</p>
                )}
                <p className="mt-2 text-[11px] font-mono text-muted-foreground">
                  Solicitado por {names[r.requester_id] ?? r.requester_id.slice(0, 8)}
                  {r.reviewed_at ? ` · revisado ${new Date(r.reviewed_at).toLocaleString()}` : ""}
                </p>
                {r.review_note && <p className="mt-1 text-xs italic text-muted-foreground">Nota: {r.review_note}</p>}

                {isFounder && r.status === "pending" && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      value={note[r.id] ?? ""}
                      onChange={(e) => setNote({ ...note, [r.id]: e.target.value })}
                      placeholder="Nota de revisión (opcional)"
                      className="flex-1 px-3 py-2 rounded-md bg-input/40 border border-border text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => review(r.id, true)} className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold border border-red-500 text-red-300 bg-red-500/15">
                        <Check className="h-3.5 w-3.5" /> Aprobar ban
                      </button>
                      <button onClick={() => review(r.id, false)} className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold border border-emerald-500 text-emerald-300 bg-emerald-500/15">
                        <X className="h-3.5 w-3.5" /> Rechazar
                      </button>
                    </div>
                  </div>
                )}
                {!isFounder && r.status === "pending" && (
                  <p className="mt-2 text-[11px] text-yellow-300 font-mono">Pendiente de aprobación del Founder.</p>
                )}
              </div>
            ))}
            {rows.length === 0 && <p className="text-muted-foreground text-sm">Sin solicitudes.</p>}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
