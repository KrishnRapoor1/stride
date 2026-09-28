import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var healthKit: HealthKitManager

    var body: some View {
        Group {
            if healthKit.isAuthorized {
                TabView {
                    DashboardView()
                        .tabItem { Label("Dashboard", systemImage: "figure.run") }
                    HistoryView()
                        .tabItem { Label("History", systemImage: "list.bullet") }
                }
            } else {
                AuthorizationPromptView()
            }
        }
        .task {
            if !healthKit.isAuthorized {
                await healthKit.requestAuthorization()
            }
        }
    }
}

private struct AuthorizationPromptView: View {
    @EnvironmentObject private var healthKit: HealthKitManager

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.text.square")
                .font(.system(size: 56))
                .foregroundStyle(.red)
            Text("Stride")
                .font(.largeTitle.bold())
            Text("Stride reads your running workouts from Apple Health to show whether your running fitness is improving over time.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 32)

            if let message = healthKit.errorMessage {
                Text(message)
                    .foregroundStyle(.red)
                    .font(.footnote)
                    .padding(.horizontal, 32)
            }

            Button("Connect to Health") {
                Task { await healthKit.requestAuthorization() }
            }
            .buttonStyle(.borderedProminent)
            .padding(.top, 8)
        }
        .padding()
    }
}

#Preview {
    ContentView()
        .environmentObject(HealthKitManager.shared)
}
