import { describe, expect, it } from "vitest";
import { activePlan, MEMBERSHIPS } from "./membership";

describe("membership prices and access", () => {
  it("keeps Premium at US$3.99 monthly", () => expect(MEMBERSHIPS.premium.price).toBe(3.99));
  it("offers Plus at US$9.99 monthly", () => expect(MEMBERSHIPS.plus.price).toBe(9.99));
  it("does not activate pending Plus", () => expect(activePlan({ plan: "plus", status: "pending", expires_at: null })).toBe("free"));
  it("activates a Founder grant without expiration", () => expect(activePlan({ plan: "plus", status: "active", expires_at: null })).toBe("plus"));
  it("rejects expired Plus", () => expect(activePlan({ plan: "plus", status: "active", expires_at: "2026-11-01T00:00:00Z" }, Date.parse("2026-11-08T00:00:00Z"))).toBe("free"));
  it("doubles Plus context and expands history", () => {
    expect(MEMBERSHIPS.plus.contextMessages).toBe(80);
    expect(MEMBERSHIPS.plus.historyLimit).toBe(200);
  });
});