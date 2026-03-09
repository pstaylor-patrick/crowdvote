"use client";

import { motion } from "framer-motion";
import { computeResults, type ResultItem } from "@/lib/results";

interface ResultsChartProps {
  results: ResultItem[];
  large?: boolean;
  maxVisible?: number;
}

export function ResultsChart({ results, large, maxVisible }: ResultsChartProps) {
  const computed = computeResults(results);
  const visible = maxVisible ? computed.slice(0, maxVisible) : computed;
  const hiddenCount = computed.length - visible.length;
  const hiddenVotes = computed.slice(visible.length).reduce((sum, r) => sum + r.count, 0);

  if (large) {
    return (
      <div className="w-full space-y-2">
        {visible.map((result, i) => (
          <motion.div
            key={result.value}
            initial={{ opacity: 0, x: -40, rotateX: 90 }}
            animate={{ opacity: 1, x: 0, rotateX: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.3,
              ease: "easeOut",
            }}
            className={`flex items-center rounded-lg border-2 overflow-hidden ${
              result.isWinner
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-blue-500/40 bg-blue-950/60"
            }`}
          >
            <div
              className={`w-14 flex-shrink-0 flex items-center justify-center text-2xl font-bold py-4 ${
                result.isWinner ? "bg-yellow-400 text-black" : "bg-blue-600 text-white"
              }`}
            >
              {i + 1}
            </div>
            <div className="flex-1 px-5 py-4 flex items-center justify-between min-w-0">
              <span
                className={`text-xl font-semibold truncate ${
                  result.isWinner ? "text-yellow-300" : "text-white"
                }`}
              >
                {result.value}
              </span>
              <span
                className={`text-xl font-mono font-bold flex-shrink-0 ml-4 ${
                  result.isWinner ? "text-yellow-300" : "text-blue-300"
                }`}
              >
                {result.count}
              </span>
            </div>
          </motion.div>
        ))}
        {hiddenCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: visible.length * 0.3 }}
            className="text-lg text-gray-400 text-center pt-3"
          >
            and {hiddenCount} other{hiddenCount !== 1 ? "s" : ""} with {hiddenVotes} vote
            {hiddenVotes !== 1 ? "s" : ""}
          </motion.p>
        )}
      </div>
    );
  }

  // Small bar chart style (voter phone view)
  return (
    <div className="space-y-3 w-full">
      {visible.map((result, i) => {
        const { percentage: pct, widthPct, isWinner } = result;

        return (
          <div key={result.value} className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span
                className={`text-sm font-medium ${isWinner ? "text-primary" : "text-foreground"}`}
              >
                {result.value}
              </span>
              <span className="text-xs text-muted-foreground">
                {result.count} vote{result.count !== 1 ? "s" : ""} ({Math.round(pct)}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full overflow-hidden" style={{ height: 20 }}>
              <motion.div
                className={`h-full rounded-full ${isWinner ? "bg-primary" : "bg-primary/60"}`}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
              />
            </div>
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          and {hiddenCount} other{hiddenCount !== 1 ? "s" : ""} with {hiddenVotes} vote
          {hiddenVotes !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
