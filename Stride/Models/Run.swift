import Foundation

enum DistanceBucket: String, CaseIterable, Codable {
    case short  // < 3 miles
    case medium // 3-6 miles
    case long   // > 6 miles

    static func bucket(for miles: Double) -> DistanceBucket {
        if miles < 3 { return .short }
        if miles <= 6 { return .medium }
        return .long
    }

    var label: String {
        switch self {
        case .short: return "Short (<3mi)"
        case .medium: return "Medium (3-6mi)"
        case .long: return "Long (>6mi)"
        }
    }
}

struct Run: Identifiable, Codable {
    let id: UUID
    let date: Date
    let distanceMiles: Double
    let duration: TimeInterval
    let avgHeartRate: Double?
    let vo2Max: Double?

    var paceMinutesPerMile: Double {
        guard distanceMiles > 0 else { return 0 }
        return (duration / 60) / distanceMiles
    }

    var speedMph: Double {
        guard duration > 0 else { return 0 }
        return distanceMiles / (duration / 3600)
    }

    /// Speed per heart-rate beat, scaled for readability. Higher = more
    /// aerobically efficient (going faster at a lower heart rate).
    var efficiencyIndex: Double? {
        guard let hr = avgHeartRate, hr > 0 else { return nil }
        return (speedMph / hr) * 100
    }

    var distanceBucket: DistanceBucket {
        DistanceBucket.bucket(for: distanceMiles)
    }

    var paceFormatted: String {
        let minutes = Int(paceMinutesPerMile)
        let seconds = Int((paceMinutesPerMile - Double(minutes)) * 60)
        return String(format: "%d:%02d /mi", minutes, seconds)
    }
}
