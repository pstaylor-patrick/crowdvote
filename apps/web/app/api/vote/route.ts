import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { votes, questions, sessions } from "@/lib/db/schema";
import { publishEvent } from "@/lib/sse";
import { getRedis } from "@/lib/redis";
import { cookies } from "next/headers";
import { getEliminatedWinners } from "@/lib/eliminated-winners";

function getOrCreateVoterId(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  const existing = cookieStore.get("voter_id");
  if (existing) return existing.value;
  return createId();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questionId, value, fingerprint } = body;

  if (!questionId || !value) {
    return NextResponse.json({ error: "questionId and value are required" }, { status: 400 });
  }

  // Look up the question to get sessionId
  const question = await db.select().from(questions).where(eq(questions.id, questionId));

  if (!question.length) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Reject votes for eliminated candidates in roast sessions
  const q = question[0]!;
  const session = await db
    .select({ type: sessions.type })
    .from(sessions)
    .where(eq(sessions.id, q.sessionId));
  if (session.length && session[0]!.type === "roast") {
    const eliminated = await getEliminatedWinners(q.sessionId, q.orderIndex);
    if (eliminated.has(value)) {
      return NextResponse.json(
        { error: "This candidate has already been eliminated" },
        { status: 400 }
      );
    }
  }

  const isClosed = await getRedis().exists(`voting:closed:${questionId}`);
  if (isClosed) {
    return NextResponse.json({ error: "Voting is closed" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const voterId = getOrCreateVoterId(cookieStore);

  try {
    await db.insert(votes).values({
      id: createId(),
      questionId,
      voterId,
      fingerprint: fingerprint || null,
      value,
    });
    await getRedis().incr(`votes:count:${questionId}`);
  } catch (err: unknown) {
    // Unique constraint violation = already voted
    if (err instanceof Error && err.message.includes("unique")) {
      return NextResponse.json({ error: "Already voted on this question" }, { status: 409 });
    }
    throw err;
  }

  // Count total votes for this question
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(eq(votes.questionId, questionId));

  const totalVotes = countResult[0]?.count ?? 0;

  await publishEvent(q.sessionId, {
    type: "vote.received",
    data: { questionId, totalVotes },
  });

  const response = NextResponse.json({ ok: true, totalVotes });

  // Set voter cookie if new
  if (!cookieStore.get("voter_id")) {
    response.cookies.set("voter_id", voterId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  return response;
}
