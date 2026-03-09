export interface Vote {
  id: string;
  questionId: string;
  voterId: string;
  value: string;
  submittedAt: Date;
}
