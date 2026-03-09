"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";
import { Button } from "@/components/ui/button";
import { ResultsChart } from "@/components/shared/results-chart";
import { motion, AnimatePresence } from "framer-motion";
import type { SSEEvent } from "@crowdvote/types";

const GITHUB_REPO = "https://github.com/pstaylor-patrick/crowdvote";

interface QuestionState {
  questionId: string;
  questionIndex: number;
  prompt: string;
  options: string[];
}

export default function PlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionStatus, setSessionStatus] = useState("lobby");
  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<
    { value: string; count: number }[] | null
  >(null);

  const { lastEvent } = useSSE(sessionId);

  // Fetch session info on mount
  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setSessionTitle(data.title);
        setSessionStatus(data.status);
        // If session is already active, show current question
        if (data.status === "active" && data.questions?.length) {
          const q = data.questions[data.currentQuestionIndex];
          if (q) {
            setQuestion({
              questionId: q.id,
              questionIndex: data.currentQuestionIndex,
              prompt: q.prompt,
              options: q.options,
            });
          }
        }
      });
  }, [sessionId]);

  useEffect(() => {
    if (!lastEvent) return;
    const event = lastEvent as SSEEvent;
    switch (event.type) {
      case "session.status":
        setSessionStatus(event.data.status);
        if (event.data.status === "finished") {
          // Redirect to GitHub repo after a brief delay
          setTimeout(() => {
            window.location.href = GITHUB_REPO;
          }, 5000);
        }
        break;
      case "question.advanced":
        setQuestion({
          questionId: event.data.questionId,
          questionIndex: event.data.questionIndex,
          prompt: event.data.prompt,
          options: event.data.options,
        });
        setVoted(null);
        setResults(null);
        break;
      case "results.revealed":
        setResults(event.data.results);
        break;
    }
  }, [lastEvent]);

  const submitVote = useCallback(
    async (value: string) => {
      if (!question || voted || submitting) return;
      setSubmitting(true);
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          value,
        }),
      });
      if (res.ok || res.status === 409) {
        setVoted(value);
      }
      setSubmitting(false);
    },
    [question, voted, submitting]
  );

  // Finished state
  if (sessionStatus === "finished") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <h1 className="text-3xl font-bold">Thanks for playing!</h1>
          <p className="text-muted-foreground">{sessionTitle}</p>
          <p className="text-sm text-muted-foreground">
            Redirecting to CrowdVote on GitHub...
          </p>
        </motion.div>
      </div>
    );
  }

  // Waiting / Lobby
  if (!question) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">{sessionTitle || "CrowdVote"}</h1>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <p className="text-muted-foreground">
              Waiting for host to start...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active question
  return (
    <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={question.questionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex-1 flex flex-col gap-6"
        >
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Question {question.questionIndex + 1}
            </p>
            <h2 className="text-xl font-bold">{question.prompt}</h2>
          </div>

          {/* Results revealed */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1"
            >
              <ResultsChart results={results} />
              {voted && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  You voted: <span className="font-medium">{voted}</span>
                </p>
              )}
            </motion.div>
          )}

          {/* Voting UI */}
          {!results && !voted && (
            <div className="grid grid-cols-2 gap-3 flex-1 content-start">
              {question.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="xl"
                  className="h-auto min-h-[4rem] py-4 text-base whitespace-normal"
                  onClick={() => submitVote(option)}
                  disabled={submitting}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* Voted confirmation */}
          {!results && voted && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl text-primary">✓</span>
              </div>
              <p className="text-lg font-medium">Voted!</p>
              <p className="text-sm text-muted-foreground">
                Waiting for results...
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
