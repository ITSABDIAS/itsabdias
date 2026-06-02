import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { PageShell } from "@/components/PageShell";
import { SectionTitle } from "@/components/SectionTitle";
import {
  BrainCircuit,
  Sparkles,
  Zap,
  Bot,
  Send,
  Loader2,
  ExternalLink,
  Code2,
  Gamepad2,
  Cpu,
  Cog,
  Rocket,
  Newspaper,
} from "lucide-react";
import { aiChat } from "@/lib/ai.functions";
import { getChatHistory, saveChatMessage, clearChatHistory } from "@/lib/chat.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Inteligencia Artificial — ItsaBDias" },
      { name: "description", content: "Chat IA real con Gemini 2.5 Pro, herramientas, noticias y el centro tecnológico de ItsaBDias." },
    ],
  }),
  component: AI,
});

const tools = [
  { name: "ChatGPT", desc: "Asistente conversacional de OpenAI.", url: "https://chat.openai.com" },
  { name: "Midjourney", desc: "Generación de imágenes con IA.", url: "https://www.midjourney.com" },
  { name: "Gemini", desc: "IA multimodal de Google.", url: "https://gemini.google.com" },
  { name: "Cursor", desc: "Editor de código potenciado por IA.", url: "https://cursor.com" },
  { name: "Suno", desc: "Crea música original con IA.", url: "https://suno.com" },
  { name: "Runway", desc: "Vídeo generativo con IA.", url: "https://runwayml.com" },
];

const news = [
  {
    tag: "IA",
    title: "GPT-5.5 redefine el razonamiento",
    date: "Hoy",
    desc: "El nuevo modelo de OpenAI marca un nuevo estándar en lógica multi-paso y agentes autónomos.",
  },
  {
    tag: "ROBÓTICA",
    title: "Humanoides aprendiendo en tiempo real",
    date: "Ayer",
    desc: "Los nuevos robots de Figure y 1X aprenden tareas viéndolas una sola vez, sin entrenamiento previo.",
  },
  {
    tag: "GAMING",
    title: "NPCs con LLMs en mundos de Roblox",
    date: "Esta semana",
    desc: "Estudios indie integran modelos pequeños para dar vida real a personajes dentro del metaverso.",
  },
  {
    tag: "HARDWARE",
    title: "GPUs neuronales dedicadas a inferencia local",
    date: "Esta semana",
    desc: "NVIDIA y AMD presentan chips diseñados solo para correr LLMs en tu PC sin conexión.",
  },
  {
    tag: "TECNOLOGÍA",
    title: "Pantallas holográficas llegan al consumidor",
    date: "Este mes",
    desc: "Los primeros displays 3D sin gafas comienzan a aparecer en laptops gamer de gama alta.",
  },
];

const suggestions = [
  { icon: Code2, label: "Programación", prompt: "Enséñame un truco avanzado de TypeScript que casi nadie conoce." },
  { icon: Gamepad2, label: "Roblox Studio", prompt: "Dame un script de Lua para Roblox Studio que haga teletransporte con animación." },
  { icon: Cpu, label: "Hardware", prompt: "Recomiéndame un PC gamer por menos de 1000 USD para 2026." },
  { icon: Rocket, label: "Tecnología", prompt: "¿Qué tendencia tecnológica explotará en los próximos 12 meses?" },
  { icon: Cog, label: "Desarrollo de Juegos", prompt: "¿Unity o Unreal en 2026 para un solo desarrollador? Argumenta." },
];

const WELCOME =
  "Hola, soy **NEXUS**, el núcleo de IA de **ItsaBDias** ⚡\n\nPuedo ayudarte con **programación**, **Roblox Studio**, **hardware**, **desarrollo de juegos** y **tecnología** en general.\n\nElige una sugerencia abajo o escríbeme directamente. ¿Por dónde empezamos?";

type Msg = { role: "user" | "assistant"; content: string };

function AI() {
  const { user } = useAuth();
  const callAi = useServerFn(aiChat);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: WELCOME }]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const submit = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!user) {
      toast.error("Inicia sesión para chatear con NEXUS");
      return;
    }
    const userMsg: Msg = { role: "user", content: text.trim() };
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

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle
          eyebrow="// ai.core"
          title="Inteligencia Artificial"
          subtitle="El centro tecnológico de ItsaBDias. Chat real, herramientas y noticias del futuro."
        />

        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-neon-purple/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <BrainCircuit className="h-12 w-12 sm:h-16 sm:w-16 text-neon-cyan animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">El motor del próximo salto humano</h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                La <span className="text-foreground font-semibold">Inteligencia Artificial</span> compone música,
                escribe código, diseña mundos y conversa contigo. Aquí la usamos para{" "}
                <span className="text-neon-cyan">amplificar tu creatividad</span>.
              </p>
              <a
                href="#chat"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-sm font-bold shadow-neon-purple"
              >
                <Bot className="h-4 w-4" /> Hablar con NEXUS
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Chat */}
      <section id="chat" className="py-8 sm:py-12 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-3xl glass rounded-2xl p-4 sm:p-6 neon-border">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-neon-cyan animate-glow-pulse" />
            <h3 className="font-display font-bold text-lg sm:text-xl">NEXUS · Chat IA</h3>
            <span className="ml-auto text-[10px] sm:text-xs font-mono text-muted-foreground">gemini · 2.5 pro</span>
          </div>

          <div
            ref={scrollRef}
            className="space-y-3 max-h-[24rem] sm:max-h-[28rem] overflow-y-auto pr-1 sm:pr-2 mb-4"
          >
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-sm prose prose-sm prose-invert prose-pre:bg-black/60 prose-pre:border prose-pre:border-neon-cyan/20 prose-code:text-neon-cyan break-words ${
                    m.role === "user"
                      ? "bg-gradient-neon text-primary-foreground rounded-br-sm"
                      : "glass border border-neon-cyan/30 rounded-bl-sm"
                  }`}
                >
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

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => submit(s.prompt)}
                disabled={loading || !user}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass border border-neon-purple/30 hover:border-neon-purple hover:shadow-neon-purple transition-all disabled:opacity-40"
              >
                <s.icon className="h-3.5 w-3.5 text-neon-cyan" />
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={send} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "Pregúntale algo a NEXUS..." : "Inicia sesión para chatear..."}
              disabled={loading || !user}
              className="flex-1 min-w-0 bg-input/40 border border-border rounded-md px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-neon-blue focus:shadow-neon-blue transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !user || !input.trim()}
              className="shrink-0 px-4 rounded-md bg-gradient-neon text-primary-foreground shadow-neon-purple disabled:opacity-50"
              aria-label="Enviar"
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

      {/* Tools */}
      <section className="py-10 sm:py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Herramientas útiles
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t) => (
              <a
                key={t.name}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl p-5 bg-gradient-card border border-border hover:border-neon-purple/60 hover:-translate-y-1 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg flex items-center gap-1.5">
                    {t.name}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                  </h4>
                  <Zap className="h-4 w-4 text-neon-cyan group-hover:scale-125 transition-transform" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h3 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-neon-cyan" /> Noticias del futuro
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((n) => (
              <article
                key={n.title}
                className="glass rounded-xl p-6 neon-border hover:-translate-y-1 transition-all"
              >
                <span className="text-[10px] sm:text-xs font-mono text-neon-cyan tracking-widest">{n.tag}</span>
                <h4 className="mt-2 font-bold text-base sm:text-lg">{n.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{n.desc}</p>
                <p className="mt-3 text-[10px] sm:text-xs text-muted-foreground/70">{n.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
