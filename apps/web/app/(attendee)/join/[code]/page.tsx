"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "waiting" | "error">("loading");
  const [sessionTitle, setSessionTitle] = useState("");

  useEffect(() => {
    // Look up session by code
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((sessions) => {
        const session = sessions.find(
          (s: { code: string }) => s.code.toUpperCase() === code.toUpperCase()
        );
        if (session) {
          setSessionTitle(session.title);
          setStatus("waiting");
          // Redirect to play page — SSE will handle waiting for questions
          router.replace(`/play/${session.id}`);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [code, router]);

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xl text-muted-foreground">Joining...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-xl font-bold">Session not found</p>
        <p className="text-muted-foreground">
          Check the code and try again: <span className="font-mono">{code}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <p className="text-2xl font-bold">{sessionTitle}</p>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
