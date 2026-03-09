"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useSSE } from "@/hooks/use-sse";
import { ResultsChart } from "@/components/shared/results-chart";
import { PresenterControls } from "@/components/shared/presenter-controls";
import { motion, AnimatePresence } from "framer-motion";
import { getAppUrl } from "@/lib/actions";

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

export default function PresentationPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [appUrl, setAppUrl] = useState("");
  const [voteCount, setVoteCount] = useState(0);
  const [results, setResults] = useState<{ value: string; count: number }[] | null>(null);
  const [votingClosed, setVotingClosed] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
    prompt: string;
    options: string[];
    questionId: string;
    questionIndex: number;
  } | null>(null);

  const { lastEvent, isConnected } = useSSE(id);

  useEffect(() => {
    getAppUrl().then(setAppUrl);
  }, []);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) setSession(await res.json());
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!lastEvent) return;
    switch (lastEvent.type) {
      case "session.status":
        setSession((prev) => (prev ? { ...prev, status: lastEvent.data.status } : prev));
        break;
      case "question.advanced":
        setCurrentQuestion({
          prompt: lastEvent.data.prompt,
          options: lastEvent.data.options,
          questionId: lastEvent.data.questionId,
          questionIndex: lastEvent.data.questionIndex,
        });
        setVoteCount(0);
        setResults(null);
        setVotingClosed(false);
        break;
      case "vote.received":
        setVoteCount(lastEvent.data.totalVotes);
        break;
      case "voting.closed":
        setVotingClosed(true);
        break;
      case "results.revealed":
        setResults(lastEvent.data.results);
        break;
    }
  }, [lastEvent]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-2xl">Loading...</p>
      </div>
    );
  }

  const joinUrl = `${appUrl}/join/${session.code}`;
  const totalQuestions = session.questions.length;
  const isRoast = session.type === "roast";

  const controlsProps = {
    sessionId: id,
    sessionStatus: session.status,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions,
    hasResults: !!results,
    votingClosed,
  };

  // Lobby view — QR code prominently
  if (session.status === "draft" || session.status === "lobby") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 gap-8">
        <h1 className="text-5xl font-bold">{session.title}</h1>

        <div className="bg-white p-6 rounded-2xl">
          <QRCodeSVG value={joinUrl} size={300} level="H" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-2xl font-mono">{joinUrl}</p>
          <p className="text-4xl font-bold font-mono tracking-widest">{session.code}</p>
        </div>

        <p className="text-xl text-gray-400">
          {session.status === "draft" ? "Session not started yet" : "Scan QR code to join!"}
        </p>

        <div className="absolute top-4 right-4 text-sm text-gray-500">
          {isConnected ? "Connected" : "Reconnecting..."}
        </div>

        <PresenterControls {...controlsProps} />
      </div>
    );
  }

  // Finished
  if (session.status === "finished") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 gap-6">
        <h1 className="text-5xl font-bold">Thanks for playing!</h1>
        <p className="text-2xl text-gray-400">{session.title}</p>
      </div>
    );
  }

  // Active — show question + results
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 gap-8">
      {/* Small QR in corner for late joiners */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-lg opacity-80">
        <QRCodeSVG value={joinUrl} size={80} level="M" />
      </div>

      <div className="absolute top-4 right-4 text-sm text-gray-500">
        {isConnected ? "Connected" : "Reconnecting..."}
      </div>

      <AnimatePresence mode="wait">
        {/* Voting open — question + live vote count */}
        {currentQuestion && !results && !votingClosed && (
          <motion.div
            key={`q-${currentQuestion.questionIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 max-w-4xl"
          >
            <p className="text-lg text-gray-400">
              Question {currentQuestion.questionIndex + 1} of {totalQuestions}
            </p>
            <h2 className="text-5xl font-bold leading-tight">{currentQuestion.prompt}</h2>
            <motion.p
              key={voteCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl text-primary font-mono"
            >
              {voteCount} vote{voteCount !== 1 ? "s" : ""}
            </motion.p>
          </motion.div>
        )}

        {/* Voting closed — curtain covering results */}
        {currentQuestion && votingClosed && !results && (
          <motion.div
            key={`locked-${currentQuestion.questionIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl space-y-6 text-center"
          >
            <p className="text-lg text-gray-400">
              Question {currentQuestion.questionIndex + 1} of {totalQuestions}
            </p>
            <h2 className="text-4xl font-bold">{currentQuestion.prompt}</h2>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-3 bg-red-600/90 px-6 py-3 rounded-xl"
            >
              <span className="text-2xl font-bold tracking-wider">VOTES LOCKED</span>
              <span className="text-xl font-mono">{voteCount}</span>
            </motion.div>
            {/* Curtain */}
            <motion.div
              className="w-full h-64 rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center"
              initial={{ opacity: 0, scaleY: 0.8 }}
              animate={{ opacity: 1, scaleY: 1 }}
            >
              <p className="text-2xl text-gray-500 font-medium">Results behind the curtain...</p>
            </motion.div>
          </motion.div>
        )}

        {/* Results revealed */}
        {currentQuestion && results && (
          <motion.div
            key={`r-${currentQuestion.questionIndex}`}
            initial={{ opacity: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-3xl space-y-6"
          >
            <p className="text-lg text-gray-400 text-center">
              Question {currentQuestion.questionIndex + 1} of {totalQuestions}
            </p>
            <h2 className="text-3xl font-bold text-center">{currentQuestion.prompt}</h2>
            <ResultsChart results={results} large maxVisible={isRoast ? 10 : undefined} />
          </motion.div>
        )}
      </AnimatePresence>

      <PresenterControls {...controlsProps} />
    </div>
  );
}
