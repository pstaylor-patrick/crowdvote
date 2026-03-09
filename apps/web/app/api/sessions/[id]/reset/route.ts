import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
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

  const allQuestions = await db.select().from(questions).where(eq(questions.sessionId, id));

  // Delete all votes for this session's questions
  if (allQuestions.length > 0) {
    const questionIds = allQuestions.map((q) => q.id);
    await db.delete(votes).where(inArray(votes.questionId, questionIds));

    // Clear all voting:closed Redis keys
    const redis = getRedis();
    const keys = questionIds.flatMap((qId) => [`voting:closed:${qId}`, `votes:count:${qId}`]);
    await redis.del(...keys);
  }

  // Reset session to lobby
  await db
    .update(sessions)
    .set({
      status: "lobby",
      currentQuestionIndex: 0,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, id));

  await publishEvent(id, {
    type: "session.status",
    data: { status: "lobby" },
  });

  return NextResponse.json({ status: "lobby" });
}
