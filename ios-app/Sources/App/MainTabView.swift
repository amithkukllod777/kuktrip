import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack { HomeView() }
                .tabItem { Label("Home", systemImage: "house") }

            NavigationStack { TripsView() }
                .tabItem { Label("Trips", systemImage: "airplane") }

            NavigationStack { CreateTripView() }
                .tabItem { Label("Create", systemImage: "plus.circle.fill") }

            NavigationStack { ExploreView() }
                .tabItem { Label("Explore", systemImage: "safari") }

            NavigationStack { ProfileView() }
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
    }
}

private struct HomeView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Where are you going next?")
                        .font(.largeTitle.bold())
                    Text("Discover → Plan → Book → Organize → Connect → Experience → Remember")
                        .foregroundStyle(.secondary)
                }

                FeatureCard(
                    title: "Plan with KukTrip AI",
                    body: "Describe destination, dates, travelers, budget and interests. KukTrip prepares a reviewable itinerary.",
                    systemImage: "sparkles"
                )

                FeatureCard(
                    title: "One trip workspace",
                    body: "Itinerary, bookings, routes, costs, documents, packing and collaboration stay together.",
                    systemImage: "map"
                )

                HStack(spacing: 12) {
                    CompactCard(title: "Maps", systemImage: "map.fill")
                    CompactCard(title: "Explore", systemImage: "location.magnifyingglass")
                }
            }
            .padding(20)
        }
        .navigationTitle("KukTrip")
    }
}

private struct TripsView: View {
    var body: some View {
        ModulePlaceholder(
            systemImage: "airplane.departure",
            title: "Trips",
            body: "The API-parity PR connects the existing KukTrip trips, itinerary, bookings, costs, maps and offline data to this native surface."
        )
        .navigationTitle("Trips")
    }
}

private struct CreateTripView: View {
    var body: some View {
        ModulePlaceholder(
            systemImage: "plus.circle",
            title: "Create a trip",
            body: "Manual creation and AI Trip Builder will share one server-side contract. AI proposes; the user reviews before save."
        )
        .navigationTitle("Create")
    }
}

private struct ExploreView: View {
    var body: some View {
        ModulePlaceholder(
            systemImage: "safari",
            title: "Explore",
            body: "Destination discovery, nearby places, activities and opt-in traveler matching will live here with privacy-first controls."
        )
        .navigationTitle("Explore")
    }
}

private struct ProfileView: View {
    @Environment(AuthModel.self) private var auth

    var body: some View {
        List {
            Section("Kuklabs Account") {
                Label(auth.user?.fullName.isEmpty == false ? auth.user!.fullName : "Signed in", systemImage: "person.crop.circle")
                if let email = auth.user?.email { Label(email, systemImage: "envelope") }
                Text("Identity is managed by the shared Kuklabs AuthKit. KukTrip does not maintain a separate password or user account.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("About") {
                LabeledContent("Product", value: "KukTrip")
                LabeledContent("Bundle ID", value: "com.kuklabs.trip")
                LabeledContent("Version", value: "1.0.0 (Build 1)")
                Text("Powered by Kuklabs")
                    .font(.footnote.weight(.semibold))
            }

            Section {
                Button("Sign out of this device", role: .destructive) {
                    Task { await auth.logout() }
                }
            }
        }
        .navigationTitle("Profile")
    }
}

private struct FeatureCard: View {
    let title: String
    let body: String
    let systemImage: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: systemImage)
                .font(.title2)
                .foregroundStyle(.blue)
                .frame(width: 46, height: 46)
                .background(Color.blue.opacity(0.12), in: RoundedRectangle(cornerRadius: 13))
            VStack(alignment: .leading, spacing: 5) {
                Text(title).font(.headline)
                Text(body).font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(.background, in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 3)
    }
}

private struct CompactCard: View {
    let title: String
    let systemImage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Image(systemName: systemImage).font(.title2).foregroundStyle(.blue)
            Text(title).font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(.background, in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 3)
    }
}

private struct ModulePlaceholder: View {
    let systemImage: String
    let title: String
    let body: String

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: systemImage)
        } description: {
            Text(body)
        }
    }
}
