import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { RankBadge, topRank, type RankSlug } from "@/components/RankBadge";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Plus,
  X,
  Upload,
  ExternalLink,
  Sparkles,
  Trash2,
  Loader2,
  ImageIcon,
} from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Proyectos — ItsaBDias" },
      {
        name: "description",
        content:
          "Explora y publica proyectos en ItsaBDias: imágenes, tecnologías, progreso, likes y comentarios.",
      },
    ],
  }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  technologies: string[];
  progress: number;
  link_url: string | null;
  status: string;
  created_at: string;
};
type Profile = { id: string; username: string; avatar_url: string | null };

const CATEGORIES = ["Programación", "IA", "Roblox", "PCs", "Software", "Tecnología", "Otro"];
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  in_progress: { label: "En progreso", color: "text-neon-blue border-neon-blue/40 bg-neon-blue/10" },
  completed: { label: "Completado", color: "text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10" },
  paused: { label: "En pausa", color: "text-muted-foreground border-border bg-secondary/40" },
};

function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Todos");

  const userIds = useMemo(() => Array.from(new Set(projects.map((p) => p.user_id))), [projects]);
  const rolesMap = useUserRoles(userIds);

  const load = async () => {
    setLoading(true);
    const { data: ps } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (ps ?? []) as Project[];
    setProjects(list);

    const ids = Array.from(new Set(list.map((p) => p.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p));
      setProfiles(map);
    }

    const pids = list.map((p) => p.id);
    if (pids.length) {
      const { data: lk } = await supabase
        .from("project_likes")
        .select("project_id, user_id")
        .in("project_id", pids);
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (lk ?? []).forEach((r: any) => {
        counts[r.project_id] = (counts[r.project_id] ?? 0) + 1;
        if (user && r.user_id === user.id) mine.add(r.project_id);
      });
      setLikes(counts);
      setMyLikes(mine);

      const { data: cm } = await supabase
        .from("project_comments")
        .select("project_id")
        .in("project_id", pids);
      const cc: Record<string, number> = {};
      (cm ?? []).forEach((r: any) => (cc[r.project_id] = (cc[r.project_id] ?? 0) + 1));
      setCommentsCount(cc);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleLike = async (p: Project) => {
    if (!user) return toast.error("Inicia sesión para dar like");
    const liked = myLikes.has(p.id);
    if (liked) {
      await supabase.from("project_likes").delete().eq("project_id", p.id).eq("user_id", user.id);
      setMyLikes((s) => {
        const n = new Set(s);
        n.delete(p.id);
        return n;
      });
      setLikes((l) => ({ ...l, [p.id]: Math.max(0, (l[p.id] ?? 1) - 1) }));
    } else {
      await supabase.from("project_likes").insert({ project_id: p.id, user_id: user.id });
      setMyLikes((s) => new Set(s).add(p.id));
      setLikes((l) => ({ ...l, [p.id]: (l[p.id] ?? 0) + 1 }));
    }
  };

  const deleteProject = async (p: Project) => {
    if (!confirm("¿Eliminar este proyecto?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Proyecto eliminado");
    setOpenProject(null);
    load();
  };

  const filtered =
    filter === "Todos" ? projects : projects.filter((p) => p.category === filter);

  return (
    <PageShell>
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 h-[400px] w-[700px] rounded-full bg-neon-purple/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-neon-cyan/10 blur-[100px]" />
        </div>

        <SectionTitle
          eyebrow="// builds.gallery"
          title="Proyectos de la comunidad"
          subtitle="Comparte tus creaciones, recibe likes y comentarios. Donde las ideas se compilan."
        />

        {/* Toolbar */}
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {["Todos", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-all ${
                  filter === c
                    ? "bg-neon-blue/20 border-neon-blue text-neon-blue shadow-neon-blue"
                    : "bg-secondary/30 border-border text-muted-foreground hover:border-neon-blue/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => (user ? setShowForm(true) : toast.error("Inicia sesión primero"))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground font-semibold text-sm hover:shadow-neon-purple transition-shadow"
          >
            <Plus className="h-4 w-4" /> Nuevo proyecto
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-16 glass rounded-2xl border border-border">
            <Sparkles className="h-10 w-10 text-neon-cyan mx-auto mb-3" />
            <p className="font-semibold">Aún no hay proyectos aquí</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sé el primero en publicar tu creación.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => {
              const prof = profiles[p.user_id];
              const top = topRank(rolesMap.get(p.user_id));
              const status = STATUS_LABEL[p.status] ?? STATUS_LABEL.in_progress;
              return (
                <article
                  key={p.id}
                  onClick={() => setOpenProject(p)}
                  className="group relative cursor-pointer rounded-2xl bg-gradient-card border border-border hover:border-neon-blue/60 hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-neon-blue/10 via-transparent to-neon-purple/10 pointer-events-none" />

                  {/* Image */}
                  <div className="relative aspect-video bg-secondary/40 overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest border ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-background/70 backdrop-blur border border-border">
                      {p.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="relative p-4 flex flex-col flex-1">
                    <h3 className="font-display font-bold text-base line-clamp-1">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {p.description}
                    </p>

                    {/* Tech */}
                    {p.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.technologies.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 font-mono"
                          >
                            {t}
                          </span>
                        ))}
                        {p.technologies.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground font-mono">
                            +{p.technologies.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                        <span>PROGRESO</span>
                        <span>{p.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan transition-all"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {prof?.avatar_url ? (
                          <img
                            src={prof.avatar_url}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gradient-neon" />
                        )}
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-semibold truncate">
                            {prof?.username ?? "anon"}
                          </span>
                          {top && <RankBadge slug={top as RankSlug} size="sm" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(p);
                          }}
                          className={`inline-flex items-center gap-1 hover:text-[#ff4d6d] transition-colors ${
                            myLikes.has(p.id) ? "text-[#ff4d6d]" : ""
                          }`}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${myLikes.has(p.id) ? "fill-current" : ""}`}
                          />
                          {likes[p.id] ?? 0}
                        </button>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {commentsCount[p.id] ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showForm && user && (
        <ProjectForm
          userId={user.id}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {openProject && (
        <ProjectDetail
          project={openProject}
          profile={profiles[openProject.user_id]}
          rolesMap={rolesMap}
          currentUserId={user?.id ?? null}
          onClose={() => setOpenProject(null)}
          onDelete={() => deleteProject(openProject)}
        />
      )}
    </PageShell>
  );
}

/* ───────────────────────── Create form ───────────────────────── */

function ProjectForm({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tech, setTech] = useState("");
  const [progress, setProgress] = useState(20);
  const [status, setStatus] = useState("in_progress");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Imagen máx 5MB");
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return toast.error("Título y descripción requeridos");
    setBusy(true);

    let image_url: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("project-images")
        .upload(path, imageFile, { cacheControl: "3600", upsert: false });
      if (upErr) {
        setBusy(false);
        return toast.error(`Error subiendo imagen: ${upErr.message}`);
      }
      const { data: pub } = supabase.storage.from("project-images").getPublicUrl(path);
      image_url = pub.publicUrl;
    }

    const technologies = tech
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);

    const { error } = await supabase.from("projects").insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      technologies,
      progress,
      status,
      image_url,
      link_url: linkUrl.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Proyecto publicado ✨");
    // Trigger rank check (e.g. Developer at 5 projects)
    checkRankUnlocksNow(userId);
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="Nuevo proyecto">
      <form onSubmit={submit} className="space-y-4">
        {/* Image upload */}
        <div>
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Imagen
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="mt-1 cursor-pointer aspect-video rounded-lg border-2 border-dashed border-border hover:border-neon-blue/60 bg-secondary/30 overflow-hidden flex items-center justify-center"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs">Click para subir (máx 5MB)</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
        </div>

        <Field label="Título">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm"
            placeholder="Mi proyecto épico"
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm resize-none"
            placeholder="¿De qué trata tu proyecto?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="in_progress">En progreso</option>
              <option value="completed">Completado</option>
              <option value="paused">En pausa</option>
            </select>
          </Field>
        </div>

        <Field label="Tecnologías (separadas por coma)">
          <input
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm"
            placeholder="React, TypeScript, Supabase"
          />
        </Field>

        <Field label={`Progreso: ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-neon-blue"
          />
        </Field>

        <Field label="Enlace (opcional)">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            type="url"
            className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-gradient-neon text-primary-foreground font-semibold text-sm hover:shadow-neon-purple disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Publicando..." : "Publicar proyecto"}
        </button>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/* ───────────────────────── Detail modal ───────────────────────── */

type Comment = { id: string; user_id: string; content: string; created_at: string };

function ProjectDetail({
  project,
  profile,
  rolesMap,
  currentUserId,
  onClose,
  onDelete,
}: {
  project: Project;
  profile?: Profile;
  rolesMap: Map<string, RankSlug[]>;
  currentUserId: string | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commenters, setCommenters] = useState<Record<string, Profile>>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const top = topRank(rolesMap.get(project.user_id));
  const status = STATUS_LABEL[project.status] ?? STATUS_LABEL.in_progress;

  const loadComments = async () => {
    const { data } = await supabase
      .from("project_comments")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Comment[];
    setComments(list);
    const ids = Array.from(new Set(list.map((c) => c.user_id)));
    if (ids.length) {
      const { data: pf } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (pf ?? []).forEach((p: any) => (map[p.id] = p));
      setCommenters(map);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return toast.error("Inicia sesión");
    if (!draft.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("project_comments")
      .insert({ project_id: project.id, user_id: currentUserId, content: draft.trim() });
    setSending(false);
    if (error) return toast.error(error.message);
    setDraft("");
    loadComments();
  };

  return (
    <Modal onClose={onClose} title={project.title} wide>
      {project.image_url && (
        <img
          src={project.image_url}
          alt={project.title}
          className="w-full aspect-video object-cover rounded-lg border border-border mb-4"
        />
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-secondary/60 border border-border">
          {project.category}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest border ${status.color}`}
        >
          {status.label}
        </span>
        {project.link_url && (
          <a
            href={project.link_url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-purple"
          >
            Visitar <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
        {project.description}
      </p>

      {project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.technologies.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 font-mono"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1">
          <span>PROGRESO</span>
          <span>{project.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pb-4 border-b border-border">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-neon" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{profile?.username ?? "anon"}</span>
            {top && <RankBadge slug={top} size="sm" />}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
        {currentUserId === project.user_id && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:border-destructive/60 text-destructive text-xs"
          >
            <Trash2 className="h-3 w-3" /> Eliminar
          </button>
        )}
      </div>

      {/* Comments */}
      <div className="mt-4">
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          // comentarios ({comments.length})
        </h4>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground">Sé el primero en comentar.</p>
          )}
          {comments.map((c) => {
            const cp = commenters[c.user_id];
            const cTop = topRank(rolesMap.get(c.user_id));
            return (
              <div key={c.id} className="flex gap-2">
                {cp?.avatar_url ? (
                  <img
                    src={cp.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-neon shrink-0" />
                )}
                <div className="flex-1 min-w-0 rounded-md bg-secondary/40 border border-border px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold">{cp?.username ?? "anon"}</span>
                    {cTop && <RankBadge slug={cTop} size="sm" />}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={send} className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder={currentUserId ? "Escribe un comentario..." : "Inicia sesión para comentar"}
            disabled={!currentUserId || sending}
            className="flex-1 bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!currentUserId || sending || !draft.trim()}
            className="px-4 rounded-md bg-gradient-neon text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Modal ───────────────────────── */

function Modal({
  onClose,
  title,
  children,
  wide,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} my-4 glass rounded-2xl border border-border shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-border bg-background/80 backdrop-blur rounded-t-2xl">
          <h3 className="font-display font-bold text-lg text-gradient-neon truncate pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary/60"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
