import { describe, it, expect } from "vitest";
import { validateAdminToken } from "../auth";

describe("validateAdminToken", () => {
  it("returns true for valid base64 token", () => {
    const token = Buffer.from("admin:secret123").toString("base64");
    expect(validateAdminToken(token, "secret123")).toBe(true);
  });

  it("returns false for wrong password", () => {
    const token = Buffer.from("admin:secret123").toString("base64");
    expect(validateAdminToken(token, "wrongpass")).toBe(false);
  });

  it("returns false for malformed base64", () => {
    expect(validateAdminToken("%%%not-base64%%%", "secret")).toBe(false);
  });

  it("returns false when no colon in decoded string", () => {
    const token = Buffer.from("nocolonhere").toString("base64");
    expect(validateAdminToken(token, "nocolonhere")).toBe(false);
  });

  it("handles password containing colons", () => {
    const token = Buffer.from("admin:pass:with:colons").toString("base64");
    expect(validateAdminToken(token, "pass:with:colons")).toBe(true);
  });

  it("returns false for empty token", () => {
    expect(validateAdminToken("", "secret")).toBe(false);
  });
});
