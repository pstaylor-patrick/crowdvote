export interface Question {
  id: string;
  sessionId: string;
  orderIndex: number;
  prompt: string;
  options: string[];
  timeLimitSeconds: number | null;
  createdAt: Date;
}
