import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback } from "react";
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
  MessageSquarePlus,
  Trash2,
  ImagePlus,
  Wand2,
  Crown,
  X,
  History,
} from "lucide-react";
import { aiChat, aiGenerateImage } from "@/lib/ai.functions";
import {
  listConversations,
  createConversation,
  getConversationMessages,
  saveChatMessage,
  deleteConversation,
  clearChatHistory,
} from "@/lib/chat.functions";
import { useAuth } from "@/hooks/useAuth";
import { useMyRoles } from "@/hooks/useMyRoles";
import { supabase } from "@/integrations/supabase/client";
import { TutorialsSection } from "@/components/TutorialsSection";

export const Route = createFileRoute("/ai")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Inteligencia Artificial — ItsaBDias" },
      {
        name: "description",
        content:
          "NEXUS: chat IA con memoria, historial de conversaciones, análisis de imágenes y generación de imágenes Premium.",
      },
      { property: "og:title", content: "NEXUS · Inteligencia Artificial — ItsaBDias" },
      {
        property: "og:description",
        content: "Chat IA con historial, memoria e imágenes. El centro tecnológico de ItsaBDias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  "Hola, soy **NEXUS**, el núcleo de IA de **ItsaBDias** ⚡\n\nRecuerdo nuestras conversaciones anteriores: puedes retomar cualquier chat desde el **historial**.\n\nSi eres **Premium**, además puedes **enviarme fotos** para que las analice y pedirme que **genere imágenes**.\n\n¿Por dónde empezamos?";

type Msg = { role: "user" | "assistant"; content: string; imageUrl?: string | null };
type Convo = { id: string; title: string; created_at: string; updated_at: string };

/** Renders a stored image from the private nexus-images bucket via a signed URL. */
function ChatImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.storage.from("nexus-images").createSignedUrl(path, 3600);
      if (!cancel) setUrl(data?.signedUrl ?? null);
    })();
    return () => {
      cancel = true;
    };
  }, [path]);

  if (!url) {
    return (
      <div className="h-40 w-56 rounded-lg bg-muted/30 animate-pulse mb-2" aria-hidden="true" />
    );
  }
  return (
    <img
      src={url}
      alt="Imagen del chat con NEXUS"
      loading="lazy"
      className="rounded-lg mb-2 max-h-72 w-auto border border-neon-cyan/30"
    />
  );
}

function AI() {
  const { user } = useAuth();
  const { isPremium } = useMyRoles();
  const { q } = Route.useSearch();

  const callAi = useServerFn(aiChat);
  const genImage = useServerFn(aiGenerateImage);
  const fetchConvos = useServerFn(listConversations);
  const newConvo = useServerFn(createConversation);
  const fetchMessages = useServerFn(getConversationMessages);
  const persistMsg = useServerFn(saveChatMessage);
  const dropConvo = useServerFn(deleteConversation);
  const doClearHistory = useServerFn(clearChatHistory);

  const [input, setInput] = useState(q ?? "");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: WELCOME }]);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; file: File } | null>(null);
  const [imageMode, setImageMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const refreshConvos = useCallback(async () => {
    const { conversations } = await fetchConvos({});
    setConvos(conversations as Convo[]);
    return conversations as Convo[];
  }, [fetchConvos]);

  // Load conversation list on mount and open the most recent one
  useEffect(() => {
    if (!user) {
      setBooting(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await refreshConvos();
        if (cancelled) return;
        if (list.length > 0) {
          setActiveId(list[0].id);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshConvos]);

  // Load messages of the active conversation
  useEffect(() => {
    if (!activeId) {
      setMsgs([{ role: "assistant", content: WELCOME }]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { messages } = await fetchMessages({ data: { conversationId: activeId } });
        if (!cancelled) setMsgs([{ role: "assistant", content: WELCOME }, ...messages]);
      } catch {
        if (!cancelled) setMsgs([{ role: "assistant", content: WELCOME }]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, fetchMessages]);

  const ensureConversation = async () => {
    if (activeId) return activeId;
    const { conversation } = await newConvo({ data: {} });
    setActiveId(conversation.id);
    setConvos((c) => [conversation as Convo, ...c]);
    return conversation.id;
  };

  const startNewChat = async () => {
    if (!user) return;
    setActiveId(null);
    setMsgs([{ role: "assistant", content: WELCOME }]);
    setPendingImage(null);
    setShowHistory(false);
  };

  const pickImage = () => {
    if (!isPremium) {
      toast.error("Enviar fotos a NEXUS es exclusivo de Premium ✨");
      return;
    }
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingImage({ dataUrl: String(reader.result), file });
    reader.readAsDataURL(file);
  };

  const uploadImage = async (blob: Blob, ext: string) => {
    if (!user) return null;
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("nexus-images").upload(path, blob, {
      contentType: blob.type || `image/${ext}`,
    });
    if (error) {
      console.error("upload error", error);
      return null;
    }
    return path;
  };

  const submit = async (text: string) => {
    if (loading) return;
    if (!user) {
      toast.error("Inicia sesión para chatear con NEXUS");
      return;
    }
    if (!text.trim() && !pendingImage) return;

    // Premium image generation mode
    if (imageMode) {
      await runImageGeneration(text.trim());
      return;
    }

    const attached = pendingImage;
    const prompt = text.trim() || "Analiza esta imagen y dime todo lo relevante.";
    setInput("");
    setPendingImage(null);
    setLoading(true);

    try {
      const conversationId = await ensureConversation();
      let storedPath: string | null = null;
      if (attached) {
        storedPath = await uploadImage(attached.file, attached.file.name.split(".").pop() || "png");
      }

      const userMsg: Msg = { role: "user", content: prompt, imageUrl: storedPath };
      const next = [...msgs, userMsg];
      setMsgs(next);

      await persistMsg({
        data: { conversationId, role: "user", content: prompt, imageUrl: storedPath },
      }).catch(() => undefined);

      const payload = next.slice(-40).map((m, i, arr) => ({
        role: m.role,
        content: m.content,
        // only send the raw image bytes for the message just sent
        image: attached && i === arr.length - 1 ? attached.dataUrl : undefined,
      }));

      const res = await callAi({ data: { messages: payload } });
      const assistantMsg: Msg = { role: "assistant", content: res.content || "..." };
      setMsgs((m) => [...m, assistantMsg]);
      await persistMsg({
        data: { conversationId, role: "assistant", content: assistantMsg.content },
      }).catch(() => undefined);
      refreshConvos().catch(() => undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const runImageGeneration = async (prompt: string) => {
    if (!prompt) {
      toast.error("Describe la imagen que quieres que NEXUS genere");
      return;
    }
    if (!isPremium) {
      toast.error("Generar imágenes es exclusivo de Premium ✨");
      return;
    }
    setInput("");
    setLoading(true);
    try {
      const conversationId = await ensureConversation();
      const userMsg: Msg = { role: "user", content: `🎨 Genera una imagen: ${prompt}` };
      setMsgs((m) => [...m, userMsg]);
      await persistMsg({
        data: { conversationId, role: "user", content: userMsg.content },
      }).catch(() => undefined);

      const { image, text } = await genImage({ data: { prompt } });
      const blob = await (await fetch(image)).blob();
      const path = await uploadImage(blob, "png");

      const assistantMsg: Msg = {
        role: "assistant",
        content: text || "Aquí tienes tu imagen generada ✨",
        imageUrl: path,
      };
      setMsgs((m) => [...m, assistantMsg]);
      await persistMsg({
        data: {
          conversationId,
          role: "assistant",
          content: assistantMsg.content,
          imageUrl: path,
        },
      }).catch(() => undefined);
      refreshConvos().catch(() => undefined);
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

  const handleDeleteConvo = async (id: string) => {
    if (!confirm("¿Borrar esta conversación?")) return;
    try {
      await dropConvo({ data: { conversationId: id } });
      setConvos((c) => c.filter((x) => x.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMsgs([{ role: "assistant", content: WELCOME }]);
      }
      toast.success("Conversación borrada");
    } catch {
      toast.error("No se pudo borrar");
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    if (!confirm("¿Borrar TODO tu historial de conversaciones con NEXUS?")) return;
    try {
      await doClearHistory({});
      setConvos([]);
      setActiveId(null);
      setMsgs([{ role: "assistant", content: WELCOME }]);
      toast.success("Historial borrado");
    } catch {
      toast.error("No se pudo borrar el historial");
    }
  };

  return (
    <PageShell>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <SectionTitle
          eyebrow="// ai.core"
          title="Inteligencia Artificial"
          subtitle="El centro tecnológico de ItsaBDias. Chat con memoria, historial e imágenes."
        />

        <div className="mx-auto max-w-5xl glass rounded-2xl p-6 sm:p-8 neon-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-neon-purple/30 rounded-full blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <BrainCircuit className="h-12 w-12 sm:h-16 sm:w-16 text-neon-cyan animate-glow-pulse" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">El motor del próximo salto humano</h3>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                NEXUS recuerda tus conversaciones anteriores y, con{" "}
                <span className="text-neon-gold font-semibold">Premium</span>, analiza tus fotos y
                genera imágenes por ti.
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
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[16rem_1fr] gap-4">
          {/* Conversation history */}
          <aside
            className={`glass rounded-2xl p-3 neon-border h-fit lg:block ${showHistory ? "block" : "hidden"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-neon-cyan" />
              <h4 className="font-display font-bold text-sm">Historial</h4>
              {convos.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Borrar todo el historial"
                  aria-label="Borrar todo el historial"
                  className="ml-auto p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={startNewChat}
              disabled={!user}
              className="w-full mb-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-neon text-primary-foreground text-xs font-bold shadow-neon-purple disabled:opacity-50"
            >
              <MessageSquarePlus className="h-4 w-4" /> Nueva conversación
            </button>

            <div className="space-y-1 max-h-[22rem] overflow-y-auto pr-1">
              {booting && <p className="text-xs text-muted-foreground px-2">Cargando...</p>}
              {!booting && convos.length === 0 && (
                <p className="text-xs text-muted-foreground px-2">
                  Aún no tienes conversaciones guardadas.
                </p>
              )}
              {convos.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                    activeId === c.id
                      ? "bg-neon-purple/20 border border-neon-purple/40"
                      : "hover:bg-muted/30 border border-transparent"
                  }`}
                  onClick={() => {
                    setActiveId(c.id);
                    setShowHistory(false);
                  }}
                >
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    type="button"
                    aria-label="Borrar conversación"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConvo(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat panel */}
          <div className="glass rounded-2xl p-4 sm:p-6 neon-border min-w-0">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Bot className="h-5 w-5 text-neon-cyan animate-glow-pulse" />
              <h3 className="font-display font-bold text-lg sm:text-xl">NEXUS · Chat IA</h3>
              <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                gemini · memoria activa
              </span>
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="ml-auto lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass border border-neon-cyan/30 text-xs"
              >
                <History className="h-3.5 w-3.5 text-neon-cyan" /> Historial
              </button>
            </div>

            <div
              ref={scrollRef}
              className="space-y-3 max-h-[24rem] sm:max-h-[30rem] overflow-y-auto pr-1 sm:pr-2 mb-4"
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
                    {m.imageUrl && <ChatImage path={m.imageUrl} />}
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass border border-neon-cyan/30 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
                    {imageMode ? "NEXUS está dibujando..." : "NEXUS está pensando..."}
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

            {/* Premium controls */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={pickImage}
                disabled={loading || !user}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-40 ${
                  isPremium
                    ? "border-neon-cyan/40 glass hover:border-neon-cyan"
                    : "border-yellow-500/40 text-yellow-400/90 glass"
                }`}
              >
                <ImagePlus className="h-3.5 w-3.5" /> Enviar foto
                {!isPremium && <Crown className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isPremium) {
                    toast.error("Generar imágenes es exclusivo de Premium ✨");
                    return;
                  }
                  setImageMode((v) => !v);
                }}
                disabled={loading || !user}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-40 ${
                  imageMode
                    ? "bg-gradient-neon text-primary-foreground border-transparent shadow-neon-purple"
                    : isPremium
                      ? "border-neon-purple/40 glass hover:border-neon-purple"
                      : "border-yellow-500/40 text-yellow-400/90 glass"
                }`}
              >
                <Wand2 className="h-3.5 w-3.5" /> Generar imagen
                {!isPremium && <Crown className="h-3 w-3" />}
              </button>

              {!isPremium && (
                <Link
                  to="/premium"
                  className="text-[11px] font-medium text-yellow-400 hover:underline inline-flex items-center gap-1"
                >
                  <Crown className="h-3 w-3" /> Hazte Premium
                </Link>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
              aria-label="Seleccionar imagen"
            />

            {pendingImage && (
              <div className="mb-3 flex items-center gap-3 glass border border-neon-cyan/30 rounded-lg p-2">
                <img
                  src={pendingImage.dataUrl}
                  alt="Imagen adjunta"
                  className="h-14 w-14 object-cover rounded-md"
                />
                <span className="text-xs text-muted-foreground flex-1 truncate">
                  {pendingImage.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  aria-label="Quitar imagen"
                  className="p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={send} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  !user
                    ? "Inicia sesión para chatear..."
                    : imageMode
                      ? "Describe la imagen que quieres crear..."
                      : "Pregúntale algo a NEXUS..."
                }
                disabled={loading || !user}
                className="flex-1 min-w-0 bg-input/40 border border-border rounded-md px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-neon-blue focus:shadow-neon-blue transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !user || (!input.trim() && !pendingImage)}
                className="shrink-0 px-4 rounded-md bg-gradient-neon text-primary-foreground shadow-neon-purple disabled:opacity-50"
                aria-label="Enviar"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
            {!user && (
              <p className="mt-3 text-xs text-muted-foreground text-center">
                NEXUS requiere cuenta para guardar tu historial. Es gratis.
              </p>
            )}
          </div>
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
      <TutorialsSection category="ai" />
    </PageShell>
  );
}
