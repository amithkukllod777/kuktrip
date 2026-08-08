import Foundation
import Security

struct StoredAuthSession: Codable, Sendable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date?
    let user: AuthKitUser?
}

final class KeychainSessionStore: @unchecked Sendable {
    private let service = "com.kuklabs.trip.authkit"
    private let account = "device-session"
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func read() -> StoredAuthSession? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return try? decoder.decode(StoredAuthSession.self, from: data)
    }

    func write(_ bundle: TokenBundle) throws {
        let expiry = bundle.expiresIn > 0 ? Date().addingTimeInterval(TimeInterval(bundle.expiresIn)) : nil
        let previous = read()
        let session = StoredAuthSession(
            accessToken: bundle.accessToken,
            refreshToken: bundle.refreshToken,
            expiresAt: expiry,
            user: bundle.user ?? previous?.user
        )
        let data = try encoder.encode(session)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            var create = query
            create.merge(attributes) { _, new in new }
            let addStatus = SecItemAdd(create as CFDictionary, nil)
            guard addStatus == errSecSuccess else { throw AuthKitError.message("Could not secure this device session.") }
        } else if status != errSecSuccess {
            throw AuthKitError.message("Could not secure this device session.")
        }
    }

    func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
