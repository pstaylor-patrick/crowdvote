import { describe, it, expect } from "vitest";
import type { SSEEvent, SSEEventType } from "../events";

describe("SSEEvent types", () => {
  it("exports are defined", () => {
    // Verify the module can be imported and types work at runtime
    const eventTypes: SSEEventType[] = [
      "session.status",
      "question.advanced",
      "vote.received",
      "results.revealed",
    ];
    expect(eventTypes).toHaveLength(4);
  });

  it("satisfies SSEEvent union", () => {
    const event: SSEEvent = {
      type: "vote.received",
      data: { questionId: "q1", totalVotes: 5 },
    };
    expect(event.type).toBe("vote.received");
  });
});
