import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, questions, votes } from "@/lib/db/schema";
import { publishEvent } from "@/lib/sse";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!session.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.sessionId, id))
    .orderBy(questions.orderIndex);

  const currentQuestion = allQuestions[session[0]!.currentQuestionIndex ?? 0];
  if (!currentQuestion) {
    return NextResponse.json({ error: "No current question" }, { status: 400 });
  }

  // Aggregate votes
  const voteResults = await db
    .select({
      value: votes.value,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .where(eq(votes.questionId, currentQuestion.id))
    .groupBy(votes.value);

  const results = voteResults.map((r) => ({
    value: r.value,
    count: r.count,
  }));

  await publishEvent(id, {
    type: "results.revealed",
    data: {
      questionId: currentQuestion.id,
      results,
    },
  });

  return NextResponse.json({ results });
}
