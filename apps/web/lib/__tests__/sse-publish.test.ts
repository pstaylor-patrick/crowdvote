import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SSEEvent } from "@crowdvote/types";

const mockXadd = vi.fn().mockResolvedValue("stream-id");
const mockExpire = vi.fn().mockResolvedValue(1);

vi.mock("../redis", () => ({
  getRedis: () => ({
    xadd: mockXadd,
    expire: mockExpire,
  }),
}));

describe("publishEvent", () => {
  let publishEvent: typeof import("../sse").publishEvent;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../sse");
    publishEvent = mod.publishEvent;
  });

  it("publishes event to correct stream key", async () => {
    const event: SSEEvent = {
      type: "vote.received",
      data: { questionId: "q1", totalVotes: 5 },
    };

    await publishEvent("session-123", event);

    expect(mockXadd).toHaveBeenCalledWith(
      "stream:session:session-123",
      "*",
      "type",
      "vote.received",
      "data",
      JSON.stringify({ questionId: "q1", totalVotes: 5 })
    );
  });

  it("sets 24h expiry on the stream", async () => {
    const event: SSEEvent = {
      type: "session.status",
      data: { status: "active" },
    };

    await publishEvent("s1", event);

    expect(mockExpire).toHaveBeenCalledWith("stream:session:s1", 86400);
  });

  it("handles all event types", async () => {
    const events: SSEEvent[] = [
      { type: "session.status", data: { status: "lobby" } },
      {
        type: "question.advanced",
        data: { questionIndex: 0, questionId: "q1", prompt: "Who?", options: ["A", "B"] },
      },
      { type: "vote.received", data: { questionId: "q1", totalVotes: 3 } },
      { type: "voting.closed", data: { questionId: "q1" } },
      {
        type: "results.revealed",
        data: { questionId: "q1", results: [{ value: "A", count: 2 }] },
      },
    ];

    for (const event of events) {
      await publishEvent("s1", event);
      expect(mockXadd).toHaveBeenLastCalledWith(
        "stream:session:s1",
        "*",
        "type",
        event.type,
        "data",
        JSON.stringify(event.data)
      );
    }
  });
});
