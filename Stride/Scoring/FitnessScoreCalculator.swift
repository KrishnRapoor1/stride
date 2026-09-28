import Foundation

/// A per-run fitness score, scored against *your own* history rather than
/// generic population tables (no age, resting HR, or max HR required).
///
/// Two things are tracked and blended:
/// 1. Efficiency (speed per heart-rate beat), compared against your personal
///    best at a similar distance — since heart rate naturally runs higher on
///    longer runs, "similar distance" means the same DistanceBucket.
/// 2. VO2max, compared against your personal best, when Health has it.
///
/// A score of 100 means "matching your best-ever effort in that bucket";
/// a rising trend over time means you're getting fitter.
struct ScoredRun: Identifiable {
    let run: Run
    var id: UUID { run.id }
    let efficiencyScore: Double?
    let vo2Score: Double?
    let overallScore: Double?
}

enum FitnessScoreCalculator {
    static func score(runs: [Run]) -> [ScoredRun] {
        let bestEIByBucket = personalBests(of: runs.compactMap { run in
            run.efficiencyIndex.map { (run.distanceBucket, $0) }
        })
        let bestVO2 = runs.compactMap(\.vo2Max).max()

        return runs.map { run in
            let efficiencyScore = run.efficiencyIndex.flatMap { ei -> Double? in
                guard let best = bestEIByBucket[run.distanceBucket], best > 0 else { return nil }
                return min(100, (ei / best) * 100)
            }
            let vo2Score = run.vo2Max.flatMap { vo2 -> Double? in
                guard let best = bestVO2, best > 0 else { return nil }
                return min(100, (vo2 / best) * 100)
            }

            let overall: Double?
            switch (efficiencyScore, vo2Score) {
            case let (.some(e), .some(v)):
                overall = 0.6 * e + 0.4 * v
            case let (.some(e), .none):
                overall = e
            case let (.none, .some(v)):
                overall = v
            case (.none, .none):
                overall = nil
            }

            return ScoredRun(run: run, efficiencyScore: efficiencyScore, vo2Score: vo2Score, overallScore: overall)
        }
    }

    /// Current fitness score: average of the most recent 4 scored runs
    /// (smooths out one noisy run while staying responsive to recent trend).
    static func currentScore(from scoredRuns: [ScoredRun]) -> Double? {
        let recent = scoredRuns
            .sorted { $0.run.date > $1.run.date }
            .compactMap(\.overallScore)
            .prefix(4)
        guard !recent.isEmpty else { return nil }
        return recent.reduce(0, +) / Double(recent.count)
    }

    private static func personalBests(of pairs: [(DistanceBucket, Double)]) -> [DistanceBucket: Double] {
        var result: [DistanceBucket: Double] = [:]
        for (bucket, value) in pairs {
            result[bucket] = max(result[bucket] ?? 0, value)
        }
        return result
    }
}
