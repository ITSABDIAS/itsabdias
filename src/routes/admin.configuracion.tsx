import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import {
  Shield, Crown, Sparkles, Bot, Newspaper, GraduationCap, Lock, Users,
  Home, User, Bell, Megaphone, Ticket, MessageSquare, FolderKanban,
} from "lucide-react";

export const Route = createFileRoute("/admin/configuracion")({
  head: () => ({ meta: [{ title: "Admin · Configuración — ItsaBDias" }] }),
  component: AdminConfigPage,
});

const SECTIONS: { icon: any; title: string; body: string; to?: string; color: string }[] = [
  { icon: Crown, title: "Premium", body: "Otorga o retira Premium desde el módulo de usuarios.", to: "/admin/usuarios", color: "text-yellow-300" },
  { icon: Sparkles, title: "IA / NEXUS", body: "Generación automática de tutoriales por lote (1, 5, 10).", to: "/admin/tutoriales", color: "text-neon-purple" },
  { icon: GraduationCap, title: "Tutoriales", body: "Crea, destaca, oculta y elimina contenido educativo.", to: "/admin/tutoriales", color: "text-neon-blue" },
  { icon: Newspaper, title: "Noticias", body: "Publica anuncios y banners visibles en toda la plataforma.", to: "/admin/anuncios", color: "text-pink-400" },
  { icon: MessageSquare, title: "Publicaciones", body: "Modera publicaciones de la comunidad.", to: "/admin/publicaciones", color: "text-green-400" },
  { icon: FolderKanban, title: "Proyectos", body: "Revisa, destaca y elimina proyectos.", to: "/admin/proyectos", color: "text-orange-400" },
  { icon: Ticket, title: "Tickets", body: "Responde y cambia el estado de los tickets de soporte.", to: "/admin/tickets", color: "text-yellow-400" },
  { icon: Users, title: "Comunidad", body: "Silencia, suspende o banea usuarios desde el módulo de usuarios.", to: "/admin/usuarios", color: "text-neon-cyan" },
  { icon: Shield, title: "Staff", body: "Asigna Moderadores, Verificados y ve la actividad.", to: "/staff", color: "text-neon-purple" },
  { icon: Lock, title: "Seguridad", body: "RLS activo en todas las tablas · Funciones SECURITY DEFINER · Auditoría completa.", color: "text-red-400" },
  { icon: Home, title: "Página principal", body: "Los contenidos destacados aparecen automáticamente en la home.", to: "/", color: "text-neon-cyan" },
  { icon: User, title: "Perfil", body: "Cada usuario controla su perfil, avatar y estado.", to: "/profile", color: "text-neon-blue" },
  { icon: Bell, title: "Notificaciones", body: "Envío masivo desde el módulo de anuncios (Founder).", to: "/admin/anuncios", color: "text-pink-400" },
  { icon: Bot, title: "Motor NEXUS", body: "Modelo google/gemini-2.5-flash · Antiduplicados · Slugs únicos.", color: "text-neon-purple" },
];

function AdminConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { isAdmin, loading: rolesLoading } = useMyRoles();

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) nav({ to: "/auth" });
  }, [user, authLoading, rolesLoading]);

  if (authLoading || rolesLoading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!isAdmin) return (
    <PageShell><section className="py-32 px-6 text-center">
      <Shield className="h-16 w-16 mx-auto text-neon-purple mb-4" />
      <h2 className="font-display text-2xl font-bold">Solo administradores</h2>
    </section></PageShell>
  );

  return (
    <PageShell>
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle eyebrow="// admin.configuracion" title="Configuración de la plataforma" subtitle="Accesos rápidos a cada área administrable." />
        <div className="mx-auto max-w-5xl">
          <div className="mb-4">
            <Link to="/admin" className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-neon-cyan/60">← Dashboard</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SECTIONS.map((s) => {
              const Body = (
                <>
                  <div className="flex items-center gap-2"><s.icon className={`h-5 w-5 ${s.color}`} /><span className="font-bold">{s.title}</span></div>
                  <p className="text-xs text-muted-foreground mt-2">{s.body}</p>
                </>
              );
              return s.to ? (
                <Link key={s.title} to={s.to} className="glass rounded-xl p-4 border border-border hover:border-neon-cyan/60 transition-all hover:scale-[1.01]">{Body}</Link>
              ) : (
                <div key={s.title} className="glass rounded-xl p-4 border border-border">{Body}</div>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
