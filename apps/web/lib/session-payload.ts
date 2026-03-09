export interface QuestionInput {
  prompt: string;
  options: string[];
}

export function buildSessionPayload(title: string, questions: QuestionInput[]) {
  return {
    title: title.trim(),
    type: "roast",
    questions: questions
      .filter((q) => q.prompt.trim())
      .map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.filter((o) => o.trim()),
      })),
  };
}
