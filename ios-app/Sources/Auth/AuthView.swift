import SwiftUI

struct AuthView: View {
    @Environment(AuthModel.self) private var auth

    var body: some View {
        @Bindable var auth = auth

        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    Spacer(minLength: 26)

                    ZStack {
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(Color.blue.gradient)
                            .frame(width: 78, height: 78)
                        Image(systemName: "airplane.departure")
                            .font(.system(size: 34, weight: .semibold))
                            .foregroundStyle(.white)
                    }

                    VStack(spacing: 8) {
                        Text("KukTrip")
                            .font(.largeTitle.bold())
                        Text("Plan, organize and experience every trip with one Kuklabs Account.")
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                        serviceStatus
                    }

                    if auth.mode != .otp {
                        Picker("Account", selection: $auth.mode) {
                            Text("Login").tag(AuthModel.Mode.login)
                            Text("Sign up").tag(AuthModel.Mode.signup)
                        }
                        .pickerStyle(.segmented)
                    }

                    GroupBox {
                        VStack(spacing: 16) {
                            if let error = auth.errorMessage {
                                Text(error)
                                    .font(.callout)
                                    .foregroundStyle(.red)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(12)
                                    .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                            }

                            switch auth.mode {
                            case .login, .signup:
                                if auth.mode == .signup {
                                    TextField("Full name", text: $auth.fullName)
                                        .textContentType(.name)
                                        .textFieldStyle(.roundedBorder)
                                }

                                TextField("Email or mobile", text: $auth.identifier)
                                    .textContentType(.username)
                                    .textInputAutocapitalization(.never)
                                    .keyboardType(.emailAddress)
                                    .textFieldStyle(.roundedBorder)

                                SecureField("Password", text: $auth.password)
                                    .textContentType(auth.mode == .login ? .password : .newPassword)
                                    .textFieldStyle(.roundedBorder)

                                Button(auth.mode == .login ? "Continue" : "Create Kuklabs Account") {
                                    Task { await auth.submit() }
                                }
                                .buttonStyle(.borderedProminent)
                                .controlSize(.large)
                                .frame(maxWidth: .infinity)
                                .disabled(auth.isLoading || auth.serviceAvailable == false)

                            case .otp:
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Verify your account")
                                        .font(.title3.bold())
                                    Text("Enter the 6-digit code sent for \(auth.otpIdentifier).")
                                        .foregroundStyle(.secondary)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)

                                TextField("6-digit code", text: $auth.otpCode)
                                    .keyboardType(.numberPad)
                                    .textContentType(.oneTimeCode)
                                    .textFieldStyle(.roundedBorder)
                                    .onChange(of: auth.otpCode) { _, newValue in
                                        auth.otpCode = String(newValue.filter(\.isNumber).prefix(6))
                                    }

                                Button("Verify & continue") {
                                    Task { await auth.submit() }
                                }
                                .buttonStyle(.borderedProminent)
                                .controlSize(.large)
                                .disabled(auth.isLoading)

                                HStack {
                                    Button("Back") { auth.setMode(.login) }
                                    Spacer()
                                    Button("Resend code") { Task { await auth.resendOtp() } }
                                }
                            }

                            if auth.isLoading { ProgressView() }
                        }
                        .padding(4)
                    }

                    VStack(spacing: 6) {
                        Text("Powered by Kuklabs")
                            .font(.subheadline.weight(.semibold))
                        Text("By continuing you agree to the Kuklabs Terms and Privacy Policy.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 22)
                .frame(maxWidth: 480)
                .frame(maxWidth: .infinity)
            }
            .background(Color(.systemGroupedBackground))
        }
    }

    @ViewBuilder
    private var serviceStatus: some View {
        switch auth.serviceAvailable {
        case .some(true):
            Label("One Kuklabs Account connected", systemImage: "checkmark.shield")
                .font(.caption)
                .foregroundStyle(.blue)
        case .some(false):
            Label("Kuklabs Account service unavailable", systemImage: "exclamationmark.triangle")
                .font(.caption)
                .foregroundStyle(.red)
        case .none:
            Label("Checking Kuklabs Account…", systemImage: "ellipsis")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
