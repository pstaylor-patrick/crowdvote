"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSSE } from "@/hooks/use-sse";
import { ResultsChart } from "@/components/shared/results-chart";
import type { SSEEvent } from "@crowdvote/types";

interface Question {
  id: string;
  prompt: string;
  options: string[];
  orderIndex: number;
}

interface SessionData {
  id: string;
  title: string;
  code: string;
  type: string;
  status: string;
  currentQuestionIndex: number;
  questions: Question[];
}

export default function SessionControlPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(0);
  const [results, setResults] = useState<
    { value: string; count: number }[] | null
  >(null);

  const { lastEvent } = useSSE(id);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSession(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!lastEvent) return;
    const event = lastEvent as SSEEvent;
    switch (event.type) {
      case "vote.received":
        setVoteCount(event.data.totalVotes);
        break;
      case "results.revealed":
        setResults(event.data.results);
        break;
      case "question.advanced":
        setVoteCount(0);
        setResults(null);
        fetchSession();
        break;
      case "session.status":
        fetchSession();
        break;
    }
  }, [lastEvent, fetchSession]);

  const doAction = async (action: string) => {
    await fetch(`/api/sessions/${id}/${action}`, { method: "POST" });
    fetchSession();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!session) return <div className="p-6">Session not found</div>;

  const currentQ = session.questions[session.currentQuestionIndex];
  const isLastQuestion =
    session.currentQuestionIndex >= session.questions.length - 1;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const joinUrl = `${appUrl}/join/${session.code}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{session.title}</h1>
          <p className="text-muted-foreground">
            Code: <span className="font-mono font-bold">{session.code}</span>
            {" | "}Status: {session.status}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/session/${id}/present`} target="_blank">
            Open Presentation
          </a>
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {session.status === "draft" && (
            <Button onClick={() => doAction("start")}>
              Open Lobby
            </Button>
          )}
          {session.status === "lobby" && (
            <Button onClick={() => doAction("advance")}>
              Begin First Question
            </Button>
          )}
          {session.status === "active" && (
            <>
              {!results && (
                <Button onClick={() => doAction("reveal")}>
                  Reveal Results
                </Button>
              )}
              {results && !isLastQuestion && (
                <Button onClick={() => doAction("advance")}>
                  Next Question
                </Button>
              )}
              {results && isLastQuestion && (
                <Button
                  variant="destructive"
                  onClick={() => doAction("finish")}
                >
                  End Session
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Join Info */}
      {(session.status === "lobby" || session.status === "active") && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Join URL:</p>
            <p className="font-mono text-lg">{joinUrl}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Question */}
      {session.status === "active" && currentQ && (
        <Card>
          <CardHeader>
            <CardTitle>
              Q{session.currentQuestionIndex + 1}/{session.questions.length}:{" "}
              {currentQ.prompt}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Votes received: {voteCount}
            </p>
            {results && <ResultsChart results={results} />}
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Questions ({session.questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            {session.questions.map((q, i) => (
              <li
                key={q.id}
                className={
                  i === session.currentQuestionIndex && session.status === "active"
                    ? "font-bold text-primary"
                    : "text-muted-foreground"
                }
              >
                {q.prompt}
                <span className="text-xs ml-2">
                  ({(q.options as string[]).join(", ")})
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
