export type SessionType = "poll" | "quiz" | "roast";
export type SessionStatus = "draft" | "lobby" | "active" | "finished";

export interface Session {
  id: string;
  title: string;
  code: string;
  type: SessionType;
  status: SessionStatus;
  currentQuestionIndex: number;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  title: string;
  type: SessionType;
  questions: CreateQuestionInput[];
}

export interface CreateQuestionInput {
  prompt: string;
  options: string[];
}
