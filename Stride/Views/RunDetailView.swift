import SwiftUI

struct RunDetailView: View {
    let scored: ScoredRun

    private var run: Run { scored.run }

    var body: some View {
        List {
            Section {
                LabeledContent("Date", value: run.date.formatted(date: .abbreviated, time: .shortened))
                LabeledContent("Distance", value: String(format: "%.2f mi", run.distanceMiles))
                LabeledContent("Duration", value: durationFormatted)
                LabeledContent("Pace", value: run.paceFormatted)
                if let hr = run.avgHeartRate {
                    LabeledContent("Avg Heart Rate", value: "\(Int(hr)) bpm")
                }
                if let vo2 = run.vo2Max {
                    LabeledContent("VO2 Max", value: String(format: "%.1f mL/kg/min", vo2))
                }
                LabeledContent("Distance Bucket", value: run.distanceBucket.label)
            } header: {
                Text("Run")
            }

            Section {
                if let efficiency = scored.efficiencyScore {
                    LabeledContent("Pace-for-HR Score", value: "\(Int(efficiency.rounded()))")
                }
                if let vo2Score = scored.vo2Score {
                    LabeledContent("VO2 Max Score", value: "\(Int(vo2Score.rounded()))")
                }
                if let overall = scored.overallScore {
                    LabeledContent("Overall Score", value: "\(Int(overall.rounded()))")
                        .font(.headline)
                }
                Text("Scores compare this run against your personal best at a similar distance, so a 100 means this run matched your best-ever effort in that range.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } header: {
                Text("Fitness Score")
            }
        }
        .navigationTitle("Run Details")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var durationFormatted: String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute, .second]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: run.duration) ?? "–"
    }
}
