"use client";

import { motion } from "framer-motion";
import { computeResults, type ResultItem } from "@/lib/results";

interface ResultsChartProps {
  results: ResultItem[];
  large?: boolean;
}

export function ResultsChart({ results, large }: ResultsChartProps) {
  const computed = computeResults(results);

  return (
    <div className="space-y-3 w-full">
      {computed.map((result, i) => {
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
    </div>
  );
}
