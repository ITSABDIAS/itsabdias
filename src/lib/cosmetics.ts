// Recompensa por cada nivel (1-100). Marcos y fondos se pueden equipar en el perfil.
export type RewardKind = "frame" | "background" | "rare";
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
  return id ? LEVEL_REWARDS_FULL.find((r) => r.id === id) : undefined;
}
