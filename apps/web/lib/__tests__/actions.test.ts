import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import { getAppUrl } from "../actions";

const mockHeaders = headers as unknown as ReturnType<typeof vi.fn>;

function fakeHeaders(map: Record<string, string>) {
  mockHeaders.mockResolvedValue({
    get: (key: string) => map[key] ?? null,
  });
}

describe("getAppUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns URL from x-forwarded-host and x-forwarded-proto", async () => {
    fakeHeaders({
      "x-forwarded-host": "abc123.ngrok-free.app",
      "x-forwarded-proto": "https",
    });
    const url = await getAppUrl();
    expect(url).toBe("https://abc123.ngrok-free.app");
  });

  it("falls back to host header when x-forwarded-host is absent", async () => {
    fakeHeaders({ host: "localhost:3000" });
    const url = await getAppUrl();
    expect(url).toBe("http://localhost:3000");
  });

  it("falls back to defaults when no headers present", async () => {
    fakeHeaders({});
    const url = await getAppUrl();
    expect(url).toBe("http://localhost:3000");
  });
});
