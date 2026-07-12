import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { deleteContent } from "@/lib/staffActions";
import { toast } from "sonner";
import { Search, Shield, Trash2, Star, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/admin/proyectos")({
  head: () => ({ meta: [{ title: "Admin · Proyectos — ItsaBDias" }] }),
  component: AdminProjectsPage,
});

type Row = {
  id: string; title: string; description: string | null; category: string | null;
  is_featured?: boolean | null; created_at: string; user_id: string; username?: string;
};

function AdminProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isModerator, isAdmin, loading: rolesLoading } = useMyRoles();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (isModerator) load();
  }, [user, authLoading, rolesLoading, isModerator]);

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(300);
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p: any) => [p.id, p.username]));
    setRows((data ?? []).map((r: any) => ({ ...r, username: m.get(r.user_id) })));
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) =>
      r.title?.toLowerCase().includes(s) ||
      (r.description ?? "").toLowerCase().includes(s) ||
      (r.username ?? "").toLowerCase().includes(s)
    ) : rows;
  }, [rows, q]);

  const toggleFeatured = async (r: Row) => {
    if (!isAdmin) return toast.error("Solo Admin+");
    const { error } = await supabase.from("projects").update({ is_featured: !r.is_featured }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(r.is_featured ? "Ya no destacado" : "Destacado"); load();
  };

  const remove = async (id: string) => {
    const r = prompt("Motivo (opcional):");
    if (r === null) return;
    if (await deleteContent("project", id, r || undefined)) load();
  };

  if (authLoading || rolesLoading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!isModerator) return (
    <PageShell><section className="py-32 px-6 text-center">
      <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
      <h2 className="font-display text-2xl font-bold">Solo staff</h2>
    </section></PageShell>
  );

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle eyebrow="// admin.proyectos" title="Proyectos" subtitle="Gestiona los proyectos de la comunidad." />
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link to="/admin" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/projects" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Ver galería</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="glass rounded-xl p-4"><p className="text-xs text-muted-foreground uppercase font-mono inline-flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> Total</p><p className="text-2xl font-bold mt-1">{rows.length}</p></div>
            <div className="glass rounded-xl p-4"><p className="text-xs text-muted-foreground uppercase font-mono inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Destacados</p><p className="text-2xl font-bold mt-1">{rows.filter((r) => r.is_featured).length}</p></div>
            <div className="glass rounded-xl p-4 sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proyecto o autor..." className="w-full pl-9 pr-3 py-2 bg-input/40 border border-border rounded-md text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className="glass rounded-xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold truncate">{r.title}</span>
                    {r.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border font-mono uppercase text-muted-foreground">{r.category}</span>}
                    {r.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-yellow-400/50 bg-yellow-400/10 text-yellow-300 inline-flex items-center gap-1"><Star className="h-3 w-3" /> Destacado</span>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    <span className="text-neon-cyan">@{r.username ?? "?"}</span> · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                  {isAdmin && (
                    <button onClick={() => toggleFeatured(r)} className="px-2 py-1 rounded-md text-[11px] border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/10 inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> {r.is_featured ? "Quitar" : "Destacar"}
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} className="px-2 py-1 rounded-md text-[11px] border border-red-500/40 text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground text-sm">Sin proyectos.</p>}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
