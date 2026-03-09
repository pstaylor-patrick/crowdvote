import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("getAppUrl", () => {
  const originalEnv = process.env.APP_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.APP_URL = originalEnv;
    } else {
      delete process.env.APP_URL;
    }
  });

  it("returns APP_URL when set", async () => {
    process.env.APP_URL = "https://crowdvote.example.com";
    const { getAppUrl } = await import("../actions");
    const url = await getAppUrl();
    expect(url).toBe("https://crowdvote.example.com");
  });

  it("falls back to localhost when APP_URL is not set", async () => {
    delete process.env.APP_URL;
    const { getAppUrl } = await import("../actions");
    const url = await getAppUrl();
    expect(url).toBe("http://localhost:3000");
  });

  it("returns empty string APP_URL as-is (falsy but defined)", async () => {
    process.env.APP_URL = "";
    const { getAppUrl } = await import("../actions");
    const url = await getAppUrl();
    expect(url).toBe("http://localhost:3000");
  });
});
