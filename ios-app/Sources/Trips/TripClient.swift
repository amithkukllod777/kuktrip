import Foundation

actor TripClient {
    static let shared = TripClient()

    private let baseURL = URL(string: "https://trip.kuklabs.com/")!
    private let auth = AuthKitClient.shared
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func listTrips() async throws -> [Trip] {
        let data = try await request(path: "api/trips", method: "GET", body: Optional<String>.none)
        return try decoder.decode(TripsEnvelope.self, from: data).trips
    }

    func getTrip(id: Int) async throws -> Trip {
        let data = try await request(path: "api/trips/\(id)", method: "GET", body: Optional<String>.none)
        return try decoder.decode(TripEnvelope.self, from: data).trip
    }

    func createTrip(_ input: CreateTripRequest) async throws -> Trip {
        let data = try await request(path: "api/trips", method: "POST", body: input)
        return try decoder.decode(TripEnvelope.self, from: data).trip
    }

    func listDays(tripId: Int) async throws -> [TripDay] {
        let data = try await request(path: "api/trips/\(tripId)/days", method: "GET", body: Optional<String>.none)
        return try decoder.decode([TripDay].self, from: data)
    }

    func addDay(tripId: Int) async throws -> TripDay {
        let data = try await request(path: "api/trips/\(tripId)/days", method: "POST", body: CreateDayRequest())
        return try decoder.decode(DayEnvelope.self, from: data).day
    }

    private func request<Body: Encodable>(path: String, method: String, body: Body?) async throws -> Data {
        guard let token = await auth.validAccessToken() else { throw TripClientError.signedOut }
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw TripClientError.unavailable }
        guard (200..<300).contains(http.statusCode) else { throw TripClientError.http(http.statusCode) }
        return data
    }
}

enum TripClientError: LocalizedError {
    case signedOut
    case unavailable
    case http(Int)

    var errorDescription: String? {
        switch self {
        case .signedOut: "Your Kuklabs session expired. Sign in again."
        case .unavailable: "KukTrip is temporarily unavailable."
        case .http(let code): "KukTrip request failed (\(code))."
        }
    }
}
