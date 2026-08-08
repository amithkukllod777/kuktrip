import Foundation
import Observation

@MainActor
@Observable
final class AuthModel {
    enum Mode { case login, signup, otp }

    var mode: Mode = .login
    var fullName = ""
    var identifier = ""
    var password = ""
    var otpCode = ""
    var otpIdentifier = ""
    var isLoading = false
    var serviceAvailable: Bool?
    var errorMessage: String?
    var isAuthenticated: Bool?
    var user: AuthKitUser?

    private let client = AuthKitClient.shared

    func bootstrap() async {
        serviceAvailable = await client.status()
        if await client.validAccessToken() != nil {
            user = await client.currentUser()
            isAuthenticated = true
        } else {
            isAuthenticated = false
        }
    }

    func setMode(_ newMode: Mode) {
        mode = newMode
        errorMessage = nil
    }

    func submit() async {
        errorMessage = nil
        switch mode {
        case .login:
            guard !identifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !password.isEmpty else {
                errorMessage = "Enter your email/mobile and password."
                return
            }
            await run { try await client.login(identifier: identifier, password: password) }
        case .signup:
            guard !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  !identifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  password.count >= 8 else {
                errorMessage = "Enter your name, email/mobile and a password of at least 8 characters."
                return
            }
            await run { try await client.signup(fullName: fullName, identifier: identifier, password: password) }
        case .otp:
            guard otpCode.count == 6 else {
                errorMessage = "Enter the 6-digit code."
                return
            }
            await run { try await client.verifyOtp(identifier: otpIdentifier, code: otpCode) }
        }
    }

    func resendOtp() async {
        guard !otpIdentifier.isEmpty else { return }
        do { try await client.requestOtp(identifier: otpIdentifier) }
        catch { errorMessage = error.localizedDescription }
    }

    func logout() async {
        await client.logout()
        user = nil
        isAuthenticated = false
        password = ""
        otpCode = ""
        mode = .login
    }

    private func run(_ operation: () async throws -> AuthOutcome) async {
        isLoading = true
        defer { isLoading = false }
        do {
            switch try await operation() {
            case .signedIn(let signedInUser):
                user = signedInUser ?? await client.currentUser()
                isAuthenticated = true
            case .otpRequired(let target):
                otpIdentifier = target
                otpCode = ""
                mode = .otp
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
