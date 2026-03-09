export interface SeedQuestion {
  prompt: string;
  options: string[];
  timeLimitSeconds?: number;
}

export interface SeedConfig {
  title: string;
  code: string;
  type: "poll" | "quiz" | "roast";
  settings?: Record<string, unknown>;
  questions: SeedQuestion[];
}
