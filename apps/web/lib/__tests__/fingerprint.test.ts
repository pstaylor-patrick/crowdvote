import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCtx = {
  set textBaseline(_v: string) {},
  set font(_v: string) {},
  set fillStyle(_v: string) {},
  fillRect: vi.fn(),
  fillText: vi.fn(),
};

const mockGlExt = { UNMASKED_RENDERER_WEBGL: 0x9246 };
const mockGl = {
  getExtension: vi.fn(() => mockGlExt),
  getParameter: vi.fn(() => "NVIDIA GeForce GTX 1080"),
};

function stubDOM() {
  vi.stubGlobal("document", {
    createElement: vi.fn((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn((type: string) => {
            if (type === "2d") return mockCtx;
            if (type === "webgl") return mockGl;
            return null;
          }),
          toDataURL: vi.fn(() => "data:image/png;base64,abc123"),
        };
      }
      return {};
    }),
  });

  vi.stubGlobal("screen", { width: 1920, height: 1080 });
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal("navigator", {
    hardwareConcurrency: 8,
    maxTouchPoints: 0,
    platform: "MacIntel",
    language: "en-US",
  });
  vi.stubGlobal("crypto", {
    subtle: {
      digest: vi.fn((_algo: string, data: ArrayBuffer) => {
        // Deterministic fake hash based on input length
        const buf = new Uint8Array(32);
        const view = new Uint8Array(
          data instanceof ArrayBuffer ? data : (data as Uint8Array).buffer
        );
        for (let i = 0; i < 32; i++) buf[i] = (view[i % view.length] ?? 0) ^ 0xaa;
        return buf.buffer;
      }),
    },
  });
}

describe("getFingerprint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    stubDOM();
  });

  it("returns a 64-char hex string", async () => {
    const { getFingerprint } = await import("../fingerprint");
    const fp = await getFingerprint();
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns deterministic output for same environment", async () => {
    const { getFingerprint } = await import("../fingerprint");
    const fp1 = await getFingerprint();
    const fp2 = await getFingerprint();
    expect(fp1).toBe(fp2);
  });

  it("collects canvas, screen, webgl, and navigator signals", async () => {
    const { getFingerprint } = await import("../fingerprint");
    await getFingerprint();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(document.createElement).toHaveBeenCalledWith("canvas");
    expect(mockCtx.fillText).toHaveBeenCalled();
    expect(mockGl.getExtension).toHaveBeenCalledWith("WEBGL_debug_renderer_info");
    expect(mockGl.getParameter).toHaveBeenCalledWith(mockGlExt.UNMASKED_RENDERER_WEBGL);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(crypto.subtle.digest).toHaveBeenCalledWith("SHA-256", expect.any(Uint8Array));
  });

  it("handles canvas context returning null", async () => {
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: vi.fn(() => null),
        toDataURL: vi.fn(),
      })),
    });

    const { getFingerprint } = await import("../fingerprint");
    const fp = await getFingerprint();
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });

  it("handles canvas throwing", async () => {
    vi.stubGlobal("document", {
      createElement: vi.fn(() => {
        throw new Error("blocked");
      }),
    });

    const { getFingerprint } = await import("../fingerprint");
    const fp = await getFingerprint();
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });

  it("handles webgl extension returning null", async () => {
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: vi.fn((type: string) => {
          if (type === "2d") return mockCtx;
          if (type === "webgl") return { getExtension: () => null, getParameter: vi.fn() };
          return null;
        }),
        toDataURL: vi.fn(() => "data:image/png;base64,abc123"),
      })),
    });

    const { getFingerprint } = await import("../fingerprint");
    const fp = await getFingerprint();
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });
});
