"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PresenterControlsProps {
  sessionId: string;
  sessionStatus: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  hasResults: boolean;
  votingClosed: boolean;
}

type ActionKey = "advance" | "close-voting" | "reveal" | "finish" | "previous" | "reset";

function getNextAction(
  status: string,
  currentQuestionIndex: number,
  totalQuestions: number,
  hasResults: boolean,
  votingClosed: boolean
): { action: ActionKey; label: string } | null {
  if (status === "lobby") {
    return { action: "advance", label: "Begin First Question" };
  }
  if (status !== "active") return null;

  if (!hasResults && !votingClosed) {
    return { action: "close-voting", label: "Close Voting" };
  }
  if (votingClosed && !hasResults) {
    return { action: "reveal", label: "Reveal Results" };
  }
  if (hasResults) {
    const isLast = currentQuestionIndex >= totalQuestions - 1;
    if (isLast) {
      return { action: "finish", label: "End Session" };
    }
    return { action: "advance", label: "Next Question" };
  }
  return null;
}

export function PresenterControls({
  sessionId,
  sessionStatus,
  currentQuestionIndex,
  totalQuestions,
  hasResults,
  votingClosed,
}: PresenterControlsProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [acting, setActing] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const nextAction = getNextAction(
    sessionStatus,
    currentQuestionIndex,
    totalQuestions,
    hasResults,
    votingClosed
  );

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowOverlay(false), 3000);
  }, []);

  const canGoPrevious = sessionStatus === "active" && currentQuestionIndex > 0;

  const doAction = useCallback(
    async (actionOverride?: ActionKey) => {
      const action = actionOverride || nextAction?.action;
      if (!action || acting) return;
      setActing(true);
      await fetch(`/api/sessions/${sessionId}/${action}`, { method: "POST" });
      setActing(false);
      setShowOverlay(false);
    },
    [sessionId, nextAction, acting]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if focus is on an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        setShowOverlay((prev) => !prev);
        return;
      }

      if (e.key === "ArrowLeft" && canGoPrevious) {
        e.preventDefault();
        doAction("previous");
        return;
      }

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (showOverlay) {
          doAction();
        } else {
          setShowOverlay(true);
          resetHideTimer();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showOverlay, doAction, resetHideTimer, canGoPrevious]);

  // Reset hide timer when overlay shown
  useEffect(() => {
    if (showOverlay) resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showOverlay, resetHideTimer]);

  if (!nextAction) return null;

  return (
    <>
      {/* Small pill trigger in bottom-right */}
      <button
        onClick={() => setShowOverlay((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/50 text-xs hover:text-white/80 transition-colors"
      >
        Press Space
      </button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm bg-black/60"
            onClick={() => setShowOverlay(false)}
            onMouseMove={resetHideTimer}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  doAction();
                }}
                disabled={acting}
                className={`px-12 py-6 rounded-2xl text-3xl font-bold text-white transition-colors ${
                  nextAction.action === "finish"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-primary hover:bg-primary/90"
                } disabled:opacity-50`}
              >
                {acting ? "..." : nextAction.label}
              </motion.button>
              {canGoPrevious && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    doAction("previous");
                  }}
                  disabled={acting}
                  className="px-6 py-2 rounded-xl text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  ← Previous Question
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
