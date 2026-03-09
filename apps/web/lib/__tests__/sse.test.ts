import { describe, it, expect } from "vitest";
import { streamKey } from "../sse";

describe("streamKey", () => {
  it("returns correct stream:session:{id} format", () => {
    expect(streamKey("abc123")).toBe("stream:session:abc123");
  });

  it("works with empty string", () => {
    expect(streamKey("")).toBe("stream:session:");
  });
});
