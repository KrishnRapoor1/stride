import Foundation
import HealthKit

@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    private let store = HKHealthStore()

    @Published var isAuthorized = false
    @Published var runs: [Run] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let heartRateType = HKQuantityType(.heartRate)
    private let vo2MaxType = HKQuantityType(.vo2Max)
    private let workoutType = HKObjectType.workoutType()

    var isHealthDataAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async {
        guard isHealthDataAvailable else {
            errorMessage = "Health data isn't available on this device."
            return
        }
        let readTypes: Set<HKObjectType> = [workoutType, heartRateType, vo2MaxType]
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            isAuthorized = true
            await loadRuns()
        } catch {
            errorMessage = "Couldn't get permission to read Health data: \(error.localizedDescription)"
        }
    }

    func loadRuns() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let workouts = try await fetchRunningWorkouts()
            var loaded: [Run] = []
            for workout in workouts {
                let avgHR = try await averageHeartRate(for: workout)
                let vo2 = try await vo2Max(near: workout.startDate)
                let miles = workout.totalDistance?.doubleValue(for: .mile()) ?? 0
                guard miles > 0 else { continue }
                loaded.append(
                    Run(
                        id: UUID(),
                        date: workout.startDate,
                        distanceMiles: miles,
                        duration: workout.duration,
                        avgHeartRate: avgHR,
                        vo2Max: vo2
                    )
                )
            }
            runs = loaded.sorted { $0.date > $1.date }
        } catch {
            errorMessage = "Couldn't load your runs: \(error.localizedDescription)"
        }
    }

    private func fetchRunningWorkouts() async throws -> [HKWorkout] {
        let predicate = HKQuery.predicateForWorkouts(with: .running)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: workoutType,
                predicate: predicate,
                limit: 200,
                sortDescriptors: [sort]
            ) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }
    }

    private func averageHeartRate(for workout: HKWorkout) async throws -> Double? {
        let predicate = HKQuery.predicateForObjects(from: workout)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: heartRateType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { _, statistics, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                let unit = HKUnit.count().unitDivided(by: .minute())
                let avg = statistics?.averageQuantity()?.doubleValue(for: unit)
                continuation.resume(returning: avg)
            }
            store.execute(query)
        }
    }

    /// VO2max is recorded periodically (e.g. from an Apple Watch run), not
    /// per-workout, so we take the closest reading within a day of the run.
    private func vo2Max(near date: Date) async throws -> Double? {
        let window = TimeInterval(60 * 60 * 24)
        let predicate = HKQuery.predicateForSamples(
            withStart: date.addingTimeInterval(-window),
            end: date.addingTimeInterval(window),
            options: .strictStartDate
        )
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: vo2MaxType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let quantitySamples = samples as? [HKQuantitySample], !quantitySamples.isEmpty else {
                    continuation.resume(returning: nil)
                    return
                }
                let unit = HKUnit(from: "mL/kg*min")
                let closest = quantitySamples.min {
                    abs($0.startDate.timeIntervalSince(date)) < abs($1.startDate.timeIntervalSince(date))
                }
                continuation.resume(returning: closest?.quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }
}
