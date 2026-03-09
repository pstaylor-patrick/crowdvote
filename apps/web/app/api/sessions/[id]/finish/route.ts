import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { publishEvent } from "@/lib/sse";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await db
    .update(sessions)
    .set({ status: "finished", updatedAt: new Date() })
    .where(eq(sessions.id, id));

  await publishEvent(id, {
    type: "session.status",
    data: { status: "finished" },
  });

  return NextResponse.json({ ok: true });
}
