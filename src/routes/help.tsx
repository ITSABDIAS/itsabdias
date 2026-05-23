import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Send, LifeBuoy, MessageSquare, Code2, BrainCircuit, Cpu, Gamepad2, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Centro de Ayuda Tech — ItsaBDias" },
      { name: "description", content: "Pide ayuda sobre programación, IA, PCs, Roblox, software, ingeniería y tecnología." },
    ],
  }),
  component: Help,
});

const cats = [
  { icon: Code2, label: "Programación" },
  { icon: BrainCircuit, label: "IA" },
  { icon: Cpu, label: "PCs" },
  { icon: Gamepad2, label: "Roblox" },
  { icon: Wrench, label: "Software" },
  { icon: LifeBuoy, label: "Ingeniería" },
  { icon: MessageSquare, label: "Tecnología" },
];

type Ticket = { id: string; user_id: string; category: string; title: string; body: string; status: string; admin_response: string | null; created_at: string; username?: string };

const STATUS_BADGES: Record<string, string> = {
  open: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  in_progress: "text-neon-blue border-neon-blue/40 bg-neon-blue/10",
  resolved: "text-green-400 border-green-400/40 bg-green-400/10",
  closed: "text-muted-foreground border-border bg-secondary/40",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
};

function Help() {
  const { user } = useAuth();
  const [cat, setCat] = useState("Programación");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("help_tickets")
      .select("id, user_id, category, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const userIds = Array.from(new Set((data ?? []).map((t) => t.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles ?? []).map((p) => [p.id, p.username]));
    setTickets((data ?? []).map((t) => ({ ...t, username: map.get(t.user_id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "help_tickets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Inicia sesión para enviar un ticket");
    if (!title.trim() || !body.trim()) return;
    const { error } = await supabase.from("help_tickets").insert({
      user_id: user.id,
      category: cat,
      title: title.trim(),
      body: body.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Ticket enviado");
    setTitle("");
    setBody("");
  };

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle
          eyebrow="// support.center"
          title="Centro de Ayuda Tech"
          subtitle="Describe tu problema. Nuestra comunidad de creadores te responderá."
        />

        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_1.3fr] gap-8">
          {/* Form */}
          <form onSubmit={submit} className="glass rounded-2xl p-6 neon-border space-y-5 h-fit">
            <h3 className="font-display text-xl font-bold">Nuevo ticket</h3>

            {!user && (
              <p className="text-xs text-muted-foreground">
                <Link to="/auth" className="text-neon-cyan hover:underline">Inicia sesión</Link> para enviar un ticket.
              </p>
            )}

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Categoría</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button
                    type="button"
                    key={c.label}
                    onClick={() => setCat(c.label)}
                    className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border transition-all ${
                      cat === c.label
                        ? "bg-gradient-neon text-primary-foreground border-transparent shadow-neon-blue"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-neon-blue/60"
                    }`}
                  >
                    <c.icon className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Mi PC se reinicia al jugar..."
                className="mt-2 w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue focus:shadow-neon-blue transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Detalles</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Describe qué pasa, qué intentaste, mensajes de error..."
                className="mt-2 w-full bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue focus:shadow-neon-blue transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!user}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple hover:shadow-neon-blue transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Enviar Ticket
            </button>
          </form>

          {/* Tickets list */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold">Tickets recientes</h3>
            {loading && <p className="text-muted-foreground text-sm">Cargando...</p>}
            {!loading && tickets.length === 0 && (
              <p className="text-muted-foreground text-sm">Aún no hay tickets. ¡Sé el primero!</p>
            )}
            {tickets.map((t) => (
              <div key={t.id} className="glass rounded-xl p-5 hover:border-neon-purple/60 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                      {t.category}
                    </span>
                    <h4 className="mt-2 font-bold text-lg">{t.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{t.body}</p>
                    {t.username && <p className="mt-2 text-xs text-neon-cyan">por {t.username}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(t.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
