import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, questions } from "@/lib/db/schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!session.length) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const sessionQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.sessionId, id))
    .orderBy(questions.orderIndex);

  return NextResponse.json({
    ...session[0]!,
    questions: sessionQuestions,
  });
}
