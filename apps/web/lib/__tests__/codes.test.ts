import { describe, it, expect } from "vitest";
import { generateCode } from "../codes";

const ALLOWED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789";

describe("generateCode", () => {
  it("generates default length of 5", () => {
    expect(generateCode()).toHaveLength(5);
  });

  it("respects custom length", () => {
    expect(generateCode(8)).toHaveLength(8);
    expect(generateCode(3)).toHaveLength(3);
  });

  it("only contains uppercase letters A-Z and digits 2-9", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      for (const ch of code) {
        expect(ALLOWED_CHARS).toContain(ch);
      }
    }
  });

  it("produces different codes across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
