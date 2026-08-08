import SwiftUI

@main
struct KukTripApp: App {
    @State private var authModel = AuthModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authModel)
                .tint(.blue)
                .task { await authModel.bootstrap() }
        }
    }
}

struct RootView: View {
    @Environment(AuthModel.self) private var auth

    var body: some View {
        Group {
            switch auth.isAuthenticated {
            case nil:
                ProgressView("Loading KukTrip…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case true:
                MainTabView()
            case false:
                AuthView()
            }
        }
    }
}
