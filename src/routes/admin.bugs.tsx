import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles } from "@/hooks/useMyRoles";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bugs")({
  head: () => ({ meta: [{ title: "Admin · Reportes de errores — ItsaBDias" }, { name: "robots", content: "noindex" }] }),
  component: AdminBugs,
});

type Bug = { id: string; user_id: string; title: string; description: string; page: string | null; severity: string; status: string; created_at: string; username?: string };
const DEFAULT_PTS: Record<string, number> = { low: 25, normal: 60, high: 150, critical: 300 };

function AdminBugs() {
  const { isModerator, loading } = useMyRoles();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [filter, setFilter] = useState("pending");
  const [pts, setPts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase.from("bug_reports").select("*").eq("status", filter).order("created_at", { ascending: false }).limit(100);
    const ids = [...new Set((data ?? []).map((b) => b.user_id))];
    const { data: profs } = ids.length ? await supabase.from("profiles").select("id,username").in("id", ids) : { data: [] };
    setBugs((data ?? []).map((b) => ({ ...b, username: profs?.find((p) => p.id === b.user_id)?.username })));
  }
  useEffect(() => { if (isModerator) load(); }, [isModerator, filter]);

  async function review(b: Bug, status: string) {
    const { error } = await supabase.rpc("staff_review_bug", { _id: b.id, _status: status, _points: pts[b.id] ?? DEFAULT_PTS[b.severity] ?? 60, _note: notes[b.id] || null });
    if (error) return toast.error(error.message);
    toast.success("Reporte revisado");
    load();
  }

  if (loading) return <PageShell><p className="p-12 text-center">Cargando…</p></PageShell>;
  if (!isModerator) return <PageShell><p className="p-12 text-center">Solo staff.</p></PageShell>;

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <SectionTitle as="h1" eyebrow="Staff" title="Reportes de errores" subtitle="Confirma los bugs reales para darle XP al cazador." />
        <div className="flex flex-wrap gap-2 mb-4">
          {["pending", "confirmed", "fixed", "rejected", "duplicate"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg border text-sm ${filter === s ? "bg-primary text-primary-foreground" : "border-border"}`}>{s}</button>
          ))}
        </div>
        {bugs.length === 0 && <p className="text-muted-foreground">No hay reportes aquí.</p>}
        <div className="space-y-3">
          {bugs.map((b) => (
            <div key={b.id} className="glass rounded-xl p-4">
              <div className="flex justify-between gap-2 flex-wrap"><b>{b.title}</b><span className="text-xs font-mono">{b.severity} · {b.username ?? "?"} · {new Date(b.created_at).toLocaleString()}</span></div>
              {b.page && <p className="text-xs text-primary">Página: {b.page}</p>}
              <p className="text-sm mt-2 whitespace-pre-wrap">{b.description}</p>
              {b.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <input type="number" min={10} max={500} className="w-24 rounded-md bg-background/60 border border-border px-2 py-1" value={pts[b.id] ?? DEFAULT_PTS[b.severity] ?? 60} onChange={(e) => setPts({ ...pts, [b.id]: Number(e.target.value) })} />
                  <input className="flex-1 min-w-40 rounded-md bg-background/60 border border-border px-2 py-1" placeholder="Nota para el usuario" value={notes[b.id] ?? ""} onChange={(e) => setNotes({ ...notes, [b.id]: e.target.value })} />
                  <button onClick={() => review(b, "confirmed")} className="px-3 py-1 rounded-md bg-primary text-primary-foreground">Confirmar</button>
                  <button onClick={() => review(b, "duplicate")} className="px-3 py-1 rounded-md border border-border">Duplicado</button>
                  <button onClick={() => review(b, "rejected")} className="px-3 py-1 rounded-md border border-destructive text-destructive">Rechazar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
