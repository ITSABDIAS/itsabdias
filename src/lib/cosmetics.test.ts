import { describe, it, expect } from "vitest";
import { LEVEL_REWARDS_FULL } from "./cosmetics";
describe("recompensas por nivel", () => {
  it("hay una recompensa por cada uno de los 100 niveles", () => {
    expect(LEVEL_REWARDS_FULL.map((r) => r.level)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });
  it("el id de marcos y fondos lleva el nivel requerido", () => {
    expect(LEVEL_REWARDS_FULL[4].id).toBe("frame-5");
    expect(LEVEL_REWARDS_FULL[9].id).toBe("bg-10");
  });
});
