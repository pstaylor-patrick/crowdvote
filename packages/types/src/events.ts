export type SSEEventType =
  | "session.status"
  | "question.advanced"
  | "vote.received"
  | "voting.closed"
  | "results.revealed";

export interface SessionStatusEvent {
  type: "session.status";
  data: { status: string };
}

export interface QuestionAdvancedEvent {
  type: "question.advanced";
  data: {
    questionIndex: number;
    questionId: string;
    prompt: string;
    options: string[];
  };
}

export interface VoteReceivedEvent {
  type: "vote.received";
  data: {
    questionId: string;
    totalVotes: number;
  };
}

export interface VotingClosedEvent {
  type: "voting.closed";
  data: {
    questionId: string;
  };
}

export interface ResultsRevealedEvent {
  type: "results.revealed";
  data: {
    questionId: string;
    results: { value: string; count: number }[];
  };
}

export type SSEEvent =
  | SessionStatusEvent
  | QuestionAdvancedEvent
  | VoteReceivedEvent
  | VotingClosedEvent
  | ResultsRevealedEvent;
