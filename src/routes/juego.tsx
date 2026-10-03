import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Cpu, Play, RotateCcw, Trophy, Zap } from "lucide-react";

export const Route = createFileRoute("/juego")({
  head: () => ({
    meta: [
      { title: "NEXUS Protocol — Mini Juego | ITSABDIAS" },
      {
        name: "description",
        content:
          "Pon a prueba tu memoria en NEXUS Protocol: repite la secuencia de nodos y sube de nivel. Un mini juego con la temática tecnológica de ITSABDIAS.",
      },
      { property: "og:title", content: "NEXUS Protocol — Mini Juego | ITSABDIAS" },
      {
        property: "og:description",
        content: "Repite la secuencia de nodos, sube de nivel y demuestra tu memoria en el mini juego de ITSABDIAS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JuegoPage,
});

const NODES = [
  { id: 0, label: "CPU", color: "bg-neon-purple", glow: "shadow-[0_0_30px_rgba(168,85,247,0.8)]" },
  { id: 1, label: "RAM", color: "bg-neon-cyan", glow: "shadow-[0_0_30px_rgba(34,211,238,0.8)]" },
  { id: 2, label: "GPU", color: "bg-emerald-400", glow: "shadow-[0_0_30px_rgba(52,211,153,0.8)]" },
  { id: 3, label: "NET", color: "bg-amber-400", glow: "shadow-[0_0_30px_rgba(251,191,36,0.8)]" },
];

const LEVEL_TITLES = [
  "Novato",
  "Aprendiz",
  "Técnico",
  "Programador",
  "Hacker",
  "Ingeniero",
  "Arquitecto",
  "Científico IA",
  "Maestro NEXUS",
  "Leyenda",
];

function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

function speedForLevel(level: number) {
  return Math.max(280, 700 - (level - 1) * 45);
}

function JuegoPage() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userIndex, setUserIndex] = useState(0);
  const [level, setLevel] = useState(0);
  const [best, setBest] = useState(0);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "gameover">("idle");
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const saved = Number(localStorage.getItem("nexus-protocol-best") || "0");
    if (saved > 0) setBest(saved);
    return () => timeouts.current.forEach(clearTimeout);
  }, []);

  const clearTimers = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };

  const playSequence = (seq: number[], lvl: number) => {
    setPhase("showing");
    setUserIndex(0);
    const speed = speedForLevel(lvl);
    seq.forEach((node, i) => {
      timeouts.current.push(
        setTimeout(() => setActiveNode(node), speed * i + 400),
        setTimeout(() => setActiveNode(null), speed * i + 400 + speed * 0.6),
      );
    });
    timeouts.current.push(
      setTimeout(() => setPhase("input"), speed * seq.length + 500),
    );
  };

  const startGame = () => {
    clearTimers();
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setLevel(1);
    playSequence(first, 1);
  };

  const handleNodeClick = (id: number) => {
    if (phase !== "input") return;
    if (id === sequence[userIndex]) {
      setActiveNode(id);
      setTimeout(() => setActiveNode(null), 180);
      const next = userIndex + 1;
      if (next === sequence.length) {
        const newLevel = level + 1;
        const newSeq = [...sequence, Math.floor(Math.random() * 4)];
        setLevel(newLevel);
        setSequence(newSeq);
        if (newLevel - 1 > best) {
          setBest(newLevel - 1);
          localStorage.setItem("nexus-protocol-best", String(newLevel - 1));
        }
        playSequence(newSeq, newLevel);
      } else {
        setUserIndex(next);
      }
    } else {
      clearTimers();
      setPhase("gameover");
      if (level - 1 > best) {
        setBest(level - 1);
        localStorage.setItem("nexus-protocol-best", String(level - 1));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-4 py-1.5 text-xs font-semibold text-neon-purple">
          <Cpu className="h-3.5 w-3.5" /> MINI JUEGO
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold text-foreground sm:text-5xl">
          NEXUS <span className="text-neon-purple drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">Protocol</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          El sistema NEXUS transmite una secuencia de nodos. Memorízala y repítela en orden.
          Cada nivel agrega un nodo más y acelera la transmisión.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Nivel</p>
            <p className="mt-1 font-display text-2xl font-bold text-neon-cyan">{level || "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Rango</p>
            <p className="mt-1 font-display text-lg font-bold text-neon-purple">
              {level > 0 ? levelTitle(level) : "Sin rango"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Récord</p>
            <p className="mt-1 inline-flex items-center gap-1 font-display text-2xl font-bold text-amber-400">
              <Trophy className="h-4 w-4" /> {best}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-neon-purple/30 bg-card/40 p-6 shadow-[0_0_60px_rgba(168,85,247,0.12)] sm:p-10">
          <div className="mx-auto grid max-w-xs grid-cols-2 gap-4">
            {NODES.map((node) => (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                disabled={phase !== "input"}
                className={`aspect-square rounded-2xl border border-border font-display text-lg font-bold transition-all duration-150 ${node.color} ${
                  activeNode === node.id
                    ? `${node.glow} scale-105 opacity-100`
                    : "opacity-30 hover:opacity-60"
                } ${phase === "input" ? "cursor-pointer" : "cursor-default"}`}
                aria-label={`Nodo ${node.label}`}
              >
                {node.label}
              </button>
            ))}
          </div>

          <div className="mt-8 min-h-[3rem]">
            {phase === "idle" && (
              <button
                onClick={startGame}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-neon px-8 py-3 font-display text-sm font-bold text-primary-foreground shadow-neon-purple transition-transform hover:scale-105"
              >
                <Play className="h-4 w-4" /> INICIAR PROTOCOLO
              </button>
            )}
            {phase === "showing" && (
              <p className="animate-pulse font-display text-sm font-semibold text-neon-cyan">
                <Zap className="mr-1 inline h-4 w-4" /> Recibiendo transmisión…
              </p>
            )}
            {phase === "input" && (
              <p className="font-display text-sm font-semibold text-foreground">
                Tu turno: repite la secuencia ({userIndex}/{sequence.length})
              </p>
            )}
            {phase === "gameover" && (
              <div>
                <p className="font-display text-lg font-bold text-red-400">
                  CONEXIÓN PERDIDA — Nivel {level}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Alcanzaste el rango <span className="text-neon-purple">{levelTitle(level)}</span>
                </p>
                <button
                  onClick={startGame}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-neon px-6 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-neon-purple transition-transform hover:scale-105"
                >
                  <RotateCcw className="h-4 w-4" /> REINTENTAR
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card/40 p-4 text-left text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Cómo jugar</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Observa el orden en que se encienden los nodos (CPU, RAM, GPU, NET).</li>
            <li>Cuando sea tu turno, tócalos en el mismo orden.</li>
            <li>Cada nivel suma un nodo y la transmisión es más rápida.</li>
            <li>Un error y pierdes la conexión. Tu récord se guarda en este dispositivo.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
