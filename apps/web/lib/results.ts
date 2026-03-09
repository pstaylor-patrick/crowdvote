export interface ResultItem {
  value: string;
  count: number;
}

export interface ComputedResult extends ResultItem {
  percentage: number;
  widthPct: number;
  isWinner: boolean;
}

export function computeResults(results: ResultItem[]): ComputedResult[] {
  if (results.length === 0) return [];

  const maxCount = Math.max(...results.map((r) => r.count), 1);
  const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
  const sorted = [...results].sort((a, b) => b.count - a.count);

  return sorted.map((result, i) => ({
    ...result,
    percentage: totalVotes > 0 ? (result.count / totalVotes) * 100 : 0,
    widthPct: (result.count / maxCount) * 100,
    isWinner: i === 0 && result.count > 0,
  }));
}
