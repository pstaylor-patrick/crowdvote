import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const result = await db.select().from(sessions).where(eq(sessions.code, code.toUpperCase()));

  if (result.length) {
    redirect(`/play/${result[0]!.id}`);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <p className="text-xl font-bold">Session not found</p>
      <p className="text-muted-foreground">
        Check the code and try again: <span className="font-mono">{code}</span>
      </p>
    </div>
  );
}
