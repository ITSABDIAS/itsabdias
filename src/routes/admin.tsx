import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Shield, CheckCircle2, Clock, Loader2, Archive } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel Admin — ItsaBDias" },
      { name: "description", content: "Panel de administración de tickets." },
    ],
  }),
  component: AdminPage,
});

type Ticket = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  username?: string;
};

const STATUSES = [
  { value: "open", label: "Abierto", icon: Clock, color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
  { value: "in_progress", label: "En progreso", icon: Loader2, color: "text-neon-blue border-neon-blue/40 bg-neon-blue/10" },
  { value: "resolved", label: "Resuelto", icon: CheckCircle2, color: "text-green-400 border-green-400/40 bg-green-400/10" },
  { value: "closed", label: "Cerrado", icon: Archive, color: "text-muted-foreground border-border bg-secondary/40" },
];

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "founder"]);
      const admin = (data ?? []).length > 0;
      setIsAdmin(admin);
      setChecking(false);
      if (admin) load();
    })();
  }, [user, authLoading, nav]);

  const load = async () => {
    const { data, error } = await supabase
      .from("help_tickets")
      .select("id, user_id, category, title, body, status, admin_response, created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    const userIds = Array.from(new Set((data ?? []).map((t) => t.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles ?? []).map((p) => [p.id, p.username]));
    setTickets((data ?? []).map((t) => ({ ...t, username: map.get(t.user_id) })));
  };

  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "help_tickets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAdmin]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("help_tickets").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Estado actualizado");
  };

  const sendResponse = async (id: string) => {
    const text = responses[id]?.trim();
    if (!text) return;
    const { error } = await supabase.from("help_tickets").update({ admin_response: text }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Respuesta enviada");
    setResponses((r) => ({ ...r, [id]: "" }));
  };

  if (checking) {
    return (
      <PageShell>
        <section className="py-32 px-6 text-center text-muted-foreground">Verificando acceso...</section>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <section className="py-32 px-6 text-center">
          <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Acceso restringido</h2>
          <p className="text-muted-foreground">Esta página es solo para administradores.</p>
        </section>
      </PageShell>
    );
  }

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s.value]: tickets.filter((t) => t.status === s.value).length }), {} as Record<string, number>);

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// admin.panel" title="Panel de administrador" subtitle="Gestiona los tickets de la comunidad." />

        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link to="/admin/tutoriales" className="px-3 py-1.5 rounded-md text-xs bg-gradient-neon text-primary-foreground font-bold">→ Gestionar tutoriales</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {STATUSES.map((s) => (
              <div key={s.value} className={`glass rounded-xl p-4 border ${s.color}`}>
                <p className="text-xs uppercase font-mono">{s.label}</p>
                <p className="text-3xl font-display font-bold mt-1">{counts[s.value] ?? 0}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs border transition-all ${filter === "all" ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              Todos ({tickets.length})
            </button>
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-all ${filter === s.value ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 && <p className="text-muted-foreground text-sm">No hay tickets en esta categoría.</p>}
            {filtered.map((t) => {
              const status = STATUSES.find((s) => s.value === t.status) ?? STATUSES[0];
              return (
                <div key={t.id} className="glass rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                          {t.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${status.color}`}>
                          <status.icon className="h-3 w-3" /> {status.label}
                        </span>
                      </div>
                      <h4 className="mt-2 font-bold text-lg">{t.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{t.body}</p>
                      {t.username && <p className="mt-2 text-xs text-neon-cyan">por {t.username}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(t.id, s.value)}
                        disabled={t.status === s.value}
                        className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-neon-blue/60 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        → {s.label}
                      </button>
                    ))}
                  </div>

                  {t.admin_response && (
                    <div className="rounded-md border border-neon-cyan/40 bg-neon-cyan/5 p-3 text-sm">
                      <p className="text-xs font-mono text-neon-cyan mb-1">RESPUESTA OFICIAL</p>
                      <p className="whitespace-pre-wrap">{t.admin_response}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      value={responses[t.id] ?? ""}
                      onChange={(e) => setResponses((r) => ({ ...r, [t.id]: e.target.value }))}
                      placeholder={t.admin_response ? "Actualizar respuesta..." : "Escribir respuesta oficial..."}
                      className="flex-1 bg-input/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                    />
                    <button
                      onClick={() => sendResponse(t.id)}
                      className="px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-semibold"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
