import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TutorialContent } from "@/components/TutorialContent";
import type { AcademyCourse, AcademyLesson } from "@/lib/academy";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Award, CheckCircle2, Dumbbell, Lightbulb, TriangleAlert, ListChecks, Video } from "lucide-react";

export const Route = createFileRoute("/leccion/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lección — ITSABDIAS Academy" },
      { name: "description", content: "Lección con explicación, ejemplos de código, ejercicios y errores comunes." },
      { property: "og:title", content: "Lección — ITSABDIAS Academy" },
      { property: "og:description", content: "Aprende paso a paso en ITSABDIAS Academy." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [all, setAll] = useState<AcademyLesson[]>([]);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: l } = await supabase.from("academy_lessons").select("*").eq("id", lessonId).maybeSingle();
      if (cancel) return;
      if (!l) { setLoading(false); return; }
      setLesson(l as any);
      setLoading(false);
      const [{ data: c }, { data: ls }] = await Promise.all([
        supabase.from("academy_courses").select("*").eq("id", l.course_id).maybeSingle(),
        supabase.from("academy_lessons").select("*").eq("course_id", l.course_id).order("position"),
      ]);
      if (cancel) return;
      setCourse((c ?? null) as any);
      setAll((ls ?? []) as any);
      if (user) {
        const { data: p } = await supabase.from("academy_lesson_progress").select("id").eq("user_id", user.id).eq("lesson_id", l.id).maybeSingle();
        if (!cancel) setDone(!!p);
      }
    })();
    return () => { cancel = true; };
  }, [lessonId, user?.id]);

  const idx = all.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? all[idx - 1] : null;
  const nextL = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const complete = async () => {
    if (!user) return nav({ to: "/auth" });
    setSaving(true);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    const { data, error } = await supabase.rpc("academy_complete_lesson", { _lesson_id: lessonId, _minutes: minutes });
    setSaving(false);
    if (error) return toast.error(error.message);
    setDone(true);
    const r = data as any;
    if (r?.completed && r?.certificate) {
      toast.success("🎉 ¡Curso completado! Certificado emitido.");
      nav({ to: "/certificado/$code", params: { code: r.certificate } });
      return;
    }
    toast.success(`Lección completada · ${r?.progress ?? 0}% del curso`);
    if (nextL) nav({ to: "/leccion/$lessonId", params: { lessonId: nextL.id } });
  };

  if (loading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!lesson) return (
    <PageShell>
      <section className="py-32 text-center">
        <p className="text-muted-foreground">Lección no encontrada.</p>
        <Link to="/academy" className="mt-4 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">Ver la Academia</Link>
      </section>
    </PageShell>
  );

  const pct = all.length ? Math.round(((idx + 1) / all.length) * 100) : 0;

  return (
    <PageShell>
      <article className="py-8 sm:py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {course && (
            <Link to="/curso/$slug" params={{ slug: course.slug }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-cyan mb-4">
              <ArrowLeft className="h-3.5 w-3.5" /> {course.title}
            </Link>
          )}

          <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden mb-4">
            <div className="h-full bg-gradient-neon transition-all" style={{ width: `${pct}%` }} />
          </div>

          <p className="text-xs font-mono text-neon-cyan uppercase">
            Lección {lesson.position} de {all.length} · {lesson.duration_minutes} min
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-gradient-neon">{lesson.title}</h1>

          {lesson.video_url && (
            <a href={lesson.video_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neon-red/40 bg-neon-red/10 text-sm">
              <Video className="h-4 w-4" /> Ver vídeo de la lección
            </a>
          )}

          <div className="mt-6 glass rounded-2xl p-5 sm:p-8 neon-border">
            <TutorialContent content={lesson.content} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {lesson.exercise && <Panel icon={<Dumbbell className="h-4 w-4" />} title="Ejercicio" tone="cyan" text={lesson.exercise} />}
            {lesson.tips && <Panel icon={<Lightbulb className="h-4 w-4" />} title="Consejos" tone="green" text={lesson.tips} />}
            {lesson.common_mistakes && <Panel icon={<TriangleAlert className="h-4 w-4" />} title="Errores comunes" tone="red" text={lesson.common_mistakes} />}
            {lesson.summary && <Panel icon={<ListChecks className="h-4 w-4" />} title="Resumen" tone="purple" text={lesson.summary} />}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {prev && (
              <Link to="/leccion/$lessonId" params={{ lessonId: prev.id }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm hover:border-neon-cyan/60">
                <ArrowLeft className="h-3.5 w-3.5" /> Anterior
              </Link>
            )}
            <button
              onClick={complete}
              disabled={saving}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold ${done ? "border border-green-400/50 bg-green-400/10 text-green-400" : "bg-gradient-neon text-primary-foreground"} disabled:opacity-60`}
            >
              {done ? <><CheckCircle2 className="h-4 w-4" /> Completada</> : <><Award className="h-4 w-4" /> Marcar como completada</>}
            </button>
            {nextL && (
              <Link to="/leccion/$lessonId" params={{ lessonId: nextL.id }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm hover:border-neon-cyan/60">
                Siguiente <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </article>
    </PageShell>
  );
}

function Panel({ icon, title, text, tone }: { icon: React.ReactNode; title: string; text: string; tone: string }) {
  const tones: Record<string, string> = {
    cyan: "border-neon-cyan/40 text-neon-cyan",
    green: "border-green-400/40 text-green-400",
    red: "border-red-400/40 text-red-400",
    purple: "border-neon-purple/40 text-neon-purple",
  };
  return (
    <div className={`glass rounded-xl p-4 border ${tones[tone]}`}>
      <h3 className="text-sm font-bold inline-flex items-center gap-1.5">{icon} {title}</h3>
      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{text}</p>
    </div>
  );
}
