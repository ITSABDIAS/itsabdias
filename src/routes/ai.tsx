import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import { BrainCircuit, Sparkles, Zap, Bot, Send, Loader2 } from "lucide-react";
import { aiChat } from "@/lib/ai.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Inteligencia Artificial — ItsaBDias" },
      { name: "description", content: "Chat IA real con Gemini, herramientas y noticias futuristas en ItsaBDias." },
    ],
  }),
  component: AI,
});

const tools = [
  { name: "ChatGPT", desc: "Asistente conversacional de OpenAI." },
  { name: "Midjourney", desc: "Generación de imágenes con IA." },
  { name: "Gemini", desc: "IA multimodal de Google." },
  { name: "Cursor", desc: "Editor de código potenciado por IA." },
  { name: "Suno", desc: "Crea música original con IA." },
  { name: "Runway", desc: "Vídeo generativo con IA." },
];

const news = [
  { tag: "MODELOS", title: "GPT-5.5 redefine el razonamiento", date: "Hoy" },
  { tag: "ROBÓTICA", title: "Humanoides aprendiendo en tiempo real", date: "Ayer" },
  { tag: "IA + GAMING", title: "NPCs con LLMs en mundos de Roblox", date: "Esta semana" },
];

type Msg = { role: "user" | "assistant"; content: string };

function AI() {
  const { user } = useAuth();
  const callAi = useServerFn(aiChat);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hola, soy **NEXUS**, el asistente neural de ItsaBDias. ¿En qué quieres construir el futuro hoy?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    if (!user) {
      toast.error("Inicia sesión para chatear con NEXUS");
      return;
    }
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await callAi({ data: { messages: next.slice(-20) } });
      setMsgs((m) => [...m, { role: "assistant", content: res.content || "..." }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <section className="py-20 px-6">
        <SectionTitle eyebrow="// ai.core" title="Inteligencia Artificial" subtitle="El motor del próximo salto humano." />

        <div className="mx-auto max-w-5xl glass rounded-2xl p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-neon-purple/30 rounded-full blur-3xl" />
          <div className="relative grid md:grid-cols-[auto_1fr] gap-6 items-start">
            <BrainCircuit className="h-16 w-16 text-neon-cyan animate-glow-pulse" />
            <div>
              <h3 className="text-2xl font-bold">¿Qué es la IA?</h3>
              <p className="mt-3 text-muted-foreground">
                La <span className="text-foreground font-semibold">Inteligencia Artificial</span> son
                sistemas capaces de aprender, razonar y crear. Hoy compone música, escribe código,
                diseña mundos y conversa contigo. En esta sección exploramos cómo usarla para
                <span className="text-neon-cyan"> amplificar tu creatividad</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Herramientas útiles
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t) => (
              <div key={t.name} className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-purple/60 hover:-translate-y-1 transition-all">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg">{t.name}</h4>
                  <Zap className="h-4 w-4 text-neon-cyan group-hover:scale-125 transition-transform" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-2xl font-bold mb-6">Noticias del futuro</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {news.map((n) => (
              <article key={n.title} className="glass rounded-xl p-6 neon-border">
                <span className="text-xs font-mono text-neon-cyan tracking-widest">{n.tag}</span>
                <h4 className="mt-2 font-bold text-lg">{n.title}</h4>
                <p className="mt-3 text-xs text-muted-foreground">{n.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Chat */}
      <section id="chat" className="py-16 px-6">
        <div className="mx-auto max-w-3xl glass rounded-2xl p-6 neon-border">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-neon-cyan animate-glow-pulse" />
            <h3 className="font-display font-bold text-xl">NEXUS · Chat IA</h3>
            <span className="ml-auto text-xs font-mono text-muted-foreground">gemini · 2.5 pro</span>
          </div>
          <div ref={scrollRef} className="space-y-3 max-h-[28rem] overflow-y-auto pr-2 mb-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm prose prose-sm prose-invert prose-pre:bg-black/60 prose-pre:border prose-pre:border-neon-cyan/20 prose-code:text-neon-cyan ${
                  m.role === "user"
                    ? "bg-gradient-neon text-primary-foreground rounded-br-sm"
                    : "glass border border-neon-cyan/30 rounded-bl-sm"
                }`}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass border border-neon-cyan/30 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
                  NEXUS está pensando...
                </div>
              </div>
            )}
          </div>
          <form onSubmit={send} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "Pregúntale algo a NEXUS..." : "Inicia sesión para chatear..."}
              disabled={loading || !user}
              className="flex-1 bg-input/40 border border-border rounded-md px-4 py-2.5 focus:outline-none focus:border-neon-blue focus:shadow-neon-blue transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !user || !input.trim()}
              className="px-4 rounded-md bg-gradient-neon text-primary-foreground shadow-neon-purple disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          {!user && (
            <p className="mt-3 text-xs text-muted-foreground text-center">
              NEXUS requiere cuenta para evitar abuso y rastrear uso. Es gratis.
            </p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
