import SwiftUI

struct MainTabView: View {
    @State private var trips = TripsStore()

    var body: some View {
        TabView {
            NavigationStack { HomeView() }
                .tabItem { Label("Home", systemImage: "house") }

            NavigationStack { TripsView(store: trips) }
                .tabItem { Label("Trips", systemImage: "airplane") }

            NavigationStack { CreateTripView(store: trips) }
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
                    Text("Where are you going next?").font(.largeTitle.bold())
                    Text("Discover → Plan → Book → Organize → Connect → Experience → Remember").foregroundStyle(.secondary)
                }
                FeatureCard(title: "Plan with KukTrip AI", body: "Describe destination, dates, travelers, budget and interests. KukTrip prepares a reviewable itinerary.", systemImage: "sparkles")
                FeatureCard(title: "One trip workspace", body: "Itinerary, bookings, routes, costs, documents, packing and collaboration stay together.", systemImage: "map")
                HStack(spacing: 12) {
                    CompactCard(title: "Maps", systemImage: "map.fill")
                    CompactCard(title: "Explore", systemImage: "location.magnifyingglass")
                }
            }.padding(20)
        }
        .navigationTitle("KukTrip")
    }
}

private struct TripsView: View {
    let store: TripsStore

    var body: some View {
        Group {
            if store.isLoading && store.trips.isEmpty {
                ProgressView("Loading trips…")
            } else if store.trips.isEmpty {
                ContentUnavailableView("No trips yet", systemImage: "airplane.departure", description: Text("Create your first trip or use KukTrip AI."))
            } else {
                List(store.trips) { trip in
                    NavigationLink {
                        TripDetailView(store: store, trip: trip)
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(trip.title).font(.headline)
                            if let dates = dateRange(trip), !dates.isEmpty { Text(dates).font(.subheadline).foregroundStyle(.secondary) }
                            Text("\(trip.dayCount ?? 0) days • \(trip.placeCount ?? 0) places • \(trip.currency)").font(.caption).foregroundStyle(.secondary)
                        }.padding(.vertical, 4)
                    }
                }
                .refreshable { await store.loadTrips() }
            }
        }
        .overlay(alignment: .bottom) {
            if let error = store.errorMessage {
                Text(error).font(.footnote).foregroundStyle(.white).padding(12).background(.red, in: Capsule()).padding()
            }
        }
        .navigationTitle("Trips")
        .task { if store.trips.isEmpty { await store.loadTrips() } }
    }

    private func dateRange(_ trip: Trip) -> String? {
        [trip.startDate, trip.endDate].compactMap { $0 }.joined(separator: " → ")
    }
}

private struct TripDetailView: View {
    let store: TripsStore
    let trip: Trip

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text(store.selectedTrip?.title ?? trip.title).font(.title2.bold())
                    let dates = [store.selectedTrip?.startDate ?? trip.startDate, store.selectedTrip?.endDate ?? trip.endDate].compactMap { $0 }.joined(separator: " → ")
                    if !dates.isEmpty { Text(dates).foregroundStyle(.secondary) }
                    if let description = store.selectedTrip?.description ?? trip.description, !description.isEmpty { Text(description) }
                }.padding(.vertical, 6)
            }

            Section("Itinerary") {
                if store.days.isEmpty {
                    Text("No itinerary days yet.").foregroundStyle(.secondary)
                }
                ForEach(store.days) { day in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(day.title ?? "Day \(day.dayNumber.map(String.init) ?? "")").font(.headline)
                        if let date = day.date { Text(date).font(.caption).foregroundStyle(.secondary) }
                        if let notes = day.notes, !notes.isEmpty { Text(notes) }
                        ForEach(day.notesItems ?? []) { note in
                            Text("\(note.time ?? "") \(note.icon ?? "•") \(note.text)").font(.subheadline)
                        }
                    }.padding(.vertical, 3)
                }
                Button("Add itinerary day", systemImage: "plus") { Task { await store.addDay() } }
            }

            Section("Places") {
                if store.places.isEmpty {
                    Text("No saved places yet.").foregroundStyle(.secondary)
                }
                ForEach(store.places) { place in
                    VStack(alignment: .leading, spacing: 5) {
                        Label(place.name, systemImage: "mappin.and.ellipse").font(.headline)
                        if let address = place.address, !address.isEmpty { Text(address).font(.subheadline).foregroundStyle(.secondary) }
                        if let price = place.price { Text("Estimated: \(price.formatted()) \(place.currency ?? trip.currency)").font(.caption).foregroundStyle(.secondary) }
                    }.padding(.vertical, 3)
                }
            }

            Section("Bookings") {
                if store.reservations.isEmpty {
                    Text("No reservations yet.").foregroundStyle(.secondary)
                }
                ForEach(store.reservations) { reservation in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack {
                            Label(reservation.title, systemImage: bookingIcon(reservation.type)).font(.headline)
                            Spacer()
                            Text(reservation.status.capitalized).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                        }
                        if let time = reservation.reservationTime { Text(time).font(.subheadline).foregroundStyle(.secondary) }
                        if let location = reservation.location, !location.isEmpty { Text(location).font(.subheadline) }
                        if let confirmation = reservation.confirmationNumber, !confirmation.isEmpty { Text("Confirmation: \(confirmation)").font(.caption).foregroundStyle(.secondary) }
                    }.padding(.vertical, 3)
                }
            }
        }
        .navigationTitle(trip.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.openTrip(trip) }
    }

    private func bookingIcon(_ type: String) -> String {
        switch type.lowercased() {
        case "flight": return "airplane"
        case "hotel", "accommodation": return "bed.double"
        case "train": return "train.side.front.car"
        case "car", "rental": return "car"
        case "restaurant": return "fork.knife"
        default: return "ticket"
        }
    }
}

private struct CreateTripView: View {
    let store: TripsStore
    @State private var title = ""
    @State private var startDate = ""
    @State private var endDate = ""
    @State private var dayCount = "7"
    @State private var createdTrip: Trip?

    var body: some View {
        Form {
            Section("Trip") {
                TextField("Trip name", text: $title)
                TextField("Start date (YYYY-MM-DD)", text: $startDate).textInputAutocapitalization(.never)
                TextField("End date (YYYY-MM-DD)", text: $endDate).textInputAutocapitalization(.never)
                TextField("Days", text: $dayCount).keyboardType(.numberPad)
            }
            Section {
                Button {
                    Task { createdTrip = await store.createTrip(title: title, startDate: startDate, endDate: endDate, dayCount: Int(dayCount)) }
                } label: {
                    if store.isLoading { ProgressView() } else { Text("Create trip") }
                }
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || store.isLoading)
            }
            if let createdTrip {
                Section("Created") { Label(createdTrip.title, systemImage: "checkmark.circle.fill").foregroundStyle(.green) }
            }
            if let error = store.errorMessage { Section { Text(error).foregroundStyle(.red) } }
        }
        .navigationTitle("Create")
    }
}

private struct ExploreView: View {
    var body: some View {
        ModulePlaceholder(systemImage: "safari", title: "Explore", body: "Destination discovery, nearby places, activities and opt-in traveler matching will live here with privacy-first controls.")
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
                Text("Identity is managed by the shared Kuklabs AuthKit. KukTrip does not maintain a separate password or user account.").font(.footnote).foregroundStyle(.secondary)
            }
            Section("About") {
                LabeledContent("Product", value: "KukTrip")
                LabeledContent("Bundle ID", value: "com.kuklabs.trip")
                LabeledContent("Version", value: "1.0.0 (Build 1)")
                Text("Powered by Kuklabs").font(.footnote.weight(.semibold))
            }
            Section { Button("Sign out of this device", role: .destructive) { Task { await auth.logout() } } }
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
            Image(systemName: systemImage).font(.title2).foregroundStyle(.blue).frame(width: 46, height: 46).background(Color.blue.opacity(0.12), in: RoundedRectangle(cornerRadius: 13))
            VStack(alignment: .leading, spacing: 5) { Text(title).font(.headline); Text(body).font(.subheadline).foregroundStyle(.secondary) }
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(18).background(.background, in: RoundedRectangle(cornerRadius: 20)).shadow(color: .black.opacity(0.05), radius: 8, y: 3)
    }
}

private struct CompactCard: View {
    let title: String
    let systemImage: String
    var body: some View {
        VStack(alignment: .leading, spacing: 14) { Image(systemName: systemImage).font(.title2).foregroundStyle(.blue); Text(title).font(.headline) }
            .frame(maxWidth: .infinity, alignment: .leading).padding(18).background(.background, in: RoundedRectangle(cornerRadius: 20)).shadow(color: .black.opacity(0.05), radius: 8, y: 3)
    }
}

private struct ModulePlaceholder: View {
    let systemImage: String
    let title: String
    let body: String
    var body: some View {
        ContentUnavailableView { Label(title, systemImage: systemImage) } description: { Text(body) }
    }
}
