import { describe, it, expect } from "vitest";
import { LEVEL_REWARDS_FULL, AVATAR_REWARDS, PASS_REWARDS, MEMBERSHIP_REWARDS, cosmeticUnlocked } from "./cosmetics";
describe("recompensas por nivel", () => {
  it("hay una recompensa por cada uno de los 100 niveles", () => {
    expect(LEVEL_REWARDS_FULL.map((r) => r.level)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });
  it("el id de marcos y fondos lleva el nivel requerido", () => {
    expect(LEVEL_REWARDS_FULL[4].id).toBe("frame-5");
    expect(LEVEL_REWARDS_FULL[9].id).toBe("bg-10");
  });
});
describe("identidad y pase", () => {
  it("no concede avatares de niveles no alcanzados", () => {
    expect(cosmeticUnlocked(AVATAR_REWARDS[1], 9, 0, "free")).toBe(false);
    expect(cosmeticUnlocked(AVATAR_REWARDS[1], 10, 0, "free")).toBe(true);
  });
  it("desbloquea una etapa gratis por dos misiones reclamadas", () => {
    expect(cosmeticUnlocked(PASS_REWARDS[0], 100, 1, "free")).toBe(false);
    expect(cosmeticUnlocked(PASS_REWARDS[0], 1, 2, "free")).toBe(true);
  });
  it("el camino exclusivo requiere Premium o Plus", () => {
    expect(cosmeticUnlocked(PASS_REWARDS[1], 100, 20, "free")).toBe(false);
    expect(cosmeticUnlocked(PASS_REWARDS[1], 1, 2, "premium")).toBe(true);
    expect(cosmeticUnlocked(PASS_REWARDS[1], 1, 2, "plus")).toBe(true);
  });
  it("los marcos Plus no están disponibles con Premium", () => {
    expect(cosmeticUnlocked(MEMBERSHIP_REWARDS[3], 100, 20, "premium")).toBe(false);
    expect(cosmeticUnlocked(MEMBERSHIP_REWARDS[3], 1, 0, "plus")).toBe(true);
  });
});
