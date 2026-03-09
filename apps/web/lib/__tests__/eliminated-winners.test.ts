import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing
vi.mock("@/lib/db", () => {
  const selectFn = vi.fn();
  const fromFn = vi.fn();
  const whereFn = vi.fn();
  const groupByFn = vi.fn();
  const orderByFn = vi.fn();

  const chainable = {
    select: selectFn.mockReturnThis(),
    from: fromFn.mockReturnThis(),
    where: whereFn.mockReturnThis(),
    groupBy: groupByFn.mockReturnThis(),
    orderBy: orderByFn.mockReturnValue([]),
  };

  // select returns a chainable, where returns a promise-like (or chainable for tallies)
  selectFn.mockReturnValue(chainable);

  return { db: chainable };
});

// We need to also mock drizzle-orm operators so they don't require real DB
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((...args: unknown[]) => ({ op: "eq", args })),
    lt: vi.fn((...args: unknown[]) => ({ op: "lt", args })),
    and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
    sql: vi.fn(),
  };
});

describe("getEliminatedWinners", () => {
  let getEliminatedWinners: typeof import("../eliminated-winners").getEliminatedWinners;
  let db: {
    select: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../eliminated-winners");
    getEliminatedWinners = mod.getEliminatedWinners;
    const dbMod = await import("@/lib/db");
    db = dbMod.db as unknown as typeof db;
  });

  it("returns empty set when beforeOrderIndex <= 0", async () => {
    const result = await getEliminatedWinners("session-1", 0);
    expect(result).toEqual(new Set());
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns empty set when beforeOrderIndex is negative", async () => {
    const result = await getEliminatedWinners("session-1", -1);
    expect(result).toEqual(new Set());
  });

  it("returns empty set when no prior questions exist", async () => {
    // where() resolves to empty array for the questions query
    db.where.mockResolvedValueOnce([]);

    const result = await getEliminatedWinners("session-1", 1);
    expect(result).toEqual(new Set());
  });

  it("eliminates the winner of a prior question", async () => {
    // First where() call returns prior questions
    db.where.mockResolvedValueOnce([{ id: "q1" }]);
    // Second chain (tallies query) — orderBy returns tallies
    db.orderBy.mockResolvedValueOnce([
      { value: "Alice", count: 5 },
      { value: "Bob", count: 3 },
    ]);

    const result = await getEliminatedWinners("session-1", 2);
    expect(result).toEqual(new Set(["Alice"]));
  });

  it("eliminates all candidates tied for first", async () => {
    db.where.mockResolvedValueOnce([{ id: "q1" }]);
    db.orderBy.mockResolvedValueOnce([
      { value: "Alice", count: 5 },
      { value: "Bob", count: 5 },
      { value: "Charlie", count: 2 },
    ]);

    const result = await getEliminatedWinners("session-1", 2);
    expect(result).toEqual(new Set(["Alice", "Bob"]));
  });

  it("skips questions with no votes", async () => {
    db.where.mockResolvedValueOnce([{ id: "q1" }]);
    db.orderBy.mockResolvedValueOnce([]);

    const result = await getEliminatedWinners("session-1", 2);
    expect(result).toEqual(new Set());
  });

  it("skips questions where top count is 0", async () => {
    db.where.mockResolvedValueOnce([{ id: "q1" }]);
    db.orderBy.mockResolvedValueOnce([{ value: "Alice", count: 0 }]);

    const result = await getEliminatedWinners("session-1", 2);
    expect(result).toEqual(new Set());
  });

  it("accumulates winners across multiple prior questions", async () => {
    db.where.mockResolvedValueOnce([{ id: "q1" }, { id: "q2" }]);
    // Tallies for q1
    db.orderBy.mockResolvedValueOnce([
      { value: "Alice", count: 5 },
      { value: "Bob", count: 3 },
    ]);
    // Tallies for q2
    db.orderBy.mockResolvedValueOnce([
      { value: "Charlie", count: 4 },
      { value: "Alice", count: 2 },
    ]);

    const result = await getEliminatedWinners("session-1", 3);
    expect(result).toEqual(new Set(["Alice", "Charlie"]));
  });
});
