import SwiftUI
import Charts

struct DashboardView: View {
    @EnvironmentObject private var healthKit: HealthKitManager

    private var scoredRuns: [ScoredRun] {
        FitnessScoreCalculator.score(runs: healthKit.runs)
    }

    private var currentScore: Double? {
        FitnessScoreCalculator.currentScore(from: scoredRuns)
    }

    private var last30Days: [Run] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -30, to: .now) ?? .now
        return healthKit.runs.filter { $0.date >= cutoff }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    if healthKit.isLoading && healthKit.runs.isEmpty {
                        ProgressView("Loading your runs…")
                            .padding(.top, 80)
                    } else if healthKit.runs.isEmpty {
                        emptyState
                    } else {
                        scoreCard
                        trendChart
                        summaryStats
                        if healthKit.runs.contains(where: { $0.vo2Max != nil }) {
                            vo2Chart
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Stride")
            .refreshable { await healthKit.loadRuns() }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.run.circle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No running workouts found in Health yet.")
                .foregroundStyle(.secondary)
        }
        .padding(.top, 80)
    }

    private var scoreCard: some View {
        VStack(spacing: 4) {
            Text("Running Fitness Score")
                .font(.headline)
                .foregroundStyle(.secondary)
            if let score = currentScore {
                Text("\(Int(score.rounded()))")
                    .font(.system(size: 64, weight: .bold, design: .rounded))
                Text("Based on your last few runs vs. your personal best pace-for-heart-rate")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            } else {
                Text("Needs a run with heart rate data")
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20))
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Fitness Trend")
                .font(.headline)
            Chart(scoredRuns.filter { $0.overallScore != nil }.sorted { $0.run.date < $1.run.date }) { scored in
                LineMark(
                    x: .value("Date", scored.run.date),
                    y: .value("Score", scored.overallScore ?? 0)
                )
                .interpolationMethod(.catmullRom)
                PointMark(
                    x: .value("Date", scored.run.date),
                    y: .value("Score", scored.overallScore ?? 0)
                )
            }
            .frame(height: 180)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20))
    }

    private var vo2Chart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("VO2 Max")
                .font(.headline)
            Chart(healthKit.runs.compactMap { run -> (Date, Double)? in
                guard let vo2 = run.vo2Max else { return nil }
                return (run.date, vo2)
            }.sorted { $0.0 < $1.0 }, id: \.0) { point in
                LineMark(x: .value("Date", point.0), y: .value("VO2Max", point.1))
                PointMark(x: .value("Date", point.0), y: .value("VO2Max", point.1))
            }
            .frame(height: 140)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20))
    }

    private var summaryStats: some View {
        HStack(spacing: 16) {
            statTile(title: "Runs (30d)", value: "\(last30Days.count)")
            statTile(title: "Avg Pace", value: averagePace)
            statTile(title: "Avg HR", value: averageHeartRate)
        }
    }

    private var averagePace: String {
        let runsWithPace = last30Days.filter { $0.distanceMiles > 0 }
        guard !runsWithPace.isEmpty else { return "–" }
        let avg = runsWithPace.map(\.paceMinutesPerMile).reduce(0, +) / Double(runsWithPace.count)
        let minutes = Int(avg)
        let seconds = Int((avg - Double(minutes)) * 60)
        return String(format: "%d:%02d", minutes, seconds)
    }

    private var averageHeartRate: String {
        let withHR = last30Days.compactMap(\.avgHeartRate)
        guard !withHR.isEmpty else { return "–" }
        return "\(Int(withHR.reduce(0, +) / Double(withHR.count)))"
    }

    private func statTile(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold())
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    DashboardView()
        .environmentObject(HealthKitManager.shared)
}
