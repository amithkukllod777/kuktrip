import Foundation

actor TripClient {
    static let shared = TripClient()
    private let baseURL = URL(string: "https://trip.kuklabs.com/")!
    private let auth = AuthKitClient.shared
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func listTrips() async throws -> [Trip] { let data = try await request(path: "api/trips", method: "GET", body: Optional<String>.none); return try decoder.decode(TripsEnvelope.self, from: data).trips }
    func getTrip(id: Int) async throws -> Trip { let data = try await request(path: "api/trips/\(id)", method: "GET", body: Optional<String>.none); return try decoder.decode(TripEnvelope.self, from: data).trip }
    func createTrip(_ input: CreateTripRequest) async throws -> Trip { let data = try await request(path: "api/trips", method: "POST", body: input); return try decoder.decode(TripEnvelope.self, from: data).trip }
    func listDays(tripId: Int) async throws -> [TripDay] { let data = try await request(path: "api/trips/\(tripId)/days", method: "GET", body: Optional<String>.none); return try decoder.decode([TripDay].self, from: data) }
    func listPlaces(tripId: Int) async throws -> [TripPlace] { let data = try await request(path: "api/trips/\(tripId)/places", method: "GET", body: Optional<String>.none); return try decoder.decode(PlacesEnvelope.self, from: data).places }
    func listReservations(tripId: Int) async throws -> [TripReservation] { let data = try await request(path: "api/trips/\(tripId)/reservations", method: "GET", body: Optional<String>.none); return try decoder.decode(ReservationsEnvelope.self, from: data).reservations }
    func listBudget(tripId: Int) async throws -> [TripBudgetItem] { let data = try await request(path: "api/trips/\(tripId)/budget", method: "GET", body: Optional<String>.none); return try decoder.decode(BudgetEnvelope.self, from: data).items }
    func createBudgetItem(tripId: Int, input: CreateBudgetItemRequest) async throws -> TripBudgetItem { let data = try await request(path: "api/trips/\(tripId)/budget", method: "POST", body: input); return try decoder.decode(BudgetItemEnvelope.self, from: data).item }
    func addDay(tripId: Int) async throws -> TripDay { let data = try await request(path: "api/trips/\(tripId)/days", method: "POST", body: CreateDayRequest()); return try decoder.decode(DayEnvelope.self, from: data).day }

    private func request<Body: Encodable>(path: String, method: String, body: Body?) async throws -> Data {
        guard let token = await auth.validAccessToken() else { throw TripClientError.signedOut }
        var req = URLRequest(url: baseURL.appending(path: path)); req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept"); req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let body { req.setValue("application/json", forHTTPHeaderField: "Content-Type"); req.httpBody = try encoder.encode(body) }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw TripClientError.unavailable }
        guard (200..<300).contains(http.statusCode) else { throw TripClientError.http(http.statusCode) }
        return data
    }
}

enum TripClientError: LocalizedError {
    case signedOut, unavailable, http(Int)
    var errorDescription: String? { switch self { case .signedOut: "Your Kuklabs session expired. Sign in again."; case .unavailable: "KukTrip is temporarily unavailable."; case .http(let code): "KukTrip request failed (\(code))." } }
}
