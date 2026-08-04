import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CourseCard } from "@/components/CourseCard";
import { COURSE_SELECT, type AcademyCourse, type AcademyPath } from "@/lib/academy";
import { ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/academy/$path")({
  head: ({ params }) => ({
    meta: [
      { title: `Ruta de aprendizaje ${params.path} — ITSABDIAS Academy` },
      { name: "description", content: `Todos los cursos de la ruta ${params.path} en ITSABDIAS Academy.` },
      { property: "og:title", content: `Ruta ${params.path} — ITSABDIAS Academy` },
      { property: "og:description", content: `Aprende paso a paso con los cursos de la ruta ${params.path}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PathPage,
});

function PathPage() {
  const { path } = Route.useParams();
  const { user } = useAuth();
  const [p, setP] = useState<AcademyPath | null>(null);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("academy_paths").select("*").eq("slug", path).maybeSingle();
      if (cancel) return;
      setP((data ?? null) as any);
      if (data) {
        const { data: c } = await supabase
          .from("academy_courses").select(COURSE_SELECT)
          .eq("path_id", data.id).eq("is_published", true)
          .order("is_featured", { ascending: false }).order("created_at", { ascending: false });
        if (!cancel) setCourses((c ?? []) as any);
      }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [path]);

  useEffect(() => {
    if (!user) return;
    supabase.from("academy_enrollments").select("course_id, progress_percent").eq("user_id", user.id).then(({ data }) => {
      setProgress(Object.fromEntries((data ?? []).map((e: any) => [e.course_id, e.progress_percent])));
    });
  }, [user?.id]);

  const done = courses.length > 0 && courses.every((c) => progress[c.id] === 100);

  if (loading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!p) return (
    <PageShell>
      <section className="py-32 text-center">
        <p className="text-muted-foreground">Ruta no encontrada.</p>
        <Link to="/academy" className="mt-4 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">Ver la Academia</Link>
      </section>
    </PageShell>
  );

  return (
    <PageShell>
      <section className="py-10 sm:py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link to="/academy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-cyan mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a la Academia
          </Link>
          <div className="glass rounded-2xl p-6 neon-border">
            <div className="text-4xl">{p.icon}</div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-gradient-neon">{p.title}</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">{p.description}</p>
            <p className="mt-4 text-xs font-mono text-neon-cyan">
              {courses.length} cursos {done && "· ✅ ruta completada"}
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => <CourseCard key={c.id} c={c} progress={progress[c.id]} />)}
          </div>
          {courses.length === 0 && (
            <div className="mt-8 glass rounded-xl p-8 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-neon-purple mb-3" />
              <p className="text-muted-foreground">Todavía no hay cursos en esta ruta.</p>
              <Link to="/admin/academia" className="mt-3 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">Generar con NEXUS</Link>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
