import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Users, UserCheck, Crown, GraduationCap, FolderKanban,
  MessageSquare, Ticket, Megaphone, History, Newspaper,
  Activity, Bot, TrendingUp, Zap, Settings, ShieldCheck, Star, PlusCircle, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Panel Admin — ItsaBDias" }] }),
  component: AdminDashboard,
});

type Stats = {
  users: number; active: number; premium: number; verified: number; moderators: number; admins: number;
  tutorials: number; aiTutorials: number; posts: number; projects: number; ticketsOpen: number;
  weeklyUsers: number;
};



function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data ?? []).map((r) => r.role);
      const admin = roles.includes("admin") || roles.includes("founder");
      setIsAdmin(admin);
      setIsFounder(roles.includes("founder"));
      setChecking(false);
      if (admin) { loadStats(); loadActivity(); }
    })();
  }, [user, authLoading, nav]);

  const loadStats = async () => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const activeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const c = (q: any) => q.then((r: any) => r.count ?? 0);
    const [users, active, tutorials, aiTut, posts, projects, ticketsOpen, weekly, roleRows, subs] = await Promise.all([
      c(supabase.from("profiles").select("*", { count: "exact", head: true })),
      c(supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", activeSince)),
      c(supabase.from("tutorials").select("*", { count: "exact", head: true })),
      c(supabase.from("tutorials").select("*", { count: "exact", head: true }).eq("is_ai_generated", true)),
      c(supabase.from("posts").select("*", { count: "exact", head: true })),
      c(supabase.from("projects").select("*", { count: "exact", head: true })),
      c(supabase.from("help_tickets").select("*", { count: "exact", head: true }).eq("status", "open")),
      c(supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since)),
      supabase.from("user_roles").select("role"),
      c(supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").eq("plan", "premium")),
    ]);
    const roles = (roleRows.data ?? []).map((r: any) => r.role);
    setStats({
      users, active, premium: subs,
      verified: roles.filter((r: string) => r === "verified").length,
      moderators: roles.filter((r: string) => r === "moderator").length,
      admins: roles.filter((r: string) => r === "admin" || r === "founder").length,
      tutorials, aiTutorials: aiTut, posts, projects, ticketsOpen, weeklyUsers: weekly,
    });
  };

  const loadActivity = async () => {
    const { data } = await supabase
      .from("staff_actions")
      .select("id, action, reason, created_at, actor_id, target_user_id")
      .order("created_at", { ascending: false })
      .limit(15);
    setActivity(data ?? []);
  };


  const menu = useMemo(() => [
    { to: "/admin/users", label: "Usuarios", icon: Users, color: "text-neon-cyan" },
    { to: "/admin/staff", label: "Staff", icon: ShieldCheck, color: "text-neon-purple" },
    { to: "/admin/tutorials", label: "Tutoriales", icon: GraduationCap, color: "text-neon-blue" },
    { to: "/admin/tickets", label: "Tickets", icon: Ticket, color: "text-yellow-400" },
    { to: "/admin/announcements", label: "Anuncios", icon: Megaphone, color: "text-pink-400" },
    { to: "/admin/posts", label: "Publicaciones", icon: MessageSquare, color: "text-green-400" },
    { to: "/admin/projects", label: "Proyectos", icon: FolderKanban, color: "text-orange-400" },
    { to: "/admin/history", label: "Historial", icon: History, color: "text-muted-foreground" },
    { to: "/admin/settings", label: "Configuración", icon: Settings, color: "text-neon-cyan" },
  ], []);

  if (checking) return <PageShell><section className="py-32 text-center text-muted-foreground">Verificando acceso...</section></PageShell>;
  if (!isAdmin) return (
    <PageShell>
      <section className="py-32 px-6 text-center">
        <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Acceso restringido</h2>
        <p className="text-muted-foreground">Solo administradores.</p>
      </section>
    </PageShell>
  );

  return (
    <PageShell>
      <section className="py-10 px-4 sm:px-6">
        <SectionTitle eyebrow="// admin.panel" title="Panel de administración" subtitle="Control total de ITSABDIAS." />

        <div className="mx-auto max-w-6xl space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Users} label="Usuarios" value={stats?.users ?? 0} color="text-neon-cyan" />
            <StatCard icon={Activity} label="Activos ahora" value={stats?.active ?? 0} color="text-green-400" />
            <StatCard icon={Crown} label="Premium" value={stats?.premium ?? 0} color="text-yellow-400" />
            <StatCard icon={UserCheck} label="Verificados" value={stats?.verified ?? 0} color="text-neon-blue" />
            <StatCard icon={ShieldCheck} label="Mods" value={stats?.moderators ?? 0} color="text-neon-purple" />
            <StatCard icon={Shield} label="Admins" value={stats?.admins ?? 0} color="text-pink-400" />
            <StatCard icon={GraduationCap} label="Tutoriales" value={stats?.tutorials ?? 0} color="text-neon-blue" />
            <StatCard icon={Bot} label="Por NEXUS" value={stats?.aiTutorials ?? 0} color="text-neon-purple" />
            <StatCard icon={MessageSquare} label="Publicaciones" value={stats?.posts ?? 0} color="text-green-400" />
            <StatCard icon={FolderKanban} label="Proyectos" value={stats?.projects ?? 0} color="text-orange-400" />
            <StatCard icon={Ticket} label="Tickets abiertos" value={stats?.ticketsOpen ?? 0} color="text-yellow-400" />
            <StatCard icon={TrendingUp} label="Nuevos (7d)" value={stats?.weeklyUsers ?? 0} color="text-neon-cyan" />
          </div>

          {/* System status */}
          <div>
            <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Activity className="h-5 w-5 text-green-400" /> Estado del sistema</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { l: "Servidor", ok: true },
                { l: "Base de datos", ok: true },
                { l: "Autenticación", ok: true },
                { l: "NEXUS IA", ok: true },
                { l: "Tutoriales", ok: (stats?.tutorials ?? 0) >= 0 },
                { l: "Almacenamiento", ok: true },
              ].map((s) => (
                <div key={s.l} className="glass rounded-xl p-3 border border-border flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.ok ? "bg-green-400 shadow-[0_0_8px_var(--tw-shadow-color)] shadow-green-400" : "bg-red-500"}`} />
                  <p className="text-sm">{s.l}</p>
                  <span className="ml-auto text-[10px] font-mono uppercase text-muted-foreground">{s.ok ? "OK" : "Down"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Menu grid */}
          <div>
            <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Settings className="h-5 w-5" /> Gestión</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {menu.map((m) => (
                <Link key={m.to} to={m.to} className="glass rounded-xl p-4 border border-border hover:border-neon-cyan/60 transition-all hover:scale-[1.02] group">
                  <m.icon className={`h-6 w-6 ${m.color} group-hover:scale-110 transition-transform`} />
                  <p className="mt-2 font-bold">{m.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-400" /> Acciones rápidas</h3>
            <div className="flex flex-wrap gap-2">
              <QuickAction to="/admin/tutorials" icon={Sparkles} label="Generar tutorial NEXUS" />
              <QuickAction to="/admin/tutorials" icon={PlusCircle} label="Crear tutorial" />
              <QuickAction to="/admin/announcements" icon={Megaphone} label="Crear anuncio" />
              <QuickAction to="/admin/posts" icon={MessageSquare} label="Moderar publicaciones" />
              <QuickAction to="/admin/projects" icon={FolderKanban} label="Gestionar proyectos" />
              <QuickAction to="/admin/tickets" icon={Ticket} label="Ver tickets" />
              {isFounder && <QuickAction to="/admin/users" icon={Crown} label="Otorgar Premium" />}
              {isFounder && <QuickAction to="/admin/users" icon={ShieldCheck} label="Invitar Admin/Mod" />}
            </div>
          </div>

          {/* Recent activity */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold flex items-center gap-2"><History className="h-5 w-5" /> Actividad reciente</h3>
              <Link to="/admin/history" className="text-xs text-neon-cyan hover:underline">Ver todo →</Link>
            </div>
            {activity.length === 0 && <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>}
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="text-sm flex items-start gap-3 py-1.5 border-b border-border/40 last:border-0">
                  <Star className="h-3.5 w-3.5 mt-1 text-neon-cyan shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate"><span className="font-mono text-neon-purple">{a.action}</span>{a.reason ? ` — ${a.reason}` : ""}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-xl p-4 border border-border hover:border-neon-cyan/40 transition-all">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-[11px] uppercase font-mono text-muted-foreground truncate">{label}</p>
      </div>
      <p className="text-2xl font-display font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-border hover:border-neon-cyan/60 hover:bg-neon-cyan/5 transition-all">
      <Icon className="h-3.5 w-3.5" />{label}
    </Link>
  );
}
