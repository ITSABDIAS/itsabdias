import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RankBadge, topRank } from "@/components/RankBadge";
import { useUserRoles } from "@/hooks/useUserRoles";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Comunidad — ItsaBDias" },
      { name: "description", content: "Comparte, comenta y conecta con la comunidad gamer y tecnológica." },
    ],
  }),
  component: Community,
});

type Profile = { id: string; username: string; avatar_url: string | null };
type Comment = { id: string; user_id: string; content: string; created_at: string; profile?: Profile };
type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
  likes_count: number;
  liked_by_me: boolean;
  comments: Comment[];
  showComments: boolean;
};

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
};

function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("id, user_id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const ids = (postsData ?? []).map((p) => p.id);
    const userIds = Array.from(new Set((postsData ?? []).map((p) => p.user_id)));

    const [{ data: profilesData }, { data: likesData }, { data: commentsData }] = await Promise.all([
      supabase.from("profiles").select("id, username, avatar_url").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("likes").select("post_id, user_id").in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("comments").select("id, post_id, user_id, content, created_at").in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).order("created_at", { ascending: true }),
    ]);

    const profMap = new Map<string, Profile>((profilesData ?? []).map((p) => [p.id, p]));
    const commentUserIds = Array.from(new Set((commentsData ?? []).map((c) => c.user_id))).filter((u) => !profMap.has(u));
    if (commentUserIds.length) {
      const { data: extra } = await supabase.from("profiles").select("id, username, avatar_url").in("id", commentUserIds);
      (extra ?? []).forEach((p) => profMap.set(p.id, p));
    }

    setPosts(
      (postsData ?? []).map((p) => {
        const postLikes = (likesData ?? []).filter((l) => l.post_id === p.id);
        const postComments = (commentsData ?? [])
          .filter((c) => c.post_id === p.id)
          .map((c) => ({ ...c, profile: profMap.get(c.user_id) }));
        return {
          ...p,
          profile: profMap.get(p.user_id),
          likes_count: postLikes.length,
          liked_by_me: !!user && postLikes.some((l) => l.user_id === user.id),
          comments: postComments,
          showComments: false,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("community")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!text.trim()) return;
    const { error } = await supabase.from("posts").insert({ user_id: user.id, content: text.trim() });
    if (error) return toast.error(error.message);
    setText("");
  };

  const toggleLike = async (p: Post) => {
    if (!user) return toast.error("Inicia sesión para dar like");
    if (p.liked_by_me) {
      await supabase.from("likes").delete().eq("post_id", p.id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: p.id, user_id: user.id });
    }
  };

  const deletePost = async (p: Post) => {
    if (!user || p.user_id !== user.id) return;
    if (!confirm("¿Borrar esta publicación?")) return;
    await supabase.from("posts").delete().eq("id", p.id);
  };

  const submitComment = async (p: Post) => {
    if (!user) return toast.error("Inicia sesión para comentar");
    const content = (commentDraft[p.id] ?? "").trim();
    if (!content) return;
    const { error } = await supabase.from("comments").insert({ post_id: p.id, user_id: user.id, content });
    if (error) return toast.error(error.message);
    setCommentDraft((d) => ({ ...d, [p.id]: "" }));
  };

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// social.feed" title="Comunidad ItsaBDias" subtitle="Tu voz, tus ideas, tu tribu tech." />

        <div className="mx-auto max-w-3xl space-y-6">
          {/* Composer */}
          {user ? (
            <form onSubmit={post} className="glass rounded-2xl p-5 neon-border">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-neon flex items-center justify-center font-bold text-primary-foreground shrink-0">
                  {(user.email ?? "Y")[0].toUpperCase()}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="¿Qué estás creando hoy?"
                  className="flex-1 bg-transparent border-0 focus:outline-none resize-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex justify-end mt-3">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground font-bold text-sm shadow-neon-purple">
                  <Send className="h-3.5 w-3.5" /> Publicar
                </button>
              </div>
            </form>
          ) : (
            <div className="glass rounded-2xl p-6 neon-border text-center">
              <p className="text-muted-foreground mb-4">Inicia sesión para publicar, comentar y dar likes.</p>
              <Link to="/auth" className="inline-flex px-5 py-2.5 rounded-md bg-gradient-neon text-primary-foreground font-bold shadow-neon-purple">
                Entrar / Registrarse
              </Link>
            </div>
          )}

          {loading && <p className="text-center text-muted-foreground">Cargando feed...</p>}
          {!loading && posts.length === 0 && (
            <p className="text-center text-muted-foreground">Sé el primero en publicar algo.</p>
          )}

          {posts.map((p) => (
            <article key={p.id} className="glass rounded-2xl p-5 hover:border-neon-blue/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-neon flex items-center justify-center font-bold text-primary-foreground uppercase">
                  {(p.profile?.username ?? "?")[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{p.profile?.username ?? "anónimo"}</div>
                  <div className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</div>
                </div>
                {user?.id === p.user_id && (
                  <button onClick={() => deletePost(p)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-4 text-foreground/90 whitespace-pre-wrap">{p.content}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <button
                  onClick={() => toggleLike(p)}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    p.liked_by_me ? "text-neon-purple" : "hover:text-foreground"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${p.liked_by_me ? "fill-current" : ""}`} /> {p.likes_count}
                </button>
                <button
                  onClick={() => setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, showComments: !x.showComments } : x)))}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> {p.comments.length} Comentar
                </button>
              </div>

              {p.showComments && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {p.comments.map((c) => (
                    <div key={c.id} className="flex gap-2 text-sm">
                      <div className="h-7 w-7 rounded-full bg-gradient-neon flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {(c.profile?.username ?? "?")[0]}
                      </div>
                      <div className="flex-1 bg-input/30 rounded-lg px-3 py-2">
                        <div className="text-xs font-semibold">{c.profile?.username ?? "anónimo"} · <span className="text-muted-foreground font-normal">{timeAgo(c.created_at)}</span></div>
                        <div className="mt-0.5 text-foreground/90 whitespace-pre-wrap">{c.content}</div>
                      </div>
                    </div>
                  ))}
                  {user && (
                    <div className="flex gap-2">
                      <input
                        value={commentDraft[p.id] ?? ""}
                        onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submitComment(p))}
                        maxLength={1000}
                        placeholder="Escribe un comentario..."
                        className="flex-1 bg-input/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                      />
                      <button onClick={() => submitComment(p)} className="px-3 rounded-md bg-gradient-neon text-primary-foreground">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
