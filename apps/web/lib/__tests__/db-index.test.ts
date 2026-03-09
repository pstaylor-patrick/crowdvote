import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock both drizzle drivers
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => vi.fn()),
}));

vi.mock("drizzle-orm/neon-http", () => ({
  drizzle: vi.fn(() => ({ _type: "neon" })),
}));

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => ({ _type: "node" })),
}));

vi.mock("./schema", () => ({}));

describe("db module", () => {
  const originalPgUrl = process.env.POSTGRES_URL;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalPgUrl !== undefined) {
      process.env.POSTGRES_URL = originalPgUrl;
    } else {
      delete process.env.POSTGRES_URL;
    }
  });

  it("lazy-initializes via proxy (does not create on import)", async () => {
    process.env.POSTGRES_URL = "postgresql://user:pass@localhost:5432/crowdvote";
    const { drizzle: drizzleNode } = await import("drizzle-orm/node-postgres");
    await import("../db");
    // Should not have been called yet — proxy is lazy
    expect(drizzleNode).not.toHaveBeenCalled();
  });

  it("uses node-postgres driver for localhost URL", async () => {
    process.env.POSTGRES_URL = "postgresql://user:pass@localhost:5432/crowdvote";
    const { drizzle: drizzleNode } = await import("drizzle-orm/node-postgres");
    const { db } = await import("../db");
    // Access a property to trigger the Proxy
    void (db as unknown as Record<string, unknown>)._type;
    expect(drizzleNode).toHaveBeenCalled();
  });

  it("uses node-postgres driver for 127.0.0.1 URL", async () => {
    process.env.POSTGRES_URL = "postgresql://user:pass@127.0.0.1:5432/crowdvote";
    const { drizzle: drizzleNode } = await import("drizzle-orm/node-postgres");
    const { db } = await import("../db");
    void (db as unknown as Record<string, unknown>)._type;
    expect(drizzleNode).toHaveBeenCalled();
  });

  it("uses neon driver for remote URL", async () => {
    process.env.POSTGRES_URL =
      "postgresql://user:pass@ep-cool-cloud-123.us-east-2.aws.neon.tech/crowdvote";
    const { neon } = await import("@neondatabase/serverless");
    const { db } = await import("../db");
    void (db as unknown as Record<string, unknown>)._type;
    expect(neon).toHaveBeenCalled();
  });
});
