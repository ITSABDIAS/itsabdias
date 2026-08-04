import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CourseCard } from "@/components/CourseCard";
import { COURSE_SELECT, type AcademyCourse, type AcademyPath } from "@/lib/academy";
import { LEVELS } from "@/lib/tutorials";
import { Search, GraduationCap, Sparkles, Award, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/academy/")({
  head: () => ({
    meta: [
      { title: "ITSABDIAS Academy — Centro de aprendizaje tecnológico" },
      { name: "description", content: "Rutas de aprendizaje, cursos y certificados de ITSABDIAS: programación, IA, Roblox, hardware, gamedev y más." },
      { property: "og:title", content: "ITSABDIAS Academy" },
      { property: "og:description", content: "Aprende tecnología de forma organizada: rutas, cursos, lecciones y certificados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AcademyPage,
});

function AcademyPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<AcademyPath[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [lvl, setLvl] = useState("all");
  const [author, setAuthor] = useState<"all" | "nexus" | "user">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("academy_paths").select("*").eq("is_published", true).order("sort_order"),
        supabase.from("academy_courses").select(COURSE_SELECT).eq("is_published", true).order("created_at", { ascending: false }).limit(300),
      ]);
      setPaths((p ?? []) as any);
      setCourses((c ?? []) as any);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) { setProgress({}); return; }
    supabase.from("academy_enrollments").select("course_id, progress_percent").eq("user_id", user.id).then(({ data }) => {
      setProgress(Object.fromEntries((data ?? []).map((e: any) => [e.course_id, e.progress_percent])));
    });
  }, [user?.id]);

  const filtered = useMemo(() => {
    let x = courses;
    if (lvl !== "all") x = x.filter((c) => c.level === lvl);
    if (author !== "all") x = x.filter((c) => (author === "nexus" ? c.is_nexus : !c.is_nexus));
    if (q.trim()) {
      const s = q.toLowerCase();
      x = x.filter((c) => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s) || c.tags?.some((t) => t.toLowerCase().includes(s)));
    }
    return x;
  }, [courses, q, lvl, author]);

  const featured = courses.filter((c) => c.is_featured).slice(0, 3);
  const inProgress = courses.filter((c) => progress[c.id] !== undefined && progress[c.id] < 100).slice(0, 3);
  const countByPath = useMemo(() => {
    const m: Record<string, number> = {};
    courses.forEach((c) => { if (c.path_id) m[c.path_id] = (m[c.path_id] ?? 0) + 1; });
    return m;
  }, [courses]);

  return (
    <PageShell>
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-purple/40 bg-neon-purple/10 text-neon-purple text-xs font-mono uppercase">
            <GraduationCap className="h-3.5 w-3.5" /> academy 1.0
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold text-gradient-neon">ITSABDIAS Academy</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            El centro oficial de aprendizaje. Rutas completas, cursos con lecciones paso a paso, progreso guardado y certificados verificables.
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="glass rounded-2xl p-4 sm:p-5 neon-border flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cursos, rutas, temas..."
                className="w-full pl-9 pr-3 py-2.5 bg-input/40 border border-border rounded-md text-sm focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={lvl === "all"} onClick={() => setLvl("all")}>Todos los niveles</Chip>
              {LEVELS.map((l) => <Chip key={l.slug} active={lvl === l.slug} onClick={() => setLvl(l.slug)}>{l.label}</Chip>)}
              <Chip active={author === "nexus"} onClick={() => setAuthor(author === "nexus" ? "all" : "nexus")}>🤖 NEXUS</Chip>
              <Chip active={author === "user"} onClick={() => setAuthor(author === "user" ? "all" : "user")}>👤 Comunidad</Chip>
            </div>
          </div>
        </div>

        {/* Rutas */}
        <div className="mx-auto max-w-6xl mt-10">
          <SectionTitle eyebrow="// learning.paths" title="Rutas de aprendizaje" subtitle="Elige tu camino y avanza curso a curso." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paths.map((p) => (
              <Link
                key={p.id}
                to="/academy/$path"
                params={{ path: p.slug }}
                className={`group rounded-xl p-5 border border-border bg-gradient-to-br ${p.color} bg-opacity-10 hover:-translate-y-1 transition-all relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors" />
                <div className="relative">
                  <div className="text-3xl">{p.icon}</div>
                  <h3 className="mt-2 font-display font-bold text-lg group-hover:text-neon-cyan transition-colors">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  <p className="mt-3 text-[11px] font-mono text-neon-cyan">{countByPath[p.id] ?? 0} cursos</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {inProgress.length > 0 && (
          <div className="mx-auto max-w-6xl mt-12">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-neon-cyan" /> Continúa aprendiendo</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgress.map((c) => <CourseCard key={c.id} c={c} progress={progress[c.id]} />)}
            </div>
          </div>
        )}

        {featured.length > 0 && (
          <div className="mx-auto max-w-6xl mt-12">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-neon-gold" /> Cursos destacados</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((c) => <CourseCard key={c.id} c={c} progress={progress[c.id]} />)}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl mt-12">
          <h2 className="font-display text-2xl font-bold mb-4">Todos los cursos</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-neon-purple mb-3" />
              <p className="text-muted-foreground">Aún no hay cursos con estos filtros.</p>
              <Link to="/admin/academia" className="mt-3 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">
                Generar cursos con NEXUS
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => <CourseCard key={c.id} c={c} progress={progress[c.id]} />)}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs border transition-all ${active ? "bg-gradient-neon text-primary-foreground border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
