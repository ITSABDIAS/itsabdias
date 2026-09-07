import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  History,
  ImagePlus,
  Send,
  Crown,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  type LucideIcon,
} from "lucide-react";

export const NEXUS_TOUR_KEY = "itsabdias.nexus.tour.v1";

type Step = {
  id: string;
  target?: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    id: "intro",
    icon: BrainCircuit,
    eyebrow: "misión 01",
    title: "Bienvenido a NEXUS",
    body: "Soy la inteligencia artificial oficial de ITSABDIAS. Te enseño a programar, crear juegos, elegir hardware y resolver errores. Te voy a mostrar la zona en 6 pasos rápidos.",
  },
  {
    id: "chat",
    target: "[data-tour='chat']",
    icon: Sparkles,
    eyebrow: "misión 02",
    title: "Tu sala de chat",
    body: "Aquí conversas conmigo. Recuerdo lo que hablamos: el lenguaje que usas, tu nivel y tu proyecto, así que no tienes que repetir nada.",
  },
  {
    id: "suggestions",
    target: "[data-tour='suggestions']",
    icon: Rocket,
    eyebrow: "misión 03",
    title: "Atajos rápidos",
    body: "¿No sabes por dónde empezar? Pulsa uno de estos botones y lanzo la pregunta por ti: programación, Roblox, hardware, tecnología o desarrollo de juegos.",
  },
  {
    id: "history",
    target: "[data-tour='history']",
    icon: History,
    eyebrow: "misión 04",
    title: "Historial de conversaciones",
    body: "Cada charla se guarda en tu cuenta. Puedes volver a abrirla cuando quieras, crear una nueva o borrarlas. En el teléfono aparece con el botón «Historial».",
  },
  {
    id: "premium",
    target: "[data-tour='premium']",
    icon: ImagePlus,
    eyebrow: "misión 05",
    title: "Fotos e imágenes (Premium)",
    body: "Con Premium puedes enviarme una foto para que la analice —un error en pantalla, tu build de PC, un diseño— y pedirme que cree imágenes nuevas desde cero.",
  },
  {
    id: "input",
    target: "[data-tour='input']",
    icon: Send,
    eyebrow: "misión 06",
    title: "Escribe y despega",
    body: "Escribe tu pregunta aquí y pulsa enviar. Cuanto más detalle des, mejor te respondo. ¡Listo, ya sabes moverte por NEXUS!",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function NexusOnboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = STEPS[index];

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el || el.offsetParent === null) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = step?.target
      ? (document.querySelector(step.target) as HTMLElement | null)
      : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    measure();
    const t = window.setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, measure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !step) return null;

  const Icon = step.icon;
  const last = index === STEPS.length - 1;
  const pad = 10;

  // Card placement: below the spotlight when there is room, otherwise above/centered.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let cardStyle: React.CSSProperties = {};
  if (rect) {
    const below = vh - (rect.top + rect.height);
    cardStyle =
      below > 260
        ? { top: rect.top + rect.height + 20, left: "50%", transform: "translateX(-50%)" }
        : rect.top > 260
          ? { top: Math.max(16, rect.top - 250), left: "50%", transform: "translateX(-50%)" }
          : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Guía de NEXUS">
      {/* Dim layer with spotlight cutout */}
      {rect ? (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 animate-glow-pulse"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px oklch(0.08 0.04 285 / 0.86)",
            border: "2px solid var(--neon-purple)",
          }}
        />
      ) : (
        <div className="fixed inset-0" style={{ background: "oklch(0.08 0.04 285 / 0.9)" }} />
      )}

      {/* Click-catcher so the page stays inert */}
      <button
        type="button"
        aria-label="Cerrar guía"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      {/* Card */}
      <div
        className="fixed w-[min(30rem,calc(100vw-2rem))] rounded-2xl p-5 sm:p-6 glass neon-border shadow-neon-purple overflow-hidden"
        style={cardStyle}
      >
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-neon-purple/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-neon-blue/30 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start gap-3">
            <span className="shrink-0 grid place-items-center h-11 w-11 rounded-xl bg-gradient-neon shadow-neon-purple">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </span>
            <div className="min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon-cyan">
                {step.eyebrow} · {index + 1}/{STEPS.length}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold text-gradient-neon leading-tight">
                {step.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Saltar guía"
              className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.body}</p>

          {/* Progress */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full bg-gradient-neon transition-all duration-300"
              style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Saltar
            </button>

            <div className="ml-auto flex items-center gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md glass border border-neon-cyan/30 text-xs font-semibold hover:border-neon-cyan transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Atrás
                </button>
              )}
              <button
                type="button"
                onClick={() => (last ? onClose() : setIndex((i) => i + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-neon text-primary-foreground text-xs font-bold shadow-neon-purple"
              >
                {last ? (
                  <>
                    <Crown className="h-3.5 w-3.5" /> ¡Empezar!
                  </>
                ) : (
                  <>
                    Siguiente <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
