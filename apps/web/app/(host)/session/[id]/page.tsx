"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useSSE } from "@/hooks/use-sse";
import { ResultsChart } from "@/components/shared/results-chart";
import { getAppUrl } from "@/lib/actions";
import {
  Hash,
  Presentation,
  Play,
  SkipBack,
  SkipForward,
  Lock,
  Eye,
  Flag,
  ArrowCounterClockwise,
  Copy,
  CheckCircle,
  CircleNotch,
  CaretDown,
  CaretRight,
} from "@phosphor-icons/react";

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
  const [appUrl, setAppUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(0);
  const [results, setResults] = useState<{ value: string; count: number }[] | null>(null);
  const [votingClosed, setVotingClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const { lastEvent } = useSSE(id);

  useEffect(() => {
    getAppUrl().then(setAppUrl);
  }, []);

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
    switch (lastEvent.type) {
      case "vote.received":
        setVoteCount(lastEvent.data.totalVotes);
        break;
      case "results.revealed":
        setResults(lastEvent.data.results);
        break;
      case "voting.closed":
        setVotingClosed(true);
        break;
      case "question.advanced":
        setVoteCount(0);
        setResults(null);
        setVotingClosed(false);
        fetchSession();
        break;
      case "session.status":
        setSession((prev) => (prev ? { ...prev, status: lastEvent.data.status } : prev));
        break;
    }
  }, [lastEvent, fetchSession]);

  const doAction = async (action: string) => {
    await fetch(`/api/sessions/${id}/${action}`, { method: "POST" });
    fetchSession();
  };

  const copyJoinUrl = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <CircleNotch size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return <div className="p-8">Session not found</div>;

  const currentQ = session.questions[session.currentQuestionIndex];
  const isLastQuestion = session.currentQuestionIndex >= session.questions.length - 1;
  const joinUrl = `${appUrl}/join/${session.code}`;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{session.title}</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-mono font-bold">
              <Hash size={14} />
              {session.code}
            </span>
            <StatusBadge status={session.status} />
          </div>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <a href={`/session/${id}/present`} target="_blank">
            <Presentation size={18} />
            Open Presentation
          </a>
        </Button>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl bg-secondary/50 border p-4"
      >
        <div className="flex flex-wrap gap-3">
          {session.status === "draft" && (
            <Button onClick={() => doAction("start")} size="lg" className="gap-2">
              <Play size={20} weight="fill" />
              Open Lobby
            </Button>
          )}
          {session.status === "lobby" && (
            <Button onClick={() => doAction("advance")} size="lg" className="gap-2">
              <Play size={20} weight="fill" />
              Begin First Question
            </Button>
          )}
          {session.status === "active" && (
            <>
              {session.currentQuestionIndex > 0 && (
                <Button variant="outline" onClick={() => doAction("previous")} className="gap-2">
                  <SkipBack size={18} weight="fill" />
                  Previous
                </Button>
              )}
              {!results && !votingClosed && (
                <Button onClick={() => doAction("close-voting")} className="gap-2">
                  <Lock size={18} weight="fill" />
                  Close Voting
                </Button>
              )}
              {!results && votingClosed && (
                <Button onClick={() => doAction("reveal")} size="lg" className="gap-2">
                  <Eye size={20} weight="fill" />
                  Reveal Results
                </Button>
              )}
              {results && !isLastQuestion && (
                <Button onClick={() => doAction("advance")} size="lg" className="gap-2">
                  <SkipForward size={20} weight="fill" />
                  Next Question
                </Button>
              )}
              {results && isLastQuestion && (
                <Button variant="destructive" onClick={() => doAction("finish")} className="gap-2">
                  <Flag size={18} weight="fill" />
                  End Session
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm("Reset to lobby? This will delete all votes.")) {
                    doAction("reset");
                  }
                }}
                className="gap-2"
              >
                <ArrowCounterClockwise size={18} />
                Reset
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Join Info */}
      {(session.status === "lobby" || session.status === "active") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <QRCodeSVG value={joinUrl} size={120} />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">Join URL</p>
                  <p className="font-mono text-sm break-all">{joinUrl}</p>
                  <p className="text-4xl font-mono font-bold tracking-widest">{session.code}</p>
                  <Button variant="outline" size="sm" onClick={copyJoinUrl} className="gap-2">
                    {copied ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy URL
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Current Question */}
      {session.status === "active" && currentQ && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Q{session.currentQuestionIndex + 1}/{session.questions.length}: {currentQ.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span>
                  Votes received:{" "}
                  <motion.span
                    key={voteCount}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="font-bold text-foreground"
                  >
                    {voteCount}
                  </motion.span>
                </span>
              </div>
              {results && <ResultsChart results={results} />}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Questions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Questions ({session.questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {session.questions.map((q, i) => {
                const isActive = i === session.currentQuestionIndex && session.status === "active";
                const isExpanded = expandedQuestion === q.id;

                return (
                  <div
                    key={q.id}
                    className={`transition-colors ${isActive ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
                  >
                    <button
                      onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                      className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold flex-shrink-0 ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`flex-1 ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                      >
                        {q.prompt}
                      </span>
                      {isExpanded ? (
                        <CaretDown size={16} className="text-muted-foreground flex-shrink-0" />
                      ) : (
                        <CaretRight size={16} className="text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-3 pl-16">
                            <ul className="space-y-1">
                              {q.options.map((opt, oIdx) => (
                                <li key={oIdx} className="text-sm text-muted-foreground">
                                  {String.fromCharCode(65 + oIdx)}. {opt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
