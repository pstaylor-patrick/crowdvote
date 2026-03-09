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

  return (
    <div className="space-y-3 w-full">
      {visible.map((result, i) => {
        const { percentage: pct, widthPct, isWinner } = result;

        return (
          <div key={result.value} className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span
                className={`${large ? "text-xl" : "text-sm"} font-medium ${
                  isWinner ? "text-primary" : "text-foreground"
                }`}
              >
                {result.value}
              </span>
              <span className={`${large ? "text-lg" : "text-xs"} text-muted-foreground`}>
                {result.count} vote{result.count !== 1 ? "s" : ""} ({Math.round(pct)}%)
              </span>
            </div>
            <div
              className="w-full bg-muted rounded-full overflow-hidden"
              style={{ height: large ? 32 : 20 }}
            >
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
        <p className={`${large ? "text-lg" : "text-sm"} text-muted-foreground text-center pt-2`}>
          and {hiddenCount} other{hiddenCount !== 1 ? "s" : ""} with {hiddenVotes} vote
          {hiddenVotes !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
