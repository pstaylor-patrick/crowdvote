import { describe, it, expect } from "vitest";
import type {
  Session,
  SessionType,
  SessionStatus,
  CreateSessionInput,
  CreateQuestionInput,
  Question,
  Vote,
  SSEEvent,
  SSEEventType,
} from "../index";

describe("type re-exports from index", () => {
  it("Session type is structurally valid", () => {
    const session: Session = {
      id: "s1",
      title: "Test",
      code: "ABC12",
      type: "poll",
      status: "draft",
      currentQuestionIndex: 0,
      settings: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(session.id).toBe("s1");
    expect(session.type).toBe("poll");
  });

  it("SessionType covers all variants", () => {
    const types: SessionType[] = ["poll", "quiz", "roast"];
    expect(types).toHaveLength(3);
  });

  it("SessionStatus covers all variants", () => {
    const statuses: SessionStatus[] = ["draft", "lobby", "active", "finished"];
    expect(statuses).toHaveLength(4);
  });

  it("CreateSessionInput is structurally valid", () => {
    const input: CreateSessionInput = {
      title: "My Session",
      type: "quiz",
      questions: [{ prompt: "Q1?", options: ["A", "B"] }],
    };
    expect(input.questions).toHaveLength(1);
  });

  it("CreateQuestionInput is structurally valid", () => {
    const q: CreateQuestionInput = { prompt: "Favorite?", options: ["X", "Y", "Z"] };
    expect(q.options).toHaveLength(3);
  });

  it("Question type is structurally valid", () => {
    const q: Question = {
      id: "q1",
      sessionId: "s1",
      orderIndex: 0,
      prompt: "Who?",
      options: ["A", "B"],
      timeLimitSeconds: 30,
      createdAt: new Date(),
    };
    expect(q.timeLimitSeconds).toBe(30);
  });

  it("Question allows null timeLimitSeconds", () => {
    const q: Question = {
      id: "q1",
      sessionId: "s1",
      orderIndex: 0,
      prompt: "Who?",
      options: ["A"],
      timeLimitSeconds: null,
      createdAt: new Date(),
    };
    expect(q.timeLimitSeconds).toBeNull();
  });

  it("Vote type is structurally valid", () => {
    const v: Vote = {
      id: "v1",
      questionId: "q1",
      voterId: "voter-1",
      value: "Option A",
      submittedAt: new Date(),
    };
    expect(v.value).toBe("Option A");
  });

  it("SSEEventType covers all event types", () => {
    const eventTypes: SSEEventType[] = [
      "session.status",
      "question.advanced",
      "vote.received",
      "voting.closed",
      "results.revealed",
    ];
    expect(eventTypes).toHaveLength(5);
  });

  it("SSEEvent union discriminates correctly", () => {
    const events: SSEEvent[] = [
      { type: "session.status", data: { status: "active" } },
      {
        type: "question.advanced",
        data: { questionIndex: 0, questionId: "q1", prompt: "Q?", options: ["A"] },
      },
      { type: "vote.received", data: { questionId: "q1", totalVotes: 10 } },
      { type: "voting.closed", data: { questionId: "q1" } },
      {
        type: "results.revealed",
        data: { questionId: "q1", results: [{ value: "A", count: 5 }] },
      },
    ];
    expect(events).toHaveLength(5);
    expect(events[0]!.type).toBe("session.status");
  });
});
