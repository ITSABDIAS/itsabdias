import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { Shield, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SANCTION_META } from "@/lib/sanctions";


export const Route = createFileRoute("/admin/historial")({
  head: () => ({ meta: [{ title: "Admin · Historial — ItsaBDias" }] }),
  component: AdminHistorialPage,
});

type SanctionRow = {
  id: string;
  user_id: string;
  staff_id: string | null;
  type: "muted" | "suspended" | "banned";
  reason: string | null;
  is_permanent: boolean;
  starts_at: string;
  ends_at: string | null;
  state: string;
  created_at: string;
};

const STATE_STYLE: Record<string, string> = {
  active: "border-yellow-400/60 text-yellow-300 bg-yellow-400/10",
  expired: "border-border text-muted-foreground bg-secondary/40",
  revoked: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
};

function durationLabel(s: SanctionRow) {
  if (s.is_permanent || !s.ends_at) return "Permanente";
  const mins = Math.round((new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60000);
  if (mins % 1440 === 0) return `${mins / 1440} día(s)`;
  if (mins % 60 === 0) return `${mins / 60} hora(s)`;
  return `${mins} min`;
}

function AdminHistorialPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isModerator, isFounder, loading: rolesLoading } = useMyRoles();
  const [tab, setTab] = useState<"sanciones" | "acciones">("sanciones");
  const [rows, setRows] = useState<any[]>([]);
  const [sanctions, setSanctions] = useState<SanctionRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (isModerator) load();
  }, [user, authLoading, rolesLoading, isModerator]);

  const load = async () => {
    const [{ data }, { data: sancs }] = await Promise.all([
      supabase.from("staff_actions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("sanctions" as any).select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setRows(data ?? []);
    const list = (sancs ?? []) as unknown as SanctionRow[];
    setSanctions(list);
    const ids = new Set<string>();
    (data ?? []).forEach((r: any) => { if (r.actor_id) ids.add(r.actor_id); if (r.target_user_id) ids.add(r.target_user_id); });
    list.forEach((s) => { ids.add(s.user_id); if (s.staff_id) ids.add(s.staff_id); });
    if (ids.size > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", Array.from(ids));
      const m: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { m[p.id] = p.username; });
      setNames(m);
    }
  };

  const removeSanction = async (id: string) => {
    if (!confirm("¿Eliminar este registro del historial? Solo el Founder puede hacerlo.")) return;
    const { error } = await supabase.from("sanctions" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Registro eliminado");
    load();
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
        <SectionTitle as="h1" eyebrow="// admin.historial" title="Historial del staff" subtitle="Auditoría completa de sanciones y acciones administrativas." />
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link to="/admin" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/admin/usuarios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Usuarios</Link>
            <Link to="/admin/bans" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Bans permanentes</Link>
            <Link to="/admin/anuncios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Anuncios</Link>
          </div>

          <div className="mb-4 flex gap-1.5">
            {(["sanciones", "acciones"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs border capitalize ${tab === t ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground"}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "sanciones" && (
            <div className="glass rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_.8fr_.8fr_1.4fr_.6fr] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase font-mono text-muted-foreground">
                <div>Fecha y hora</div><div>Usuario</div><div>Staff</div><div>Tipo</div><div>Duración</div><div>Motivo</div><div>Estado</div>
              </div>
              {sanctions.map((s) => (
                <div key={s.id} className="md:grid md:grid-cols-[1.2fr_1fr_1fr_.8fr_.8fr_1.4fr_.6fr] gap-2 px-4 py-3 border-b border-border/50 text-xs">
                  <div className="text-muted-foreground font-mono">{new Date(s.created_at).toLocaleString()}</div>
                  <div className="font-bold">{names[s.user_id] ?? s.user_id.slice(0, 8)}</div>
                  <div className="text-neon-cyan">{s.staff_id ? (names[s.staff_id] ?? s.staff_id.slice(0, 8)) : "—"}</div>
                  <div style={{ color: SANCTION_META[s.type].color }} className="font-mono">{SANCTION_META[s.type].label}</div>
                  <div className="font-mono text-muted-foreground">{durationLabel(s)}</div>
                  <div className="text-muted-foreground italic break-words">{s.reason ?? "—"}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded border uppercase font-mono text-[10px] ${STATE_STYLE[s.state] ?? ""}`}>{s.state}</span>
                    {isFounder && (
                      <button onClick={() => removeSanction(s.id)} title="Eliminar (solo Founder)" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sanctions.length === 0 && <p className="text-muted-foreground text-sm p-4">Sin sanciones registradas.</p>}
            </div>
          )}

          {tab === "acciones" && (
            <div className="glass rounded-xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase font-mono text-muted-foreground">
                <div>Fecha</div><div>Actor</div><div>Acción</div><div>Afectado</div><div>Motivo</div>
              </div>
              {rows.map((r) => (
                <div key={r.id} className="sm:grid sm:grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr] gap-2 px-4 py-3 border-b border-border/50 text-xs hover:bg-white/2">
                  <div className="text-muted-foreground font-mono">{new Date(r.created_at).toLocaleString()}</div>
                  <div className="text-neon-cyan">{names[r.actor_id] ?? r.actor_id?.slice(0,8)}</div>
                  <div><span className="inline-block px-1.5 py-0.5 rounded bg-neon-purple/15 border border-neon-purple/40 text-neon-purple font-mono text-[10px]">{r.action}</span></div>
                  <div>{r.target_user_id ? (names[r.target_user_id] ?? r.target_user_id.slice(0,8)) : "—"}</div>
                  <div className="text-muted-foreground italic">{r.reason ?? "—"}</div>
                </div>
              ))}
              {rows.length === 0 && <p className="text-muted-foreground text-sm p-4">Sin acciones registradas.</p>}
            </div>
          )}

          <p className="mt-3 text-[11px] text-muted-foreground">
            <History className="inline h-3 w-3 mr-1" />
            Se registran automáticamente sanciones, cambios de rango, premium y anuncios. Solo el Founder puede eliminar registros.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

