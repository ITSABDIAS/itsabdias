// Recompensa por cada nivel (1-100). Marcos y fondos se pueden equipar en el perfil.
import sentinel from "@/assets/avatar-sentinel.jpg";
import pilot from "@/assets/avatar-pilot.jpg";
import prime from "@/assets/avatar-prime.jpg";
import type { MembershipPlan } from "./membership";
export type RewardKind = "frame" | "background" | "rare" | "avatar";
export type LevelReward = { level: number; id: string; kind: RewardKind; name: string; style: string };

const FRAME_NAMES = ["Circuito", "Pulso Neón", "Plasma", "Glitch", "Hexágono", "Rayo", "Cuántico", "Holograma", "Nebulosa", "Diamante", "Fénix", "Matriz", "Eclipse", "Aurora", "Vórtice", "Oro Prime", "Titanio", "Cristal", "Supernova", "Corona Prime"];
const BG_NAMES = ["Rejilla", "Atardecer Synth", "Ciudad Neón", "Océano Digital", "Lava Binaria", "Bosque Cyber", "Galaxia", "Tormenta", "Laboratorio", "Núcleo", "Desierto Retro", "Aurora Boreal", "Abismo", "Quasar", "Prisma", "Volcán", "Hielo Ártico", "Sakura Tech", "Dimensión X", "Trono Prime"];
const RARE_NAMES = ["Chip perdido", "Llave del servidor", "Píxel dorado", "Bug domesticado", "Cartucho retro", "Cubo de datos", "Antena alienígena", "Mando legendario", "Disquete maldito", "Gato de Schrödinger", "Batería infinita", "Ojo de NEXUS", "Moneda de 8 bits", "Rata de laboratorio", "Teclado fantasma", "Cristal de RAM", "Brújula binaria", "Huevo de dragón", "Núcleo de estrella", "Reliquia 404"];

function hue(level: number) { return (level * 47) % 360; }

export const LEVEL_REWARDS_FULL: LevelReward[] = Array.from({ length: 100 }, (_, i) => {
  const level = i + 1; const d = level % 10; const n = Math.floor(i / 5) % 20; const h = hue(level);
  if (d === 5 || d === 7) {
    return { level, id: `frame-${level}`, kind: "frame", name: `Marco ${FRAME_NAMES[n]}`, style: `conic-gradient(from 0deg, hsl(${h} 95% 60%), hsl(${(h + 120) % 360} 95% 60%), hsl(${(h + 240) % 360} 95% 60%), hsl(${h} 95% 60%))` };
  }
  if (d === 0 || d === 2) {
    return { level, id: `bg-${level}`, kind: "background", name: `Fondo ${BG_NAMES[n]}`, style: `linear-gradient(135deg, hsl(${h} 80% 18%), hsl(${(h + 60) % 360} 85% 35%) 55%, hsl(${(h + 160) % 360} 90% 22%))` };
  }
  return { level, id: `rare-${level}`, kind: "rare", name: RARE_NAMES[(i * 7) % 20], style: `radial-gradient(circle, hsl(${h} 95% 65%), hsl(${(h + 90) % 360} 80% 30%))` };
});

export function rewardById(id: string | null | undefined) {
  return id ? ALL_COSMETICS.find((r) => r.id === id) : undefined;
}

export type Cosmetic = LevelReward & { image?: string; source?: "level" | "membership" | "pass"; track?: "free" | "elite"; tier?: number; plan?: "premium" | "plus" };
export const AVATAR_REWARDS: Cosmetic[] = [
  { id: "avatar-sentinel", level: 1, name: "Centinela NEXUS", kind: "avatar", image: sentinel, style: "var(--gradient-neon)" },
  { id: "avatar-pilot", level: 10, name: "Piloto Cyber", kind: "avatar", image: pilot, style: "var(--gradient-plus)" },
  { id: "avatar-prime", level: 30, name: "Soberano Prime", kind: "avatar", image: prime, style: "var(--gradient-neon)" },
];
export const MEMBERSHIP_REWARDS: Cosmetic[] = (["premium", "plus"] as const).flatMap((plan) => (["background", "frame"] as const).map((kind) => ({
  id: `membership-${plan}-${kind === "background" ? "banner" : "frame"}`, level: 1, kind, plan, source: "membership" as const,
  name: `${kind === "background" ? "Banner" : "Marco"} ${plan === "plus" ? "Prime Azul Plus" : "Dorado Premium"}`,
  style: plan === "plus" ? "var(--gradient-neon)" : "var(--gradient-gold)",
})));
export const PASS_REWARDS: Cosmetic[] = Array.from({ length: 10 }, (_, i) => (["free", "elite"] as const).map((track) => {
  const tier = i + 1; const kind = tier % 3 === 1 ? "avatar" : tier % 3 === 2 ? "background" : "frame";
  return { id: `pass-${track}-${kind === "background" ? "bg" : kind}-${tier}`, level: 1, kind, source: "pass" as const, track, tier,
    name: `${track === "elite" ? "Élite" : "Operación"} ${["Centinela", "Horizonte", "Órbita", "Piloto", "Eclipse", "Corona", "Soberano", "Portal", "Prime", "Leyenda"][i]}`,
    image: kind === "avatar" ? [sentinel, pilot, prime][Math.floor(i / 3) % 3] : undefined,
    style: track === "elite" ? "var(--gradient-gold)" : "var(--gradient-neon)",
  };
})).flat();
export const ALL_COSMETICS: Cosmetic[] = [...LEVEL_REWARDS_FULL, ...AVATAR_REWARDS, ...MEMBERSHIP_REWARDS, ...PASS_REWARDS];
export function cosmeticUnlocked(r: Cosmetic, level: number, missions: number, plan: MembershipPlan) {
  if (r.source === "membership") return r.plan === "plus" ? plan === "plus" : plan !== "free";
  if (r.source === "pass") return missions >= (r.tier ?? 0) * 2 && (r.track === "free" || plan !== "free");
  return r.level <= level;
}
