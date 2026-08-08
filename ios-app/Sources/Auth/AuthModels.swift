import Foundation

struct AuthKitStatus: Decodable {
    struct GoogleStatus: Decodable { let enabled: Bool }
    let ok: Bool
    let contract: String?
    let google: GoogleStatus?
}

struct AuthKitUser: Codable, Sendable {
    let kuklabsUserId: String
    let fullName: String
    let email: String?
    let phone: String?
    let emailVerified: Bool
    let phoneVerified: Bool

    enum CodingKeys: String, CodingKey {
        case kuklabsUserId = "kuklabs_user_id"
        case fullName = "full_name"
        case email, phone
        case emailVerified = "email_verified"
        case phoneVerified = "phone_verified"
    }
}

struct TokenBundle: Codable, Sendable {
    let accessToken: String
    let refreshToken: String
    let tokenType: String?
    let expiresIn: Int
    let user: AuthKitUser?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case tokenType = "token_type"
        case expiresIn = "expires_in"
        case user
    }
}

struct AuthKitErrorBody: Decodable {
    let error: Bool?
    let status: String?
    let identifier: String?
    let message: String?
}

enum AuthOutcome: Sendable {
    case signedIn(AuthKitUser?)
    case otpRequired(String)
}

enum AuthKitError: LocalizedError {
    case unavailable
    case message(String)

    var errorDescription: String? {
        switch self {
        case .unavailable: "Kuklabs Account is temporarily unavailable. Try again."
        case .message(let message): message
        }
    }
}
