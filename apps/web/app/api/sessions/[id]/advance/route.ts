import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, questions } from "@/lib/db/schema";
import { publishEvent } from "@/lib/sse";
import { getEliminatedWinners } from "@/lib/eliminated-winners";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!session.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const s = session[0]!;
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.sessionId, id))
    .orderBy(questions.orderIndex);

  const nextIndex = s.status === "lobby" ? 0 : (s.currentQuestionIndex ?? 0) + 1;

  if (nextIndex >= allQuestions.length) {
    return NextResponse.json({ error: "No more questions" }, { status: 400 });
  }

  const nextQuestion = allQuestions[nextIndex]!;

  // For roast sessions, filter out previous winners from options
  let filteredOptions = nextQuestion.options;
  if (s.type === "roast") {
    const eliminated = await getEliminatedWinners(id, nextQuestion.orderIndex);
    filteredOptions = nextQuestion.options.filter((o: string) => !eliminated.has(o));
  }

  await db
    .update(sessions)
    .set({
      status: "active",
      currentQuestionIndex: nextIndex,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, id));

  await publishEvent(id, {
    type: "question.advanced",
    data: {
      questionIndex: nextIndex,
      questionId: nextQuestion.id,
      prompt: nextQuestion.prompt,
      options: filteredOptions,
    },
  });

  return NextResponse.json({
    questionIndex: nextIndex,
    question: { ...nextQuestion, options: filteredOptions },
  });
}
