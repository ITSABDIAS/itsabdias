import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { generateCourse, generateLesson } from "@/lib/academy.functions";
import { COURSE_SELECT, type AcademyCourse, type AcademyPath } from "@/lib/academy";
import { LEVELS } from "@/lib/tutorials";
import { Shield, Sparkles, Star, Loader2, Trash2, Eye, EyeOff, Plus, Search, GraduationCap, Pencil, Save, X } from "lucide-react";

export const Route = createFileRoute("/admin/academia")({
  head: () => ({ meta: [{ title: "Admin · Academia — ItsaBDias" }, { name: "robots", content: "noindex" }] }),
  component: AdminAcademia,
});

function AdminAcademia() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [paths, setPaths] = useState<AcademyPath[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AcademyCourse | null>(null);

  const [gen, setGen] = useState({ pathId: "", level: "principiante", topic: "", lessons: 6 });
  const [pathForm, setPathForm] = useState({ title: "", slug: "", description: "", icon: "🎓" });
  const [courseForm, setCourseForm] = useState({ pathId: "", title: "", description: "", level: "principiante", minutes: 90 });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "founder"]);
      const admin = (data ?? []).length > 0;
      setIsAdmin(admin);
      setChecking(false);
      if (admin) load();
    })();
  }, [user, authLoading, nav]);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("academy_paths").select("*").order("sort_order"),
      supabase.from("academy_courses").select(COURSE_SELECT).order("created_at", { ascending: false }),
    ]);
    setPaths((p ?? []) as any);
    setCourses((c ?? []) as any);
    if (p?.[0]) {
      setGen((g) => ({ ...g, pathId: g.pathId || p[0].id }));
      setCourseForm((f) => ({ ...f, pathId: f.pathId || p[0].id }));
    }
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return courses;
    const s = q.toLowerCase();
    return courses.filter((c) => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
  }, [courses, q]);

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

  const runGenerate = async () => {
    if (!gen.pathId) return toast.error("Elige una ruta");
    setBusy(true);
    try {
      const r = await generateCourse({ data: { pathId: gen.pathId, level: gen.level as any, topic: gen.topic.trim() || undefined, lessons: gen.lessons } });
      toast.success(`Curso creado: ${r.title} (${r.lessons} lecciones)`);
      setGen((g) => ({ ...g, topic: "" }));
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error generando el curso");
    } finally {
      setBusy(false);
    }
  };

  const addLesson = async (courseId: string) => {
    setBusy(true);
    try {
      const r = await generateLesson({ data: { courseId } });
      toast.success(`Lección añadida: ${r.title}`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error generando la lección");
    } finally {
      setBusy(false);
    }
  };

  const createPath = async () => {
    if (!pathForm.title.trim()) return toast.error("Título obligatorio");
    const { error } = await supabase.from("academy_paths").insert({
      title: pathForm.title.trim(),
      slug: pathForm.slug.trim() || slugify(pathForm.title),
      description: pathForm.description.trim(),
      icon: pathForm.icon || "🎓",
      sort_order: paths.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Ruta creada");
    setPathForm({ title: "", slug: "", description: "", icon: "🎓" });
    load();
  };

  const deletePath = async (id: string) => {
    if (!confirm("¿Eliminar esta ruta? Los cursos quedarán sin ruta.")) return;
    const { error } = await supabase.from("academy_paths").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ruta eliminada");
    load();
  };

  const createCourse = async () => {
    if (!courseForm.title.trim()) return toast.error("Título obligatorio");
    const { error } = await supabase.from("academy_courses").insert({
      path_id: courseForm.pathId || null,
      slug: slugify(courseForm.title) + "-" + Math.random().toString(36).slice(2, 5),
      title: courseForm.title.trim(),
      description: courseForm.description.trim(),
      level: courseForm.level,
      estimated_minutes: courseForm.minutes,
      author_id: user!.id,
      is_published: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Curso creado");
    setCourseForm({ pathId: paths[0]?.id ?? "", title: "", description: "", level: "principiante", minutes: 90 });
    load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("academy_courses").update({
      title: editing.title,
      description: editing.description,
      level: editing.level,
      estimated_minutes: editing.estimated_minutes,
      path_id: editing.path_id,
      image_url: editing.image_url,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Curso actualizado");
    setEditing(null);
    load();
  };

  const toggle = async (c: AcademyCourse, field: "is_featured" | "is_published") => {
    const patch = field === "is_featured" ? { is_featured: !c.is_featured } : { is_published: !c.is_published };
    const { error } = await supabase.from("academy_courses").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  };

  const removeCourse = async (id: string) => {
    if (!confirm("¿Eliminar el curso y todas sus lecciones?")) return;
    const { error } = await supabase.from("academy_courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Curso eliminado");
    load();
  };

  if (authLoading || checking) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!isAdmin) return (
    <PageShell>
      <section className="py-32 text-center">
        <Shield className="h-10 w-10 mx-auto text-red-400 mb-3" />
        <p className="text-muted-foreground">Acceso restringido al staff.</p>
      </section>
    </PageShell>
  );

  return (
    <PageShell>
      <section className="py-10 px-4 sm:px-6">
        <SectionTitle eyebrow="// academy.admin" title="Panel de la Academia" subtitle="Rutas, cursos, lecciones y generación con NEXUS." />

        <div className="mx-auto max-w-6xl space-y-8">
          {/* NEXUS generator */}
          <div className="glass rounded-2xl p-5 neon-border">
            <h3 className="font-display text-lg font-bold inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-neon-purple" /> Generar curso con NEXUS</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <select value={gen.pathId} onChange={(e) => setGen({ ...gen, pathId: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                {paths.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.title}</option>)}
              </select>
              <select value={gen.level} onChange={(e) => setGen({ ...gen, level: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                {LEVELS.map((l) => <option key={l.slug} value={l.slug}>{l.label}</option>)}
              </select>
              <input value={gen.topic} onChange={(e) => setGen({ ...gen, topic: e.target.value })} placeholder="Tema (opcional)" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
              <input type="number" min={3} max={12} value={gen.lessons} onChange={(e) => setGen({ ...gen, lessons: Number(e.target.value) })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <button onClick={runGenerate} disabled={busy} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generar curso completo
            </button>
          </div>

          {/* Paths */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-bold inline-flex items-center gap-2"><GraduationCap className="h-4 w-4 text-neon-cyan" /> Rutas ({paths.length})</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <input value={pathForm.icon} onChange={(e) => setPathForm({ ...pathForm, icon: e.target.value })} placeholder="🎓" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
              <input value={pathForm.title} onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })} placeholder="Título de la ruta" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
              <input value={pathForm.description} onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })} placeholder="Descripción" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm sm:col-span-2" />
            </div>
            <button onClick={createPath} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neon-cyan/50 text-neon-cyan text-sm"><Plus className="h-4 w-4" /> Crear ruta</button>
            <div className="mt-4 flex flex-wrap gap-2">
              {paths.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs">
                  {p.icon} {p.title}
                  <button onClick={() => deletePath(p.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Manual course */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-bold">Crear curso manual</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <select value={courseForm.pathId} onChange={(e) => setCourseForm({ ...courseForm, pathId: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                {paths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Título" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
              <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                {LEVELS.map((l) => <option key={l.slug} value={l.slug}>{l.label}</option>)}
              </select>
              <input type="number" value={courseForm.minutes} onChange={(e) => setCourseForm({ ...courseForm, minutes: Number(e.target.value) })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
              <input value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Descripción" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm sm:col-span-4" />
            </div>
            <button onClick={createCourse} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-neon-purple/50 text-neon-purple text-sm"><Plus className="h-4 w-4" /> Crear curso</button>
          </div>

          {/* Courses list */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-display text-lg font-bold">Cursos ({courses.length})</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar curso..." className="pl-9 pr-3 py-2 bg-input/40 border border-border rounded-md text-sm" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {filtered.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3">
                  {editing?.id === c.id ? (
                    <div className="grid gap-2 sm:grid-cols-4">
                      <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm sm:col-span-2" />
                      <select value={editing.level} onChange={(e) => setEditing({ ...editing, level: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                        {LEVELS.map((l) => <option key={l.slug} value={l.slug}>{l.label}</option>)}
                      </select>
                      <input type="number" value={editing.estimated_minutes} onChange={(e) => setEditing({ ...editing, estimated_minutes: Number(e.target.value) })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
                      <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm sm:col-span-3" />
                      <input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="URL de imagen" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" />
                      <div className="sm:col-span-4 flex gap-2">
                        <button onClick={saveEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-neon text-primary-foreground text-xs font-bold"><Save className="h-3.5 w-3.5" /> Guardar</button>
                        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs"><X className="h-3.5 w-3.5" /> Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Link to="/curso/$slug" params={{ slug: c.slug }} className="text-sm font-semibold hover:text-neon-cyan">{c.title}</Link>
                        <p className="text-[11px] text-muted-foreground">
                          {c.lessons_count} lecciones · {c.students_count} estudiantes · {c.level} {c.is_nexus && "· 🤖 NEXUS"} {!c.is_published && "· oculto"}
                        </p>
                      </div>
                      <button onClick={() => addLesson(c.id)} disabled={busy} className="px-2 py-1 rounded-md border border-neon-purple/40 text-neon-purple text-xs inline-flex items-center gap-1 disabled:opacity-60">
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} + Lección
                      </button>
                      <button onClick={() => toggle(c, "is_featured")} title="Destacar" className={`p-1.5 rounded-md border ${c.is_featured ? "border-neon-gold text-neon-gold" : "border-border text-muted-foreground"}`}><Star className="h-3.5 w-3.5" /></button>
                      <button onClick={() => toggle(c, "is_published")} title="Publicar" className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-neon-cyan">
                        {c.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setEditing(c)} className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-neon-cyan"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => removeCourse(c.id)} className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground">No hay cursos todavía.</p>}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
