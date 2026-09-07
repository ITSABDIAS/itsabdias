import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Bot, CheckCircle2, ChevronDown, ChevronRight, Clock3,
  GraduationCap, Loader2, LockKeyhole, RotateCcw, Send, ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import {
  completeLesson, fetchExam, getCurriculum, getMyApplication, getMyAttempts,
  getMyLessonProgress, submitExam, type ExamAttempt, type ExamQuestion,
  type StaffApplication, type StaffExam, type StaffLesson, type StaffModule,
} from "@/lib/staffProgram";

export const Route = createFileRoute("/academia-staff")({
  head: () => ({
    meta: [
      { title: "Academia de Staff — ItsaBDias" },
      { name: "description", content: "Formación privada para candidatos a Moderador de ItsaBDias." },
      { property: "og:title", content: "Academia de Staff — ItsaBDias" },
      { property: "og:description", content: "Clases, exámenes y progreso del programa oficial de Moderadores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffAcademyPage,
});

type Curriculum = { modules: StaffModule[]; lessons: StaffLesson[]; exams: StaffExam[] };

function StaffAcademyPage() {
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading: rolesLoading } = useMyRoles();
  const [application, setApplication] = useState<StaffApplication | null>(null);
  const [curriculum, setCurriculum] = useState<Curriculum>({ modules: [], lessons: [], exams: [] });
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [lesson, setLesson] = useState<StaffLesson | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [exam, setExam] = useState<{ exam: StaffExam; questions: ExamQuestion[]; attempts_used: number } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; attempts_used: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const startedAt = useRef<number>(0);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const app = await getMyApplication(user.id);
    setApplication(app);
    if (app?.status === "accepted" || isStaff) {
      const [content, lessonProgress, examAttempts] = await Promise.all([
        getCurriculum(), getMyLessonProgress(user.id), getMyAttempts(user.id),
      ]);
      setCurriculum(content);
      setCompleted(lessonProgress);
      setAttempts(examAttempts);
      setOpenModule((current) => current ?? content.modules[0]?.id ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !rolesLoading) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, rolesLoading, user?.id, isStaff]);

  useEffect(() => {
    if (!lesson || completed.has(lesson.id)) return;
    startedAt.current = Date.now();
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [lesson, completed]);

  const finishedExams = useMemo(() => new Set(attempts.filter((a) => a.passed).map((a) => a.exam_id)), [attempts]);
  const totalUnits = curriculum.lessons.length + curriculum.exams.length;
  const doneUnits = completed.size + finishedExams.size;
  const percent = totalUnits ? Math.round((doneUnits / totalUnits) * 100) : 0;

  const markComplete = async () => {
    if (!lesson) return;
    setBusy(true);
    const progress = await completeLesson(lesson.id, elapsed);
    setBusy(false);
    if (progress) {
      setCompleted((current) => new Set(current).add(lesson.id));
      await load();
    }
  };

  const openExam = async (item: StaffExam) => {
    setBusy(true);
    const data = await fetchExam(item.id);
    setBusy(false);
    if (data) { setLesson(null); setExam(data); setAnswers({}); setResult(null); }
  };

  const sendExam = async () => {
    if (!exam || exam.questions.some((q) => !answers[q.id]?.trim())) return;
    setBusy(true);
    const response = await submitExam(exam.exam.id, answers);
    setBusy(false);
    if (response) {
      setResult(response);
      const next = await getMyAttempts(user?.id ?? "");
      setAttempts(next);
    }
  };

  if (authLoading || rolesLoading || loading) return <PageShell><div className="py-32 text-center"><Loader2 className="mx-auto animate-spin text-neon-cyan" /></div></PageShell>;
  if (!user) return <AccessState icon={LockKeyhole} title="Inicia sesión" text="La Academia de Staff es privada." action={<Button asChild><Link to="/auth">Entrar</Link></Button>} />;
  if (!isStaff && application?.status !== "accepted") return <AccessState icon={ShieldCheck} title="Acceso para candidatos" text="Primero envía tu solicitud y espera la aprobación del Staff." action={<Button asChild><Link to="/programa-staff">Ver programa</Link></Button>} />;

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionTitle as="h1" eyebrow="// formación privada" title="Academia de Staff" subtitle="Completa cada clase con su tiempo real y aprueba los exámenes. NEXUS puede explicar conceptos, pero no revela respuestas." />

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Progreso total" value={`${percent}%`} />
          <Metric label="Clases completadas" value={`${completed.size}/${curriculum.lessons.length}`} />
          <Metric label="Exámenes aprobados" value={`${finishedExams.size}/${curriculum.exams.length}`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="glass h-fit rounded-lg border border-border p-3 lg:sticky lg:top-20">
            <div className="mb-3 flex items-center gap-2 px-2 py-1 font-display font-bold"><GraduationCap className="text-neon-cyan" /> Ruta de formación</div>
            <div className="space-y-2">
              {curriculum.modules.map((module) => {
                const moduleLessons = curriculum.lessons.filter((item) => item.module_id === module.id);
                const moduleExams = curriculum.exams.filter((item) => item.module_id === module.id);
                const expanded = openModule === module.id;
                return (
                  <div key={module.id} className="overflow-hidden rounded-md border border-border/70">
                    <Button variant="ghost" onClick={() => setOpenModule(expanded ? null : module.id)} className="h-auto w-full justify-between whitespace-normal px-3 py-3 text-left">
                      <span className="flex items-start gap-2"><span className="font-mono text-xs text-neon-cyan">{String(module.position).padStart(2, "0")}</span><span>{module.title.replace(/^Módulo \d+ — /, "")}</span></span>
                      {expanded ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                    {expanded && (
                      <div className="space-y-1 border-t border-border/60 p-2">
                        {moduleLessons.map((item) => (
                          <Button key={item.id} variant="ghost" onClick={() => { setExam(null); setLesson(item); }} className="h-auto w-full justify-start whitespace-normal px-2 py-2 text-left text-xs">
                            {completed.has(item.id) ? <CheckCircle2 className="text-neon-cyan" /> : <BookOpen />} {item.title}
                          </Button>
                        ))}
                        {moduleExams.map((item) => (
                          <Button key={item.id} variant="ghost" onClick={() => void openExam(item)} className="h-auto w-full justify-start whitespace-normal px-2 py-2 text-left text-xs">
                            {finishedExams.has(item.id) ? <CheckCircle2 className="text-neon-cyan" /> : <ShieldCheck />} {item.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0">
            {!lesson && !exam && (
              <div className="glass rounded-lg border border-border p-6 sm:p-10">
                <GraduationCap className="h-12 w-12 text-neon-cyan" />
                <h2 className="mt-4 text-2xl font-bold">Selecciona una clase</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">Avanza módulo por módulo. Los resultados y el tiempo de estudio se validan antes de guardar el progreso.</p>
              </div>
            )}

            {lesson && (
              <article className="glass rounded-lg border border-border p-5 sm:p-8">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:justify-between">
                  <div className="min-w-0"><p className="font-mono text-xs uppercase text-neon-cyan">Clase de formación</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">{lesson.title}</h2></div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"><Clock3 /> {Math.max(0, lesson.min_seconds - elapsed)}s restantes</span>
                </div>
                <p className="mt-4 text-lg text-muted-foreground">{lesson.description}</p>
                <div className="mt-7 space-y-6 leading-7 text-foreground/90">
                  <p className="whitespace-pre-line">{lesson.content}</p>
                  {lesson.examples && <InfoBlock title="Ejemplos" text={lesson.examples} />}
                  {lesson.key_points && <InfoBlock title="Puntos importantes" text={lesson.key_points} />}
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <Button onClick={() => void markComplete()} disabled={busy || elapsed < lesson.min_seconds || completed.has(lesson.id)}>
                    {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {completed.has(lesson.id) ? "Clase completada" : "Marcar como completada"}
                  </Button>
                  <Button asChild variant="outline"><Link to="/ai" search={{ q: `Explícame el concepto "${lesson.title}" para mi formación de moderador, sin revelar respuestas de exámenes.` }}><Bot /> Preguntar a NEXUS</Link></Button>
                </div>
              </article>
            )}

            {exam && (
              <section className="glass rounded-lg border border-border p-5 sm:p-8">
                <p className="font-mono text-xs uppercase text-neon-purple">Evaluación protegida</p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{exam.exam.title}</h2>
                <p className="mt-2 text-muted-foreground">Necesitas {exam.exam.pass_score}%. Intentos usados: {result?.attempts_used ?? exam.attempts_used}/{exam.exam.max_attempts}.</p>
                {result ? (
                  <div className="mt-7 rounded-lg border border-border p-6 text-center">
                    <div className={`text-4xl font-bold ${result.passed ? "text-neon-cyan" : "text-destructive"}`}>{result.score}%</div>
                    <p className="mt-2 font-semibold">{result.passed ? "Examen aprobado" : "Aún no aprobado"}</p>
                    {!result.passed && result.attempts_used < exam.exam.max_attempts && <Button className="mt-4" variant="outline" onClick={() => { setResult(null); setAnswers({}); }}><RotateCcw /> Reintentar</Button>}
                  </div>
                ) : (
                  <div className="mt-7 space-y-6">
                    {exam.questions.map((question, index) => <Question key={question.id} question={question} index={index} value={answers[question.id] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />)}
                    <Button onClick={() => void sendExam()} disabled={busy || exam.questions.some((q) => !answers[q.id]?.trim())}><Send /> Entregar examen</Button>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Question({ question, index, value, onChange }: { question: ExamQuestion; index: number; value: string; onChange: (value: string) => void }) {
  return <fieldset className="rounded-lg border border-border p-4"><legend className="px-2 font-semibold">{index + 1}. {question.prompt}</legend>{question.kind === "case" ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="mt-3 w-full rounded-md border border-border bg-background/60 p-3 outline-none focus:border-neon-cyan" /> : <div className="mt-3 grid gap-2">{question.options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:border-neon-cyan/50"><input type="radio" name={question.id} value={option} checked={value === option} onChange={() => onChange(option)} className="accent-primary" /><span>{option}</span></label>)}</div>}</fieldset>;
}

function InfoBlock({ title, text }: { title: string; text: string }) { return <div className="rounded-md border-l-2 border-neon-purple bg-secondary/30 p-4"><h2 className="font-bold text-neon-cyan">{title}</h2><p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{text}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="glass rounded-md border border-border p-4"><p className="text-2xl font-bold text-gradient-neon">{value}</p><p className="text-xs uppercase text-muted-foreground">{label}</p></div>; }
function AccessState({ icon: Icon, title, text, action }: { icon: typeof LockKeyhole; title: string; text: string; action: React.ReactNode }) { return <PageShell><section className="mx-auto max-w-xl px-6 py-28 text-center"><Icon className="mx-auto h-14 w-14 text-neon-cyan" /><h1 className="mt-5 text-3xl font-bold">{title}</h1><p className="my-4 text-muted-foreground">{text}</p>{action}</section></PageShell>; }