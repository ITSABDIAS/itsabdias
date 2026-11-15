import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Loader2, Sparkles } from "lucide-react";
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
    setItems((p) => p.map((i) => (i.id === id ? { ...i, read: true } : i)));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) toast.error("No se pudo marcar");
  };
  const markAllRead = async () => {
    if (!user) return;
    setItems((p) => p.map((i) => ({ ...i, read: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) toast.error("No se pudo marcar");
    else toast.success("Marcadas como leídas");
  };
  const remove = async (id: string) => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) { setItems(prev); toast.error("No se pudo borrar"); }
    else toast.success("Notificación borrada");
  };
  const removeAll = async () => {
    if (!user || !confirm("¿Borrar todas las notificaciones?")) return;
    const prev = items;
    setItems([]);
    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
    if (error) { setItems(prev); toast.error("No se pudo borrar"); }
    else toast.success("Notificaciones borradas");
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
            <div className="flex gap-2">
            {items.length > 0 && (
              <button onClick={removeAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-destructive/40 hover:border-destructive text-destructive transition-all">
                <Trash2 className="h-3.5 w-3.5" /> Borrar todas
              </button>
            )}
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-neon-cyan/30 hover:border-neon-cyan hover:shadow-neon-blue transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </button>
            )}
            </div>
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
                const isUpdate = n.type === "update";
                const inner = isUpdate ? (
                  <div className="notif-update relative overflow-hidden rounded-xl p-6 sm:p-7">
                    <div aria-hidden className="banner-sweep absolute inset-0 opacity-40" />
                    <div className="relative flex items-start gap-4">
                      <Sparkles className="h-10 w-10 shrink-0 text-premium" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xs font-bold tracking-[0.3em] text-premium">NUEVA ACTUALIZACIÓN</span>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-premium animate-glow-pulse" />}
                          <span className="ml-auto text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                        </div>
                        <h4 className="mt-2 font-display text-xl font-bold text-premium sm:text-2xl">{n.title}</h4>
                        {n.body && <p className="mt-2 text-foreground/85">{n.body}</p>}
                        <div className="mt-4 flex gap-2">
                          {!n.read && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }} className="rounded-md border border-premium/50 px-3 py-1 text-xs text-premium">Marcar leída</button>}
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(n.id); }} className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-destructive">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
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
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                          className="p-1.5 rounded-md hover:bg-secondary/60 text-neon-cyan"
                          aria-label="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(n.id); }}
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
                      <a href={n.link} onClick={(e) => { e.preventDefault(); if (!n.read) markRead(n.id); router.history.push(n.link!); }} className="block">
                        {inner}
                      </a>
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
