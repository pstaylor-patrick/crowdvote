import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, questions, votes } from "@/lib/db/schema";
import { publishEvent } from "@/lib/sse";
import { getRedis } from "@/lib/redis";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!session.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const s = session[0]!;

  if (s.status !== "active" || (s.currentQuestionIndex ?? 0) <= 0) {
    return NextResponse.json({ error: "Cannot go back" }, { status: 400 });
  }

  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.sessionId, id))
    .orderBy(questions.orderIndex);

  const prevIndex = (s.currentQuestionIndex ?? 0) - 1;
  const prevQuestion = allQuestions[prevIndex]!;

  // Delete votes for the question we're going back to
  await db.delete(votes).where(eq(votes.questionId, prevQuestion.id));

  // Clear voting:closed Redis key for that question
  const redis = getRedis();
  await redis.del(`voting:closed:${prevQuestion.id}`);

  // Update session
  await db
    .update(sessions)
    .set({
      currentQuestionIndex: prevIndex,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, id));

  await publishEvent(id, {
    type: "question.advanced",
    data: {
      questionIndex: prevIndex,
      questionId: prevQuestion.id,
      prompt: prevQuestion.prompt,
      options: prevQuestion.options,
    },
  });

  return NextResponse.json({ questionIndex: prevIndex, question: prevQuestion });
}
