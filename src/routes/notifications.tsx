import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notificaciones — ItsaBDias" },
      { name: "description", content: "Centro de notificaciones de tu cuenta ItsaBDias." },
    ],
  }),
  component: NotificationsPage,
});

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "hace segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) {
        toast.error("Error al cargar notificaciones");
      } else {
        setItems(data as Notification[]);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`notif-page:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    toast.success("Marcadas como leídas");
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
  };

  if (authLoading) {
    return (
      <PageShell>
        <div className="py-32 text-center text-muted-foreground"><Loader2 className="inline animate-spin" /></div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <section className="py-32 text-center">
          <SectionTitle eyebrow="// notifications" title="Inicia sesión" subtitle="Necesitas una cuenta para ver tus notificaciones." />
          <Link to="/auth" className="inline-flex mt-6 px-6 py-3 rounded-md bg-gradient-neon text-primary-foreground font-semibold shadow-neon-purple">
            Entrar
          </Link>
        </section>
      </PageShell>
    );
  }

  const unread = items.filter((i) => !i.read).length;

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// notifications" title="Centro de notificaciones" subtitle="Tu actividad, en tiempo real." />

        <div className="mx-auto max-w-3xl mt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-neon-cyan" />
              <span className="font-mono text-sm text-muted-foreground">
                {unread} sin leer · {items.length} total
              </span>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-neon-cyan/30 hover:border-neon-cyan hover:shadow-neon-blue transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground"><Loader2 className="inline animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center glass rounded-2xl neon-border">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">No tienes notificaciones todavía.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((n) => {
                const inner = (
                  <div className={`flex gap-4 p-4 rounded-xl border transition-all ${
                    n.read
                      ? "bg-card/40 border-border"
                      : "glass border-neon-cyan/40 shadow-neon-blue"
                  }`}>
                    <div className={`w-1 rounded-full ${n.read ? "bg-muted" : "bg-gradient-neon"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neon-purple">{n.type}</span>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-glow-pulse" />}
                        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                      </div>
                      <h4 className="mt-1 font-bold text-foreground">{n.title}</h4>
                      {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      {!n.read && (
                        <button
                          onClick={(e) => { e.preventDefault(); markRead(n.id); }}
                          className="p-1.5 rounded-md hover:bg-secondary/60 text-neon-cyan"
                          aria-label="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); remove(n.id); }}
                        className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => !n.read && markRead(n.id)} className="block">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </PageShell>
  );
}
