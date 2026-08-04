import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COURSE_SELECT, fmtMinutes, type AcademyCourse, type AcademyLesson } from "@/lib/academy";
import { levelMeta } from "@/lib/tutorials";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, Play, Share2, Sparkles, Users, Award } from "lucide-react";

export const Route = createFileRoute("/curso/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Curso ${params.slug} — ITSABDIAS Academy` },
      { name: "description", content: `Curso completo con lecciones paso a paso en ITSABDIAS Academy.` },
      { property: "og:title", content: `Curso ${params.slug} — ITSABDIAS Academy` },
      { property: "og:description", content: "Aprende con lecciones, ejercicios y certificado al completar el curso." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [c, setC] = useState<AcademyCourse | null>(null);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [enrolled, setEnrolled] = useState(false);
  const [percent, setPercent] = useState(0);
  const [cert, setCert] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("academy_courses").select(COURSE_SELECT).eq("slug", slug).maybeSingle();
      if (cancel) return;
      if (!data) { setLoading(false); return; }
      setC(data as any);
      setLoading(false);
      const { data: ls } = await supabase.from("academy_lessons").select("*").eq("course_id", data.id).order("position");
      if (!cancel) setLessons((ls ?? []) as any);
      if (data.author_id) {
        supabase.from("profiles").select("username").eq("id", data.author_id).maybeSingle().then(({ data: p }) => {
          if (!cancel) setAuthor(p?.username ?? null);
        });
      }
    })();
    return () => { cancel = true; };
  }, [slug]);

  useEffect(() => {
    if (!user || !c) return;
    let cancel = false;
    (async () => {
      const [{ data: e }, { data: lp }, { data: cr }] = await Promise.all([
        supabase.from("academy_enrollments").select("progress_percent").eq("user_id", user.id).eq("course_id", c.id).maybeSingle(),
        supabase.from("academy_lesson_progress").select("lesson_id").eq("user_id", user.id).eq("course_id", c.id),
        supabase.from("academy_certificates").select("code").eq("user_id", user.id).eq("course_id", c.id).maybeSingle(),
      ]);
      if (cancel) return;
      setEnrolled(!!e);
      setPercent(e?.progress_percent ?? 0);
      setDoneIds(new Set((lp ?? []).map((x: any) => x.lesson_id)));
      setCert(cr?.code ?? null);
    })();
    return () => { cancel = true; };
  }, [user?.id, c?.id]);

  const enroll = async () => {
    if (!user) return nav({ to: "/auth" });
    if (!c) return;
    const { error } = await supabase.rpc("academy_enroll", { _course_id: c.id });
    if (error) return toast.error(error.message);
    setEnrolled(true);
    toast.success("¡Inscrito! Empieza cuando quieras 🎓");
    if (lessons[0]) nav({ to: "/curso/$slug/$lessonId", params: { slug: c.slug, lessonId: lessons[0].id } });
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: c?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }
    } catch {}
  };

  if (loading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!c) return (
    <PageShell>
      <section className="py-32 text-center">
        <p className="text-muted-foreground">Curso no encontrado.</p>
        <Link to="/academy" className="mt-4 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">Ver la Academia</Link>
      </section>
    </PageShell>
  );

  const lv = levelMeta(c.level);
  const next = lessons.find((l) => !doneIds.has(l.id)) ?? lessons[0];

  return (
    <PageShell>
      <section className="py-8 sm:py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link to="/academy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-cyan mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a la Academia
          </Link>

          <div className="glass rounded-2xl p-5 sm:p-8 neon-border">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase ${lv.color}`}>{lv.label}</span>
              {c.is_nexus && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-purple/40 bg-neon-purple/10 text-neon-purple inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Creado por NEXUS
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gradient-neon">{c.title}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">{c.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {lessons.length} lecciones</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtMinutes(c.estimated_minutes)}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.students_count} estudiantes</span>
              <span className="inline-flex items-center gap-1">
                Profesor: {c.is_nexus ? <span className="text-neon-purple font-semibold">🤖 NEXUS</span> : author ? (
                  <Link to="/u/$username" params={{ username: author }} className="text-neon-cyan hover:underline">@{author}</Link>
                ) : "ItsaBDias"}
              </span>
            </div>

            {enrolled && (
              <div className="mt-5">
                <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                  <div className="h-full bg-gradient-neon transition-all" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-neon-cyan">{percent}% completado</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {next ? (
                enrolled ? (
                  <Link to="/curso/$slug/$lessonId" params={{ slug: c.slug, lessonId: next.id }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">
                    <Play className="h-4 w-4" /> {percent > 0 ? "Continuar curso" : "Empezar curso"}
                  </Link>
                ) : (
                  <button onClick={enroll} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">
                    <Play className="h-4 w-4" /> Inscribirme gratis
                  </button>
                )
              ) : (
                <span className="text-xs text-muted-foreground">Este curso todavía no tiene lecciones.</span>
              )}
              <button onClick={share} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border hover:border-neon-blue/60 text-sm">
                <Share2 className="h-3.5 w-3.5" /> Compartir
              </button>
              {cert && (
                <Link to="/certificado/$code" params={{ code: cert }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neon-gold/50 bg-neon-gold/10 text-neon-gold text-sm font-semibold">
                  <Award className="h-4 w-4" /> Ver certificado
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-bold mb-3">Contenido del curso</h2>
            <div className="space-y-2">
              {lessons.map((l) => {
                const done = doneIds.has(l.id);
                return (
                  <Link
                    key={l.id}
                    to="/curso/$slug/$lessonId"
                    params={{ slug: c.slug, lessonId: l.id }}
                    className="flex items-center gap-3 glass rounded-lg p-3 hover:border-neon-cyan/50 border border-transparent transition-all"
                  >
                    {done ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-xs font-mono text-neon-cyan shrink-0">{String(l.position).padStart(2, "0")}</span>
                    <span className="text-sm flex-1 line-clamp-1">{l.title}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{l.duration_minutes} min</span>
                  </Link>
                );
              })}
              {lessons.length === 0 && <p className="text-sm text-muted-foreground">Sin lecciones por ahora.</p>}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
