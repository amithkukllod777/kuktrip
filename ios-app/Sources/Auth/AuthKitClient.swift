import Foundation

actor AuthKitClient {
    static let shared = AuthKitClient()

    private let baseURL = URL(string: "https://www.kuklabs.com/v1/auth/")!
    private let productId = "kuktrip"
    private let sessionStore = KeychainSessionStore()
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func status() async -> Bool {
        do {
            let (data, response) = try await request(path: "status", method: "GET", body: Optional<String>.none)
            guard response.statusCode == 200 else { return false }
            return try decoder.decode(AuthKitStatus.self, from: data).contract == "kuklabs-authkit-rest/1"
        } catch {
            return false
        }
    }

    func login(identifier: String, password: String) async throws -> AuthOutcome {
        struct Body: Encodable { let identifier: String; let password: String }
        let (data, response) = try await request(path: "login", method: "POST", body: Body(identifier: identifier.trimmingCharacters(in: .whitespacesAndNewlines), password: password))
        return try handleAuthResponse(data: data, response: response, fallbackIdentifier: identifier)
    }

    func signup(fullName: String, identifier: String, password: String) async throws -> AuthOutcome {
        struct Body: Encodable {
            let fullName: String
            let identifier: String
            let password: String
            enum CodingKeys: String, CodingKey { case fullName = "full_name", identifier, password }
        }
        let (data, response) = try await request(
            path: "signup",
            method: "POST",
            body: Body(fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines), identifier: identifier.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
        )
        return try handleAuthResponse(data: data, response: response, fallbackIdentifier: identifier)
    }

    func verifyOtp(identifier: String, code: String) async throws -> AuthOutcome {
        struct Body: Encodable { let identifier: String; let code: String }
        let (data, response) = try await request(path: "otp/verify", method: "POST", body: Body(identifier: identifier, code: code))
        guard response.statusCode == 200 else { throw error(from: data, fallback: "Invalid or expired code.") }
        let bundle = try decoder.decode(TokenBundle.self, from: data)
        try sessionStore.write(bundle)
        return .signedIn(bundle.user)
    }

    func requestOtp(identifier: String) async throws {
        struct Body: Encodable { let identifier: String }
        let (data, response) = try await request(path: "otp/request", method: "POST", body: Body(identifier: identifier))
        guard response.statusCode == 200 else { throw error(from: data, fallback: "Could not send the code.") }
    }

    func validAccessToken() async -> String? {
        guard let current = sessionStore.read() else { return nil }
        if let expiry = current.expiresAt, expiry.timeIntervalSinceNow < 60 {
            return await refresh(current) ?? nil
        }
        return current.accessToken
    }

    func currentUser() -> AuthKitUser? { sessionStore.read()?.user }

    func logout() async {
        struct Body: Encodable { let refreshToken: String; enum CodingKeys: String, CodingKey { case refreshToken = "refresh_token" } }
        if let current = sessionStore.read() {
            _ = try? await request(path: "logout", method: "POST", body: Body(refreshToken: current.refreshToken), bearer: current.accessToken)
        }
        sessionStore.clear()
    }

    private func refresh(_ current: StoredAuthSession) async -> String? {
        struct Body: Encodable { let refreshToken: String; enum CodingKeys: String, CodingKey { case refreshToken = "refresh_token" } }
        do {
            let (data, response) = try await request(path: "token/refresh", method: "POST", body: Body(refreshToken: current.refreshToken))
            guard response.statusCode == 200 else { return nil }
            let bundle = try decoder.decode(TokenBundle.self, from: data)
            try sessionStore.write(bundle)
            return bundle.accessToken
        } catch {
            // A network failure is not evidence that the central device session was revoked.
            return current.accessToken
        }
    }

    private func handleAuthResponse(data: Data, response: HTTPURLResponse, fallbackIdentifier: String) throws -> AuthOutcome {
        if response.statusCode == 200 {
            let bundle = try decoder.decode(TokenBundle.self, from: data)
            try sessionStore.write(bundle)
            return .signedIn(bundle.user)
        }
        if response.statusCode == 403,
           let body = try? decoder.decode(AuthKitErrorBody.self, from: data),
           body.status == "otp_required" {
            return .otpRequired(body.identifier ?? fallbackIdentifier.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        throw error(from: data, fallback: "Sign in failed. Please try again.")
    }

    private func error(from data: Data, fallback: String) -> AuthKitError {
        if let body = try? decoder.decode(AuthKitErrorBody.self, from: data),
           let message = body.message, !message.isEmpty {
            return .message(message)
        }
        return .message(fallback)
    }

    private func request<Body: Encodable>(
        path: String,
        method: String,
        body: Body?,
        bearer: String? = nil
    ) async throws -> (Data, HTTPURLResponse) {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(productId, forHTTPHeaderField: "X-Kuklabs-Product")
        if let bearer { request.setValue("Bearer \(bearer)", forHTTPHeaderField: "Authorization") }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw AuthKitError.unavailable }
            return (data, http)
        } catch let error as AuthKitError {
            throw error
        } catch {
            throw AuthKitError.unavailable
        }
    }
}
