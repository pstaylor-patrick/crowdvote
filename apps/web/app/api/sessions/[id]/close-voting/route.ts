import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, questions } from "@/lib/db/schema";
import { publishEvent } from "@/lib/sse";
import { getRedis } from "@/lib/redis";

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

  const redis = getRedis();
  await redis.set(`voting:closed:${currentQuestion.id}`, "1", "EX", 3600);

  await publishEvent(id, {
    type: "voting.closed",
    data: {
      questionId: currentQuestion.id,
    },
  });

  return NextResponse.json({ ok: true });
}
