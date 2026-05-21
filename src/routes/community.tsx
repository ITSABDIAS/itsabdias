import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { Heart, MessageCircle, Send } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Comunidad — ItsaBDias" },
      { name: "description", content: "Comparte, comenta y conecta con la comunidad gamer y tecnológica." },
    ],
  }),
  component: Community,
});

type Post = { id: number; user: string; avatar: string; time: string; text: string; likes: number; liked: boolean };

const initial: Post[] = [
  { id: 1, user: "NeonHacker", avatar: "NH", time: "hace 10m", text: "Acabo de terminar mi primer script de pathfinding en Roblox. ¡Increíble cómo cobran vida los NPCs!", likes: 24, liked: false },
  { id: 2, user: "PixelQueen", avatar: "PQ", time: "hace 1h", text: "Alguien tiene recursos buenos para aprender Unity 2D desde cero?", likes: 12, liked: false },
  { id: 3, user: "CircuitMage", avatar: "CM", time: "hace 3h", text: "Mi build con RGB y water cooling personalizado ya está corriendo a 4.9GHz estable 🔥", likes: 58, liked: true },
];

function Community() {
  const [posts, setPosts] = useState(initial);
  const [text, setText] = useState("");

  const toggleLike = (id: number) =>
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)));

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosts((p) => [
      { id: Date.now(), user: "You", avatar: "YO", time: "ahora", text: text.trim(), likes: 0, liked: false },
      ...p,
    ]);
    setText("");
  };

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// social.feed" title="Comunidad ItsaBDias" subtitle="Tu voz, tus ideas, tu tribu tech." />

        <div className="mx-auto max-w-3xl space-y-6">
          {/* Composer */}
          <form onSubmit={post} className="glass rounded-2xl p-5 neon-border">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-neon flex items-center justify-center font-bold text-primary-foreground shrink-0">
                YO
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
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

          {/* Feed */}
          {posts.map((p) => (
            <article key={p.id} className="glass rounded-2xl p-5 hover:border-neon-blue/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-neon flex items-center justify-center font-bold text-primary-foreground">
                  {p.avatar}
                </div>
                <div>
                  <div className="font-bold">{p.user}</div>
                  <div className="text-xs text-muted-foreground">{p.time}</div>
                </div>
              </div>
              <p className="mt-4 text-foreground/90">{p.text}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <button
                  onClick={() => toggleLike(p.id)}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    p.liked ? "text-neon-purple" : "hover:text-foreground"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${p.liked ? "fill-current" : ""}`} /> {p.likes}
                </button>
                <button className="inline-flex items-center gap-1.5 hover:text-foreground">
                  <MessageCircle className="h-4 w-4" /> Comentar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
