import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var healthKit: HealthKitManager

    private var scoredRuns: [ScoredRun] {
        FitnessScoreCalculator.score(runs: healthKit.runs)
    }

    var body: some View {
        NavigationStack {
            List(scoredRuns.sorted { $0.run.date > $1.run.date }) { scored in
                NavigationLink(value: scored) {
                    RunRow(scored: scored)
                }
            }
            .navigationTitle("History")
            .navigationDestination(for: ScoredRun.self) { scored in
                RunDetailView(scored: scored)
            }
            .refreshable { await healthKit.loadRuns() }
            .overlay {
                if scoredRuns.isEmpty && !healthKit.isLoading {
                    ContentUnavailableView("No Runs Yet", systemImage: "figure.run")
                }
            }
        }
    }
}

private struct RunRow: View {
    let scored: ScoredRun

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(scored.run.date, style: .date)
                    .font(.subheadline.bold())
                Text("\(String(format: "%.2f", scored.run.distanceMiles)) mi · \(scored.run.paceFormatted)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let hr = scored.run.avgHeartRate {
                    Text("Avg HR \(Int(hr)) bpm")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            if let score = scored.overallScore {
                Text("\(Int(score.rounded()))")
                    .font(.title3.bold())
                    .foregroundStyle(scoreColor(score))
            }
        }
        .padding(.vertical, 4)
    }

    private func scoreColor(_ score: Double) -> Color {
        switch score {
        case 85...: return .green
        case 65..<85: return .primary
        default: return .orange
        }
    }
}

extension ScoredRun: Hashable {
    static func == (lhs: ScoredRun, rhs: ScoredRun) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

#Preview {
    HistoryView()
        .environmentObject(HealthKitManager.shared)
}
