import { DistanceBucket, Run, distanceBucket, efficiencyIndex } from '../types/Run';

/**
 * A per-run fitness score, scored against *your own* history rather than
 * generic population tables (no age, resting HR, or max HR required).
 *
 * Two things are tracked and blended:
 * 1. Efficiency (speed per heart-rate beat), compared against your personal
 *    best at a similar distance -- since heart rate naturally runs higher on
 *    longer runs, "similar distance" means the same DistanceBucket.
 * 2. VO2max, compared against your personal best, when Health has it.
 *
 * A score of 100 means "matching your best-ever effort in that bucket";
 * a rising trend over time means you're getting fitter.
 */
export interface ScoredRun {
  run: Run;
  efficiencyScore?: number;
  vo2Score?: number;
  overallScore?: number;
}

function personalBests(pairs: Array<[DistanceBucket, number]>): Partial<Record<DistanceBucket, number>> {
  const result: Partial<Record<DistanceBucket, number>> = {};
  for (const [bucket, value] of pairs) {
    result[bucket] = Math.max(result[bucket] ?? 0, value);
  }
  return result;
}

export function scoreRuns(runs: Run[]): ScoredRun[] {
  const eiPairs: Array<[DistanceBucket, number]> = [];
  for (const run of runs) {
    const ei = efficiencyIndex(run);
    if (ei !== undefined) eiPairs.push([distanceBucket(run), ei]);
  }
  const bestEIByBucket = personalBests(eiPairs);

  const vo2Values = runs.map((r) => r.vo2Max).filter((v): v is number => v !== undefined);
  const bestVO2 = vo2Values.length ? Math.max(...vo2Values) : undefined;

  return runs.map((run) => {
    const ei = efficiencyIndex(run);
    const bucket = distanceBucket(run);
    const bestEI = bestEIByBucket[bucket];
    const efficiencyScore = ei !== undefined && bestEI ? Math.min(100, (ei / bestEI) * 100) : undefined;

    const vo2Score = run.vo2Max !== undefined && bestVO2 ? Math.min(100, (run.vo2Max / bestVO2) * 100) : undefined;

    let overallScore: number | undefined;
    if (efficiencyScore !== undefined && vo2Score !== undefined) {
      overallScore = 0.6 * efficiencyScore + 0.4 * vo2Score;
    } else if (efficiencyScore !== undefined) {
      overallScore = efficiencyScore;
    } else if (vo2Score !== undefined) {
      overallScore = vo2Score;
    }

    return { run, efficiencyScore, vo2Score, overallScore };
  });
}

/**
 * Current fitness score: average of the most recent 4 scored runs
 * (smooths out one noisy run while staying responsive to recent trend).
 */
export function currentScore(scoredRuns: ScoredRun[]): number | undefined {
  const recent = [...scoredRuns]
    .sort((a, b) => b.run.date.getTime() - a.run.date.getTime())
    .map((s) => s.overallScore)
    .filter((v): v is number => v !== undefined)
    .slice(0, 4);
  if (recent.length === 0) return undefined;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}
