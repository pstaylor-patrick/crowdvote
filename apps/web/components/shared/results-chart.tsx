"use client";

import { motion } from "framer-motion";

interface ResultsChartProps {
  results: { value: string; count: number }[];
  large?: boolean;
}

export function ResultsChart({ results, large }: ResultsChartProps) {
  const maxCount = Math.max(...results.map((r) => r.count), 1);
  const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
  const sorted = [...results].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3 w-full">
      {sorted.map((result, i) => {
        const pct = totalVotes > 0 ? (result.count / totalVotes) * 100 : 0;
        const widthPct = (result.count / maxCount) * 100;
        const isWinner = i === 0 && result.count > 0;

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
            <div className="w-full bg-muted rounded-full overflow-hidden" style={{ height: large ? 32 : 20 }}>
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
