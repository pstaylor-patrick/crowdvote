import { describe, it, expect } from "vitest";
import { computeResults } from "../results";

describe("computeResults", () => {
  it("returns empty array for empty input", () => {
    expect(computeResults([])).toEqual([]);
  });

  it("single item gets 100% and isWinner", () => {
    const result = computeResults([{ value: "A", count: 5 }]);
    expect(result).toHaveLength(1);
    expect(result[0]!.percentage).toBe(100);
    expect(result[0]!.widthPct).toBe(100);
    expect(result[0]!.isWinner).toBe(true);
  });

  it("sorts descending and computes correct percentages", () => {
    const result = computeResults([
      { value: "A", count: 1 },
      { value: "B", count: 3 },
      { value: "C", count: 2 },
    ]);
    expect(result.map((r) => r.value)).toEqual(["B", "C", "A"]);
    expect(result[0]!.percentage).toBe(50);
    expect(result[0]!.widthPct).toBe(100);
    expect(result[0]!.isWinner).toBe(true);
    expect(result[1]!.isWinner).toBe(false);
    expect(result[2]!.isWinner).toBe(false);
  });

  it("all zeros → percentage 0, no winner", () => {
    const result = computeResults([
      { value: "A", count: 0 },
      { value: "B", count: 0 },
    ]);
    expect(result[0]!.percentage).toBe(0);
    expect(result[0]!.isWinner).toBe(false);
    expect(result[1]!.isWinner).toBe(false);
  });

  it("handles tie (first in sorted order gets isWinner)", () => {
    const result = computeResults([
      { value: "A", count: 3 },
      { value: "B", count: 3 },
    ]);
    expect(result[0]!.isWinner).toBe(true);
    expect(result[1]!.isWinner).toBe(false);
    expect(result[0]!.percentage).toBe(50);
    expect(result[1]!.percentage).toBe(50);
  });
});
