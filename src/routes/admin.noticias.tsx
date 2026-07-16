import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Shield, Newspaper, Star, EyeOff, Eye, Trash2, Search, Plus, Pencil, Clock, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/admin/noticias")({
  head: () => ({ meta: [{ title: "Admin · Noticias — ItsaBDias" }] }),
  component: AdminNoticiasPage,
});

type News = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_url: string | null;
  category: string;
  tags: string[];
  is_featured: boolean;
  is_hidden: boolean;
  published_at: string;
  scheduled_at: string | null;
  views_count: number;
  created_at: string;
};

const CATEGORIES = ["general", "actualidad", "tecnologia", "programacion", "hardware", "ia", "gaming", "comunidad"];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || `noticia-${Date.now()}`;
}

function AdminNoticiasPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<News[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [editing, setEditing] = useState<News | null>(null);
  const [creating, setCreating] = useState(false);

  const empty = useMemo(() => ({
    id: "", slug: "", title: "", summary: "", content: "", cover_url: "",
    category: "general", tags: [] as string[], is_featured: false, is_hidden: false,
    published_at: new Date().toISOString().slice(0, 16),
    scheduled_at: "" as string | "",
  }), []);
  const [form, setForm] = useState<any>(empty);

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
    const { data, error } = await supabase.from("news")
      .select("*").order("published_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data ?? []) as any);
  };

  const filtered = useMemo(() => {
    let x = rows;
    if (cat !== "all") x = x.filter(r => r.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      x = x.filter(r => r.title.toLowerCase().includes(s) || r.summary.toLowerCase().includes(s));
    }
    return x;
  }, [rows, cat, q]);

  const startCreate = () => { setForm({ ...empty }); setEditing(null); setCreating(true); };
  const startEdit = (n: News) => {
    setEditing(n); setCreating(true);
    setForm({
      ...n,
      cover_url: n.cover_url ?? "",
      tags: n.tags ?? [],
      published_at: new Date(n.published_at).toISOString().slice(0, 16),
      scheduled_at: n.scheduled_at ? new Date(n.scheduled_at).toISOString().slice(0, 16) : "",
    });
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      return toast.error("Título, resumen y contenido son obligatorios");
    }
    const tagsArr = Array.isArray(form.tags) ? form.tags : String(form.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);
    const payload: any = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content,
      cover_url: form.cover_url?.trim() || null,
      category: form.category,
      tags: tagsArr,
      is_featured: !!form.is_featured,
      is_hidden: !!form.is_hidden,
      published_at: new Date(form.published_at).toISOString(),
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    };
    if (editing) {
      const { error } = await supabase.from("news").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Noticia actualizada");
    } else {
      payload.slug = slugify(form.title);
      payload.author_id = user.id;
      const { error } = await supabase.from("news").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Noticia publicada");
    }
    setCreating(false); setEditing(null); setForm(empty); load();
  };

  const toggle = async (id: string, field: "is_featured" | "is_hidden", value: boolean) => {
    const patch = field === "is_featured" ? { is_featured: value } : { is_hidden: value };
    const { error } = await supabase.from("news").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar noticia?")) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada"); load();
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
        <SectionTitle eyebrow="// admin.noticias" title="Gestión de Noticias" subtitle="Crea, edita y programa noticias globales." />
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <Link to="/admin" className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">← Dashboard</Link>
            <Link to="/noticias" className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-neon-cyan/60">Ver noticias públicas</Link>
            <button onClick={startCreate} className="ml-auto px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold inline-flex items-center gap-2">
              <Plus className="h-4 w-4"/> Nueva noticia
            </button>
          </div>

          {creating && (
            <div className="glass rounded-2xl p-5 mb-6 neon-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-neon-cyan"/>{editing ? "Editar noticia" : "Nueva noticia"}
                </h3>
                <button onClick={() => { setCreating(false); setEditing(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cerrar</button>
              </div>
              <div className="grid gap-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5"/> Publicado
                    <input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} className="flex-1 bg-input/40 border border-border rounded-md px-2 py-1.5 text-xs"/>
                  </label>
                  <label className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5"/> Programado
                    <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="flex-1 bg-input/40 border border-border rounded-md px-2 py-1.5 text-xs"/>
                  </label>
                </div>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
                <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Resumen breve (aparece en la lista)" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
                <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="URL de imagen de portada (opcional)" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
                <input value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean) })} placeholder="Tags separados por coma" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm"/>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} placeholder="Contenido en Markdown" className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm font-mono"/>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}/> Destacar</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.is_hidden} onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })}/> Ocultar</label>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setCreating(false); setEditing(null); }} className="px-3 py-2 rounded-md border border-border text-sm">Cancelar</button>
                  <button onClick={save} className="px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">{editing ? "Guardar cambios" : "Publicar"}</button>
                </div>
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 bg-input/40 border border-border rounded-md text-sm"/>
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-input/40 border border-border rounded-md px-3 py-2 text-sm">
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-muted-foreground text-sm">Sin noticias.</p>}
            {filtered.map(n => {
              const scheduled = n.scheduled_at && new Date(n.scheduled_at) > new Date();
              return (
                <div key={n.id} className="glass rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan uppercase font-mono">{n.category}</span>
                        {n.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 inline-flex items-center gap-1"><Star className="h-3 w-3"/> Destacada</span>}
                        {n.is_hidden && <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-400/40 bg-red-400/10 text-red-400">Oculta</span>}
                        {scheduled && <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-400/40 bg-blue-400/10 text-blue-400 inline-flex items-center gap-1"><CalendarClock className="h-3 w-3"/> Programada</span>}
                      </div>
                      <Link to="/noticia/$slug" params={{ slug: n.slug }} className="font-bold hover:text-neon-cyan">{n.title}</Link>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.summary}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(n.published_at).toLocaleString()} · {n.views_count} vistas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => startEdit(n)} className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-neon-cyan/60 inline-flex items-center gap-1"><Pencil className="h-3 w-3"/> Editar</button>
                      <button onClick={() => toggle(n.id, "is_featured", !n.is_featured)} className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-yellow-400/60 inline-flex items-center gap-1"><Star className="h-3 w-3"/> {n.is_featured ? "Quitar" : "Destacar"}</button>
                      <button onClick={() => toggle(n.id, "is_hidden", !n.is_hidden)} className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-neon-cyan/60 inline-flex items-center gap-1">{n.is_hidden ? <><Eye className="h-3 w-3"/> Mostrar</> : <><EyeOff className="h-3 w-3"/> Ocultar</>}</button>
                      <button onClick={() => remove(n.id)} className="px-2.5 py-1 rounded-md text-xs border border-red-400/40 text-red-400 hover:bg-red-400/10 inline-flex items-center gap-1"><Trash2 className="h-3 w-3"/> Eliminar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
