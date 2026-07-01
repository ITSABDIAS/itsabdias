export const TUTORIAL_CATEGORIES = [
  { slug: "programacion", label: "Programación" },
  { slug: "roblox", label: "Roblox" },
  { slug: "ai", label: "IA" },
  { slug: "hardware", label: "Hardware" },
  { slug: "gamedev", label: "GameDev" },
  { slug: "electricidad", label: "Electricidad" },
  { slug: "software", label: "Software" },
  { slug: "tecnologia", label: "Tecnología" },
] as const;

export const LEVELS = [
  { slug: "principiante", label: "Principiante", color: "text-green-400 border-green-400/40 bg-green-400/10" },
  { slug: "intermedio", label: "Intermedio", color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
  { slug: "avanzado", label: "Avanzado", color: "text-red-400 border-red-400/40 bg-red-400/10" },
] as const;

export function levelMeta(l: string) {
  return LEVELS.find((x) => x.slug === l) ?? LEVELS[0];
}

export function categoryLabel(c: string) {
  return TUTORIAL_CATEGORIES.find((x) => x.slug === c)?.label ?? c;
}
