import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // validate route param exists
  const questionId = req.nextUrl.searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "questionId is required" }, { status: 400 });
  }

  const count = await getRedis().get(`votes:count:${questionId}`);
  return NextResponse.json({ totalVotes: count ? parseInt(count, 10) : 0 });
}
