import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { Shield, History } from "lucide-react";

export const Route = createFileRoute("/admin/historial")({
  head: () => ({ meta: [{ title: "Admin · Historial — ItsaBDias" }] }),
  component: AdminHistorialPage,
});

function AdminHistorialPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isModerator, loading: rolesLoading } = useMyRoles();
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (isModerator) load();
  }, [user, authLoading, rolesLoading, isModerator]);

  const load = async () => {
    const { data } = await supabase.from("staff_actions").select("*").order("created_at", { ascending: false }).limit(200);
    setRows(data ?? []);
    const ids = new Set<string>();
    (data ?? []).forEach((r: any) => { if (r.actor_id) ids.add(r.actor_id); if (r.target_id) ids.add(r.target_id); });
    if (ids.size > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", Array.from(ids));
      const m: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { m[p.id] = p.username; });
      setNames(m);
    }
  };

  if (authLoading || rolesLoading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!isModerator) return (
    <PageShell>
      <section className="py-32 px-6 text-center">
        <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Solo staff</h2>
      </section>
    </PageShell>
  );

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle eyebrow="// admin.historial" title="Historial del staff" subtitle="Auditoría completa de acciones administrativas." />
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link to="/admin" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/admin/usuarios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Usuarios</Link>
            <Link to="/admin/anuncios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Anuncios</Link>
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase font-mono text-muted-foreground">
              <div>Fecha</div><div>Actor</div><div>Acción</div><div>Afectado</div><div>Motivo</div>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="sm:grid sm:grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr] gap-2 px-4 py-3 border-b border-border/50 text-xs hover:bg-white/2">
                <div className="text-muted-foreground font-mono">{new Date(r.created_at).toLocaleString()}</div>
                <div className="text-neon-cyan">{names[r.actor_id] ?? r.actor_id?.slice(0,8)}</div>
                <div><span className="inline-block px-1.5 py-0.5 rounded bg-neon-purple/15 border border-neon-purple/40 text-neon-purple font-mono text-[10px]">{r.action}</span></div>
                <div>{r.target_id ? (names[r.target_id] ?? r.target_id.slice(0,8)) : "—"}</div>
                <div className="text-muted-foreground italic">{r.reason ?? "—"}</div>
              </div>
            ))}
            {rows.length === 0 && <p className="text-muted-foreground text-sm p-4">Sin acciones registradas.</p>}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            <History className="inline h-3 w-3 mr-1" />
            Se registran automáticamente cambios de rango, estado, premium y anuncios.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
