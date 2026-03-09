import { describe, it, expect } from "vitest";
import { buildSessionPayload } from "../session-payload";

describe("buildSessionPayload", () => {
  it("trims title whitespace", () => {
    const payload = buildSessionPayload("  My Title  ", []);
    expect(payload.title).toBe("My Title");
  });

  it("filters empty-prompt questions", () => {
    const payload = buildSessionPayload("T", [
      { prompt: "Valid?", options: ["A"] },
      { prompt: "", options: ["B"] },
      { prompt: "  ", options: ["C"] },
    ]);
    expect(payload.questions).toHaveLength(1);
    expect(payload.questions[0]!.prompt).toBe("Valid?");
  });

  it("filters empty options", () => {
    const payload = buildSessionPayload("T", [{ prompt: "Q1", options: ["A", "", "  ", "B"] }]);
    expect(payload.questions[0]!.options).toEqual(["A", "B"]);
  });

  it("trims question prompts", () => {
    const payload = buildSessionPayload("T", [{ prompt: "  Q1  ", options: ["A"] }]);
    expect(payload.questions[0]!.prompt).toBe("Q1");
  });

  it("returns empty questions array when all are empty", () => {
    const payload = buildSessionPayload("T", [
      { prompt: "", options: [] },
      { prompt: "  ", options: ["A"] },
    ]);
    expect(payload.questions).toEqual([]);
  });

  it("sets type to roast", () => {
    const payload = buildSessionPayload("T", []);
    expect(payload.type).toBe("roast");
  });
});
