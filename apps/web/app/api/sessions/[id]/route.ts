import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, questions } from "@/lib/db/schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
    with: { questions: { orderBy: [asc(questions.orderIndex)] } },
  });

  if (!result) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
