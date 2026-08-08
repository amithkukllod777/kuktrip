import Foundation

struct ExploreActivity: Codable, Identifiable, Hashable {
    let id: Int
    let hostUserId: Int
    let title: String
    let category: String
    let description: String?
    let destination: String?
    let area: String?
    let startAt: String
    let endAt: String?
    let timezone: String?
    let capacity: Int?
    let joinMode: String
    let lat: Double?
    let lng: Double?
    let participantCount: Int?
    let myStatus: String?
}

struct CreateExploreActivityRequest: Encodable {
    let title: String
    let category: String
    let description: String?
    let destination: String?
    let area: String?
    let startAt: String
    let endAt: String?
    let timezone: String?
    let capacity: Int?
    let visibility: String
    let joinMode: String
    let tripId: Int?
    let publicLat: Double?
    let publicLng: Double?

    init(title: String, category: String, description: String? = nil, destination: String? = nil, area: String? = nil, startAt: String, endAt: String? = nil, timezone: String? = nil, capacity: Int? = nil, visibility: String = "public", joinMode: String = "approval", tripId: Int? = nil, publicLat: Double? = nil, publicLng: Double? = nil) {
        self.title = title; self.category = category; self.description = description; self.destination = destination; self.area = area
        self.startAt = startAt; self.endAt = endAt; self.timezone = timezone; self.capacity = capacity
        self.visibility = visibility; self.joinMode = joinMode; self.tripId = tripId; self.publicLat = publicLat; self.publicLng = publicLng
    }
}

struct CreateExploreActivityResult: Decodable { let id: Int }
struct JoinExploreActivityResult: Decodable { let status: String; let alreadyHost: Bool? }
struct TravelerDiscoveryRequest: Encodable { let enabled: Bool; let showUpcomingDestinations: Bool; let interests: [String] }
struct TravelerDiscoveryResult: Decodable { let enabled: Bool }

actor ExploreClient {
    static let shared = ExploreClient()
    private let baseURL = URL(string: "https://trip.kuklabs.com/")!
    private let auth = AuthKitClient.shared
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func activities(destination: String? = nil) async throws -> [ExploreActivity] {
        var components = URLComponents(url: baseURL.appending(path: "api/explore/activities"), resolvingAgainstBaseURL: false)!
        if let destination, !destination.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            components.queryItems = [URLQueryItem(name: "destination", value: destination)]
        }
        let data = try await request(url: components.url!, method: "GET", body: Optional<String>.none)
        return try decoder.decode([ExploreActivity].self, from: data)
    }

    func create(_ input: CreateExploreActivityRequest) async throws -> Int {
        let data = try await request(url: baseURL.appending(path: "api/explore/activities"), method: "POST", body: input)
        return try decoder.decode(CreateExploreActivityResult.self, from: data).id
    }

    func join(activityId: Int) async throws -> JoinExploreActivityResult {
        let data = try await request(url: baseURL.appending(path: "api/explore/activities/\(activityId)/join"), method: "POST", body: Optional<String>.none)
        return try decoder.decode(JoinExploreActivityResult.self, from: data)
    }

    func setTravelerDiscovery(enabled: Bool, interests: [String] = []) async throws -> Bool {
        let body = TravelerDiscoveryRequest(enabled: enabled, showUpcomingDestinations: enabled, interests: Array(interests.prefix(30)))
        let data = try await request(url: baseURL.appending(path: "api/explore/discovery"), method: "PUT", body: body)
        return try decoder.decode(TravelerDiscoveryResult.self, from: data).enabled
    }

    private func request<Body: Encodable>(url: URL, method: String, body: Body?) async throws -> Data {
        guard let token = await auth.validAccessToken() else { throw ExploreClientError.signedOut }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ExploreClientError.unavailable }
        guard (200..<300).contains(http.statusCode) else { throw ExploreClientError.http(http.statusCode) }
        return data
    }
}

enum ExploreClientError: LocalizedError {
    case signedOut, unavailable, http(Int)
    var errorDescription: String? {
        switch self {
        case .signedOut: "Your Kuklabs session expired. Sign in again."
        case .unavailable: "KukTrip Explore is temporarily unavailable."
        case .http(let code): "Explore request failed (\(code))."
        }
    }
}
