// Bug Hunter progression: 100 levels, 50 ranks (one rank every 2 levels).
export const MAX_LEVEL = 100;

export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.round(40 * Math.pow(level - 1, 1.6));
}

export function levelFromXp(xp: number) {
  let lvl = 1;
  while (lvl < MAX_LEVEL && xp >= xpForLevel(lvl + 1)) lvl++;
  const cur = xpForLevel(lvl);
  const next = lvl >= MAX_LEVEL ? cur : xpForLevel(lvl + 1);
  const pct = lvl >= MAX_LEVEL ? 100 : Math.round(((xp - cur) / (next - cur)) * 100);
  return { level: lvl, cur, next, pct };
}

const RANK_NAMES = [
  "Bit Inicial", "Byte Curioso", "Script Kiddie", "Pixel Scout", "Debug Rookie",
  "Rastreador de Logs", "Cazador de Typos", "Explorador de Consola", "Analista Junior", "Hacker Novato",
  "Operador de Terminal", "Detector de Glitches", "Cazador de Nulls", "Domador de Errores", "Ingeniero de Pruebas",
  "Ciber Explorador", "Patrullero Neón", "Centinela de Código", "Rastreador de Stack", "Especialista QA",
  "Hacker Ético", "Guardián del Backend", "Cazador de Exploits", "Analista de Sistemas", "Maestro del Debug",
  "Ingeniero Neón", "Arquitecto de Fixes", "Agente NEXUS", "Comandante de Logs", "Ciber Guardián",
  "Cazador Élite", "Hacker de Élite", "Señor de los Bugs", "Arquitecto Cuántico", "Centinela Cuántico",
  "Maestro de la Matriz", "Guardián del Núcleo", "Ciber Leyenda", "Oráculo del Código", "Titán del Debug",
  "Señor del Kernel", "Guardián de la Red", "Arconte Digital", "Espectro Neón", "Emperador del Código",
  "Leyenda NEXUS", "Mito Binario", "Inmortal del Sistema", "Deidad del Debug", "Abdias Prime",
];

const COLORS = ["#94a3b8", "#22d3ee", "#3b82f6", "#a855f7", "#ec4899", "#f97316", "#facc15", "#ef4444", "#10b981", "#f5d061"];

export function rankFromLevel(level: number) {
  const idx = Math.min(49, Math.floor((level - 1) / 2));
  return { index: idx + 1, name: RANK_NAMES[idx], color: COLORS[Math.floor(idx / 5)] };
}

export const ALL_RANKS = RANK_NAMES.map((name, i) => ({
  index: i + 1, name, color: COLORS[Math.floor(i / 5)], minLevel: i * 2 + 1,
}));

export type Metric = "bugs_sent" | "bugs_confirmed" | "posts" | "comments" | "projects" | "follows" | "lessons" | "nexus";

const METRIC_INFO: Record<Metric, { label: (n: number) => string; mult: number; targets: number[] }> = {
  bugs_sent: { label: (n) => `Envía ${n} reporte${n > 1 ? "s" : ""} de error`, mult: 15, targets: [1, 3, 5, 10, 25, 50] },
  bugs_confirmed: { label: (n) => `Consigue ${n} bug${n > 1 ? "s" : ""} confirmado${n > 1 ? "s" : ""}`, mult: 60, targets: [1, 3, 5, 10, 20, 40] },
  posts: { label: (n) => `Publica ${n} post${n > 1 ? "s" : ""} en la comunidad`, mult: 8, targets: [1, 5, 15, 50] },
  comments: { label: (n) => `Escribe ${n} comentario${n > 1 ? "s" : ""}`, mult: 8, targets: [1, 10, 30, 100] },
  projects: { label: (n) => `Sube ${n} proyecto${n > 1 ? "s" : ""}`, mult: 40, targets: [1, 3, 10] },
  follows: { label: (n) => `Sigue a ${n} persona${n > 1 ? "s" : ""}`, mult: 8, targets: [1, 5, 20] },
  lessons: { label: (n) => `Completa ${n} lección${n > 1 ? "es" : ""} de la Academy`, mult: 8, targets: [1, 10, 30, 100] },
  nexus: { label: (n) => `Hazle ${n} pregunta${n > 1 ? "s" : ""} a NEXUS`, mult: 8, targets: [1, 10, 50, 200] },
};

export const MISSIONS = (Object.keys(METRIC_INFO) as Metric[]).flatMap((m) =>
  METRIC_INFO[m].targets.map((t) => ({
    key: `${m}:${t}`, metric: m, target: t, label: METRIC_INFO[m].label(t),
    reward: Math.min(20 + t * METRIC_INFO[m].mult, 3000),
  })),
);
