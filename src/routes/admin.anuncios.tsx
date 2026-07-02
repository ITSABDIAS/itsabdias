import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { createAnnouncement, deactivateAnnouncement, broadcastNotification } from "@/lib/staffActions";
import { Shield, Megaphone, Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/anuncios")({
  head: () => ({ meta: [{ title: "Admin · Anuncios — ItsaBDias" }] }),
  component: AdminAnunciosPage,
});

function AdminAnunciosPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isAdmin, isFounder, loading: rolesLoading } = useMyRoles();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "", level: "info" as "info" | "warn" | "critical", audience: "all" as "all" | "premium" | "staff", expires: "" });
  const [notif, setNotif] = useState({ title: "", body: "", link: "/", audience: "all" as "all" | "premium" | "staff" });

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (isAdmin) load();
  }, [user, authLoading, rolesLoading, isAdmin]);

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50);
    setItems(data ?? []);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    const id = await createAnnouncement(form.title.trim(), form.body.trim(), form.level, form.audience, form.expires || null);
    if (id) { setForm({ title: "", body: "", level: "info", audience: "all", expires: "" }); load(); }
  };

  const send = async () => {
    if (!notif.title.trim() || !notif.body.trim()) return;
    if (!confirm(`¿Enviar notificación a: ${notif.audience.toUpperCase()}?`)) return;
    await broadcastNotification(notif.title.trim(), notif.body.trim(), notif.link || "/", notif.audience);
    setNotif({ title: "", body: "", link: "/", audience: "all" });
  };

  if (authLoading || rolesLoading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!isAdmin) return (
    <PageShell>
      <section className="py-32 px-6 text-center">
        <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Solo administradores</h2>
      </section>
    </PageShell>
  );

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle eyebrow="// admin.anuncios" title="Anuncios y notificaciones" subtitle="Comunícate con la comunidad." />

        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link to="/admin" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Tickets</Link>
            <Link to="/admin/usuarios" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Usuarios</Link>
            <Link to="/admin/historial" className="px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">Historial</Link>
          </div>

          {/* Announcement form */}
          <div className="glass rounded-xl p-5 mb-8">
            <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Megaphone className="h-4 w-4 text-neon-cyan" /> Nuevo anuncio (banner)</h3>
            <div className="grid gap-2">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Contenido" rows={3} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as any })} className="bg-input/40 border border-border rounded-md px-2 py-2 text-sm">
                  <option value="info">Info</option>
                  <option value="warn">Advertencia</option>
                  <option value="critical">Crítico</option>
                </select>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as any })} className="bg-input/40 border border-border rounded-md px-2 py-2 text-sm">
                  <option value="all">Todos</option>
                  <option value="premium">Premium</option>
                  <option value="staff">Staff</option>
                </select>
                <input type="datetime-local" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className="bg-input/40 border border-border rounded-md px-2 py-2 text-sm" />
              </div>
              <button onClick={submit} className="mt-1 py-2 rounded-md bg-gradient-neon text-primary-foreground font-bold text-sm">Publicar anuncio</button>
            </div>
          </div>

          {/* Broadcast notification (founder-only) */}
          {isFounder && (
            <div className="glass rounded-xl p-5 mb-8 border border-yellow-400/30">
              <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Send className="h-4 w-4 text-yellow-300" /> Notificación masiva (Founder)</h3>
              <div className="grid gap-2">
                <input value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })} placeholder="Título" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
                <textarea value={notif.body} onChange={(e) => setNotif({ ...notif, body: e.target.value })} placeholder="Mensaje" rows={2} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={notif.link} onChange={(e) => setNotif({ ...notif, link: e.target.value })} placeholder="Enlace (/ruta)" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
                  <select value={notif.audience} onChange={(e) => setNotif({ ...notif, audience: e.target.value as any })} className="bg-input/40 border border-border rounded-md px-2 py-2 text-sm">
                    <option value="all">Todos</option>
                    <option value="premium">Premium</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <button onClick={send} className="mt-1 py-2 rounded-md bg-yellow-500/90 hover:bg-yellow-400 text-black font-bold text-sm">Enviar notificaciones</button>
              </div>
            </div>
          )}

          {/* Active list */}
          <h3 className="font-display text-lg font-bold mb-3">Anuncios activos</h3>
          <div className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className={`glass rounded-xl p-4 flex items-start gap-3 ${a.active ? "" : "opacity-50"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-border">{a.level}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-border">{a.audience}</span>
                    {!a.active && <span className="text-[10px] font-mono uppercase text-red-400">Inactivo</span>}
                  </div>
                  <p className="font-bold mt-1">{a.title}</p>
                  {a.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>}
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                {a.active && (
                  <button onClick={async () => { if (await deactivateAnnouncement(a.id)) load(); }} className="p-1.5 rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {items.length === 0 && <p className="text-muted-foreground text-sm">Sin anuncios aún.</p>}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
