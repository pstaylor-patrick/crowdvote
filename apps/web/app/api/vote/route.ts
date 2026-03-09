import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { votes, questions } from "@/lib/db/schema";
import { publishEvent } from "@/lib/sse";
import { cookies } from "next/headers";

function getOrCreateVoterId(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  const existing = cookieStore.get("voter_id");
  if (existing) return existing.value;
  return createId();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questionId, value } = body;

  if (!questionId || !value) {
    return NextResponse.json(
      { error: "questionId and value are required" },
      { status: 400 }
    );
  }

  // Look up the question to get sessionId
  const question = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId));

  if (!question.length) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const voterId = getOrCreateVoterId(cookieStore);

  try {
    await db.insert(votes).values({
      id: createId(),
      questionId,
      voterId,
      value,
    });
  } catch (err: unknown) {
    // Unique constraint violation = already voted
    if (
      err instanceof Error &&
      err.message.includes("unique")
    ) {
      return NextResponse.json(
        { error: "Already voted on this question" },
        { status: 409 }
      );
    }
    throw err;
  }

  // Count total votes for this question
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(eq(votes.questionId, questionId));

  const totalVotes = countResult[0]?.count ?? 0;

  await publishEvent(question[0].sessionId, {
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
