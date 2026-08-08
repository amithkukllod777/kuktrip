import Foundation

actor TripClient {
    static let shared = TripClient()
    private let baseURL = URL(string: "https://trip.kuklabs.com/")!
    private let auth = AuthKitClient.shared
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func listTrips() async throws -> [Trip] { try decoder.decode(TripsEnvelope.self, from: request(path: "api/trips", method: "GET", body: Optional<String>.none)).trips }
    func getTrip(id: Int) async throws -> Trip { try decoder.decode(TripEnvelope.self, from: request(path: "api/trips/\(id)", method: "GET", body: Optional<String>.none)).trip }
    func createTrip(_ input: CreateTripRequest) async throws -> Trip { try decoder.decode(TripEnvelope.self, from: request(path: "api/trips", method: "POST", body: input)).trip }
    func listDays(tripId: Int) async throws -> [TripDay] { try decoder.decode([TripDay].self, from: request(path: "api/trips/\(tripId)/days", method: "GET", body: Optional<String>.none)) }
    func listPlaces(tripId: Int) async throws -> [TripPlace] { try decoder.decode(PlacesEnvelope.self, from: request(path: "api/trips/\(tripId)/places", method: "GET", body: Optional<String>.none)).places }
    func listReservations(tripId: Int) async throws -> [TripReservation] { try decoder.decode(ReservationsEnvelope.self, from: request(path: "api/trips/\(tripId)/reservations", method: "GET", body: Optional<String>.none)).reservations }
    func listBudget(tripId: Int) async throws -> [TripBudgetItem] { try decoder.decode(BudgetEnvelope.self, from: request(path: "api/trips/\(tripId)/budget", method: "GET", body: Optional<String>.none)).items }
    func createBudgetItem(tripId: Int, input: CreateBudgetItemRequest) async throws -> TripBudgetItem { try decoder.decode(BudgetItemEnvelope.self, from: request(path: "api/trips/\(tripId)/budget", method: "POST", body: input)).item }
    func addDay(tripId: Int) async throws -> TripDay { try decoder.decode(DayEnvelope.self, from: request(path: "api/trips/\(tripId)/days", method: "POST", body: CreateDayRequest())).day }

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
