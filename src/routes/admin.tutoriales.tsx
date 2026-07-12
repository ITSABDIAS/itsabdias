import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Shield, Sparkles, Star, EyeOff, Eye, Trash2, Loader2, Search, BarChart3, Bookmark, Heart, MessageCircle } from "lucide-react";
import { TUTORIAL_CATEGORIES, LEVELS, categoryLabel } from "@/lib/tutorials";
import { generateTutorials } from "@/lib/tutorials.functions";

export const Route = createFileRoute("/admin/tutoriales")({
  head: () => ({ meta: [{ title: "Admin · Tutoriales — ItsaBDias" }] }),
  component: AdminTutorialesPage,
});

type Row = {
  id: string;
  category: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  is_featured: boolean;
  is_hidden: boolean;
  is_ai_generated: boolean;
  views_count: number;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  created_at: string;
};

function AdminTutorialesPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [gen, setGen] = useState<{ cat: string; level: string; topic: string; count: number; busy: boolean }>({
    cat: "programacion", level: "principiante", topic: "", count: 1, busy: false,
  });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ category: "programacion", title: "", description: "", content: "", level: "principiante", read_minutes: 5, tags: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "founder"]);
      const admin = (data ?? []).length > 0;
      setIsAdmin(admin); setChecking(false);
      if (admin) load();
    })();
  }, [user, authLoading, nav]);

  const load = async () => {
    const { data, error } = await supabase
      .from("tutorials")
      .select("id, category, slug, title, description, level, is_featured, is_hidden, is_ai_generated, views_count, likes_count, saves_count, comments_count, created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data ?? []) as any);
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const featured = rows.filter((r) => r.is_featured).length;
    const ai = rows.filter((r) => r.is_ai_generated).length;
    const usr = total - ai;
    const views = rows.reduce((a, r) => a + r.views_count, 0);
    const saves = rows.reduce((a, r) => a + r.saves_count, 0);
    return { total, featured, ai, usr, views, saves };
  }, [rows]);

  const filtered = useMemo(() => {
    let x = rows;
    if (cat !== "all") x = x.filter((r) => r.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      x = x.filter((r) => r.title.toLowerCase().includes(s) || r.description.toLowerCase().includes(s));
    }
    return x;
  }, [rows, cat, q]);

  const toggle = async (id: string, field: "is_featured" | "is_hidden", value: boolean) => {
    const patch = field === "is_featured" ? { is_featured: value } : { is_hidden: value };
    const { error } = await supabase.from("tutorials").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar tutorial?")) return;
    const { error } = await supabase.from("tutorials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado"); load();
  };

  const runGenerate = async (count: number) => {
    setGen((g) => ({ ...g, busy: true, count }));
    try {
      const res = await generateTutorials({
        data: {
          category: gen.cat as any,
          level: gen.level as any,
          topic: gen.topic.trim() || undefined,
          count,
        },
      });
      toast.success(`Generados ${res.created.length} tutoriales${res.errors.length ? ` (${res.errors.length} errores)` : ""}`);
      if (res.errors.length) console.warn("Errores:", res.errors);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al generar");
    } finally {
      setGen((g) => ({ ...g, busy: false }));
    }
  };

  const createManual = async () => {
    if (!user) return;
    const slug = form.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || `t-${Date.now()}`;
    const { error } = await supabase.from("tutorials").insert({
      category: form.category, slug, title: form.title, description: form.description,
      content: form.content, level: form.level, read_minutes: form.read_minutes,
      tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
      author_id: user.id, is_ai_generated: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Tutorial creado");
    setCreating(false);
    setForm({ category: "programacion", title: "", description: "", content: "", level: "principiante", read_minutes: 5, tags: "" });
    load();
  };

  if (checking) return <PageShell><section className="py-32 text-center text-muted-foreground">Verificando...</section></PageShell>;
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
      <section className="py-14 px-4 sm:px-6">
        <SectionTitle eyebrow="// admin.tutoriales" title="Gestión de tutoriales" subtitle="Crea, edita y genera contenido con NEXUS IA." />

        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link to="/admin" className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/tutoriales" className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">Ver tutoriales públicos</Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard icon={<BarChart3 className="h-4 w-4"/>} label="Publicados" value={stats.total}/>
            <StatCard icon={<Star className="h-4 w-4"/>} label="Destacados" value={stats.featured}/>
            <StatCard icon={<Sparkles className="h-4 w-4"/>} label="Por NEXUS" value={stats.ai}/>
            <StatCard icon={<Shield className="h-4 w-4"/>} label="Por usuarios" value={stats.usr}/>
            <StatCard icon={<Eye className="h-4 w-4"/>} label="Vistas totales" value={stats.views}/>
            <StatCard icon={<Bookmark className="h-4 w-4"/>} label="Guardados" value={stats.saves}/>
          </div>

          {/* NEXUS Generator */}
          <div className="glass rounded-2xl p-5 neon-border mb-6">
            <h3 className="font-display text-lg font-bold flex items-center gap-2 mb-3"><Sparkles className="h-5 w-5 text-neon-purple"/> Generador NEXUS IA</h3>
            <div className="grid sm:grid-cols-4 gap-3">
              <select value={gen.cat} onChange={(e) => setGen({ ...gen, cat: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                {TUTORIAL_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
              <select value={gen.level} onChange={(e) => setGen({ ...gen, level: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                {LEVELS.map((l) => <option key={l.slug} value={l.slug}>{l.label}</option>)}
              </select>
              <input value={gen.topic} onChange={(e) => setGen({ ...gen, topic: e.target.value })} placeholder="Tema (opcional)" className="sm:col-span-2 bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 5, 10].map((n) => (
                <button key={n} disabled={gen.busy} onClick={() => runGenerate(n)}
                  className="px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2">
                  {gen.busy && gen.count === n ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                  Generar {n}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Se evitan títulos duplicados. Cada uno se marca con la insignia "NEXUS IA".</p>
          </div>

          {/* Manual create */}
          <div className="glass rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold">Crear tutorial manual</h3>
              <button onClick={() => setCreating((v) => !v)} className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">{creating ? "Cerrar" : "Nuevo"}</button>
            </div>
            {creating && (
              <div className="grid gap-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                    {TUTORIAL_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                    {LEVELS.map((l) => <option key={l.slug} value={l.slug}>{l.label}</option>)}
                  </select>
                  <input type="number" min={1} max={60} value={form.read_minutes} onChange={(e) => setForm({ ...form, read_minutes: parseInt(e.target.value) || 5 })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm" placeholder="Minutos"/>
                </div>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags separados por coma" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} placeholder="Contenido en Markdown. Usa ```lang para bloques de código." className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm font-mono"/>
                <div className="flex justify-end">
                  <button onClick={createManual} disabled={!form.title || !form.description || !form.content} className="px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold disabled:opacity-50">Publicar</button>
                </div>
              </div>
            )}
          </div>

          {/* Filters + list */}
          <div className="glass rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 bg-input/40 border border-border rounded-md text-sm"/>
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
              <option value="all">Todas las categorías</option>
              {TUTORIAL_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-muted-foreground text-sm">Sin tutoriales.</p>}
            {filtered.map((r) => (
              <div key={r.id} className="glass rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan uppercase font-mono">{categoryLabel(r.category)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border uppercase font-mono text-muted-foreground">{r.level}</span>
                      {r.is_ai_generated && <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-purple/40 bg-neon-purple/10 text-neon-purple inline-flex items-center gap-1"><Sparkles className="h-3 w-3"/> NEXUS</span>}
                      {r.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 inline-flex items-center gap-1"><Star className="h-3 w-3"/> Destacado</span>}
                      {r.is_hidden && <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-400/40 bg-red-400/10 text-red-400">Oculto</span>}
                    </div>
                    <Link to="/tutorial/$category/$slug" params={{ category: r.category, slug: r.slug }} className="font-bold hover:text-neon-cyan">{r.title}</Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3"/> {r.views_count}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3"/> {r.likes_count}</span>
                      <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3"/> {r.saves_count}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3"/> {r.comments_count}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggle(r.id, "is_featured", !r.is_featured)} className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-yellow-400/60 inline-flex items-center gap-1">
                      <Star className="h-3 w-3"/> {r.is_featured ? "Quitar destacado" : "Destacar"}
                    </button>
                    <button onClick={() => toggle(r.id, "is_hidden", !r.is_hidden)} className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-neon-cyan/60 inline-flex items-center gap-1">
                      {r.is_hidden ? <><Eye className="h-3 w-3"/> Mostrar</> : <><EyeOff className="h-3 w-3"/> Ocultar</>}
                    </button>
                    <button onClick={() => remove(r.id)} className="px-2.5 py-1 rounded-md text-xs border border-red-400/40 text-red-400 hover:bg-red-400/10 inline-flex items-center gap-1">
                      <Trash2 className="h-3 w-3"/> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-mono">{icon}{label}</div>
      <p className="text-2xl font-display font-bold mt-1">{value}</p>
    </div>
  );
}
