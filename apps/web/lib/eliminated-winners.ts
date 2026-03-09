import { eq, lt, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, votes } from "@/lib/db/schema";

/**
 * Returns the set of candidate names that have already won a previous question
 * in the given session (before the specified orderIndex).
 * Ties: all candidates tied for first place are eliminated.
 */
export async function getEliminatedWinners(
  sessionId: string,
  beforeOrderIndex: number
): Promise<Set<string>> {
  if (beforeOrderIndex <= 0) return new Set();

  // Get all prior questions for this session
  const priorQuestions = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.sessionId, sessionId), lt(questions.orderIndex, beforeOrderIndex)));

  if (!priorQuestions.length) return new Set();

  const eliminated = new Set<string>();

  for (const q of priorQuestions) {
    // Get vote counts per candidate, ordered descending
    const tallies = await db
      .select({
        value: votes.value,
        count: sql<number>`count(*)::int`,
      })
      .from(votes)
      .where(eq(votes.questionId, q.id))
      .groupBy(votes.value)
      .orderBy(sql`count(*) desc`);

    if (tallies.length === 0) continue;

    const topCount = tallies[0]!.count;
    if (topCount === 0) continue;

    // Eliminate all candidates tied for first
    for (const t of tallies) {
      if (t.count === topCount) {
        eliminated.add(t.value);
      } else {
        break;
      }
    }
  }

  return eliminated;
}
