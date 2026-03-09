import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { sessions, questions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { generateCode } from "@/lib/codes";

export async function GET() {
  const allSessions = await db.select().from(sessions).orderBy(desc(sessions.createdAt));
  return NextResponse.json(allSessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, type, questions: questionInputs } = body;

  const sessionId = createId();
  const code = generateCode();

  await db.insert(sessions).values({
    id: sessionId,
    title,
    code,
    type: type || "roast",
    status: "draft",
    currentQuestionIndex: 0,
  });

  if (questionInputs?.length) {
    await db.insert(questions).values(
      questionInputs.map((q: { prompt: string; options: string[] }, i: number) => ({
        id: createId(),
        sessionId,
        orderIndex: i,
        prompt: q.prompt,
        options: q.options,
      }))
    );
  }

  const session = await db
    .select()
    .from(sessions)
    .where((await import("drizzle-orm")).eq(sessions.id, sessionId));

  return NextResponse.json(session[0]!, { status: 201 });
}
