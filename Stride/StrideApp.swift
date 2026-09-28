import SwiftUI

@main
struct StrideApp: App {
    @StateObject private var healthKit = HealthKitManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(healthKit)
        }
    }
}
