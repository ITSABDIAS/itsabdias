import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TutorialContent } from "@/components/TutorialContent";
import { TutorialCard, type TutorialCardData } from "@/components/TutorialCard";
import { levelMeta, categoryLabel } from "@/lib/tutorials";
import { toast } from "sonner";
import {
  Heart,
  Bookmark,
  Share2,
  Sparkles,
  Clock,
  Eye,
  ArrowLeft,
  MessageCircle,
  Send,
  Trash2,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/tutorial/$category/$slug")({
  component: TutorialPage,
});

type Tutorial = TutorialCardData & { content: string; author_id: string | null; created_at: string; tags: string[] };

function TutorialPage() {
  const { category, slug } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [t, setT] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [related, setRelated] = useState<TutorialCardData[]>([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("category", category)
        .eq("slug", slug)
        .maybeSingle();
      if (cancel) return;
      if (error || !data) { setLoading(false); return; }
      setT(data as any);
      setLoading(false);
      supabase.rpc("increment_tutorial_view", { _id: data.id });

      if (data.author_id) {
        supabase.from("profiles").select("username").eq("id", data.author_id).maybeSingle().then(({ data: p }) => {
          if (!cancel) setAuthorName(p?.username ?? null);
        });
      }
      supabase
        .from("tutorials")
        .select("id, category, slug, title, description, level, read_minutes, tags, is_ai_generated, is_featured, views_count, likes_count, comments_count, saves_count")
        .eq("category", category).eq("is_hidden", false).neq("id", data.id)
        .order("views_count", { ascending: false }).limit(3)
        .then(({ data: r }) => { if (!cancel) setRelated((r ?? []) as any); });
      loadComments(data.id);
      if (user) {
        supabase.from("tutorial_likes").select("tutorial_id").eq("tutorial_id", data.id).eq("user_id", user.id).maybeSingle().then(({ data: l }) => { if (!cancel) setLiked(!!l); });
        supabase.from("tutorial_saves").select("tutorial_id").eq("tutorial_id", data.id).eq("user_id", user.id).maybeSingle().then(({ data: s }) => { if (!cancel) setSaved(!!s); });
      }
    })();
    return () => { cancel = true; };
  }, [category, slug, user?.id]);

  const loadComments = async (id: string) => {
    const { data } = await supabase
      .from("tutorial_comments")
      .select("id, user_id, content, created_at")
      .eq("tutorial_id", id).order("created_at", { ascending: false }).limit(50);
    const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
      : { data: [] as any[] };
    const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setComments((data ?? []).map((c) => ({ ...c, profile: map.get(c.user_id) })));
  };

  const toggleLike = async () => {
    if (!user) return nav({ to: "/auth" });
    if (!t) return;
    if (liked) {
      await supabase.from("tutorial_likes").delete().eq("tutorial_id", t.id).eq("user_id", user.id);
      setLiked(false); setT({ ...t, likes_count: Math.max(0, t.likes_count - 1) });
    } else {
      const { error } = await supabase.from("tutorial_likes").insert({ tutorial_id: t.id, user_id: user.id });
      if (error) return toast.error(error.message);
      setLiked(true); setT({ ...t, likes_count: t.likes_count + 1 });
    }
  };
  const toggleSave = async () => {
    if (!user) return nav({ to: "/auth" });
    if (!t) return;
    if (saved) {
      await supabase.from("tutorial_saves").delete().eq("tutorial_id", t.id).eq("user_id", user.id);
      setSaved(false); setT({ ...t, saves_count: Math.max(0, t.saves_count - 1) });
      toast.success("Quitado de guardados");
    } else {
      const { error } = await supabase.from("tutorial_saves").insert({ tutorial_id: t.id, user_id: user.id });
      if (error) return toast.error(error.message);
      setSaved(true); setT({ ...t, saves_count: t.saves_count + 1 });
      toast.success("Guardado para después");
    }
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: t?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }
    } catch {}
  };
  const submitComment = async () => {
    if (!user) return nav({ to: "/auth" });
    if (!t || !newComment.trim()) return;
    const { error } = await supabase.from("tutorial_comments").insert({ tutorial_id: t.id, user_id: user.id, content: newComment.trim() });
    if (error) return toast.error(error.message);
    setNewComment("");
    loadComments(t.id);
  };
  const deleteComment = async (id: string) => {
    await supabase.from("tutorial_comments").delete().eq("id", id);
    if (t) loadComments(t.id);
  };

  if (loading) return <PageShell><section className="py-32 text-center text-muted-foreground">Cargando...</section></PageShell>;
  if (!t) return (
    <PageShell>
      <section className="py-32 text-center">
        <p className="text-muted-foreground">Tutorial no encontrado.</p>
        <Link to="/tutoriales" className="mt-4 inline-flex px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold">Ver todos</Link>
      </section>
    </PageShell>
  );

  const lv = levelMeta(t.level);

  return (
    <PageShell>
      <article className="py-8 sm:py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link to="/tutoriales" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-cyan mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a tutoriales
          </Link>

          <div className="flex flex-wrap gap-2 mb-3">
            <Link to="/tutoriales" className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan uppercase font-mono">
              {categoryLabel(t.category)}
            </Link>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase ${lv.color}`}>{lv.label}</span>
            {t.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan inline-flex items-center gap-1"><Star className="h-3 w-3"/> Destacado</span>}
            {t.is_ai_generated && <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-purple/40 bg-neon-purple/10 text-neon-purple inline-flex items-center gap-1"><Sparkles className="h-3 w-3"/> Generado por NEXUS IA</span>}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gradient-neon">{t.title}</h1>
          <p className="mt-3 text-base text-muted-foreground">{t.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3"/> {t.read_minutes} min de lectura</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3"/> {t.views_count} vistas</span>
            {authorName && <Link to="/u/$username" params={{ username: authorName }} className="text-neon-cyan hover:underline">por @{authorName}</Link>}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={toggleLike} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs ${liked ? "border-neon-purple bg-neon-purple/10 text-neon-purple" : "border-border hover:border-neon-purple/60"}`}>
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}/> {t.likes_count}
            </button>
            <button onClick={toggleSave} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs ${saved ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-border hover:border-neon-cyan/60"}`}>
              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`}/> {saved ? "Guardado" : "Guardar"}
            </button>
            <button onClick={share} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:border-neon-blue/60 text-xs">
              <Share2 className="h-3.5 w-3.5"/> Compartir
            </button>
            <Link to="/ai" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-neon text-primary-foreground text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5"/> Preguntar a NEXUS
            </Link>
          </div>

          {t.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.tags.map((tg) => (
                <span key={tg} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 border border-border text-muted-foreground">#{tg}</span>
              ))}
            </div>
          )}

          <div className="mt-8 glass rounded-2xl p-5 sm:p-8 neon-border">
            <TutorialContent content={t.content} />
          </div>

          {/* Comments */}
          <div className="mt-10">
            <h3 className="font-display text-xl font-bold flex items-center gap-2 mb-4"><MessageCircle className="h-5 w-5 text-neon-cyan"/> Comentarios ({t.comments_count})</h3>
            {user ? (
              <div className="flex gap-2 mb-4">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Deja un comentario..." className="flex-1 bg-input/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon-blue" />
                <button onClick={submitComment} className="px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-semibold inline-flex items-center gap-1"><Send className="h-3.5 w-3.5"/> Enviar</button>
              </div>
            ) : (
              <Link to="/auth" className="text-sm text-neon-cyan hover:underline">Inicia sesión para comentar</Link>
            )}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="glass rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    {c.profile?.username ? (
                      <Link to="/u/$username" params={{ username: c.profile.username }} className="text-xs text-neon-cyan font-semibold">@{c.profile.username}</Link>
                    ) : <span className="text-xs text-muted-foreground">Anónimo</span>}
                    {user && c.user_id === user.id && (
                      <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5"/></button>
                    )}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>}
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-12">
              <h3 className="font-display text-xl font-bold mb-4">Tutoriales relacionados</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.map((r) => <TutorialCard key={r.id} t={r} />)}
              </div>
            </div>
          )}
        </div>
      </article>
    </PageShell>
  );
}
