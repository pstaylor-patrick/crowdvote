import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, questions } from "@/lib/db/schema";
import { getEliminatedWinners } from "@/lib/eliminated-winners";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
    with: { questions: { orderBy: [asc(questions.orderIndex)] } },
  });

  if (!result) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // For active roast sessions, filter eliminated winners from current question options
  if (
    result.type === "roast" &&
    result.status === "active" &&
    result.currentQuestionIndex != null
  ) {
    const currentQ = result.questions[result.currentQuestionIndex];
    if (currentQ) {
      const eliminated = await getEliminatedWinners(id, currentQ.orderIndex);
      if (eliminated.size > 0) {
        result.questions[result.currentQuestionIndex] = {
          ...currentQ,
          options: currentQ.options.filter((o: string) => !eliminated.has(o)),
        };
      }
    }
  }

  return NextResponse.json(result);
}
