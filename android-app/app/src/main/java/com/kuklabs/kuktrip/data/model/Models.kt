package com.kuklabs.kuktrip.data.model

import com.google.gson.annotations.SerializedName

/** Mirrors the Kuk Trip server's /api/auth/app-config response. */
data class AppConfig(
    @SerializedName("has_users") val hasUsers: Boolean = false,
    @SerializedName("allow_registration") val allowRegistration: Boolean = false,
    @SerializedName("demo_mode") val demoMode: Boolean = false,
    @SerializedName("oidc_configured") val oidcConfigured: Boolean = false,
    @SerializedName("oidc_display_name") val oidcDisplayName: String? = null,
    @SerializedName("oidc_login") val oidcLogin: Boolean = false,
    @SerializedName("password_login") val passwordLogin: Boolean = true,
    @SerializedName("password_registration") val passwordRegistration: Boolean = false,
) {
    /** Whether the Login / Sign Up tabs should be shown. */
    val registrationEnabled: Boolean
        get() = (passwordRegistration || !hasUsers) && !demoMode
}

data class LoginRequest(
    val email: String,
    val password: String,
    @SerializedName("remember_me") val rememberMe: Boolean = false,
)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
)

data class User(
    val id: Int? = null,
    val username: String? = null,
    val email: String? = null,
    val role: String? = null,
)

data class AuthResponse(
    val token: String? = null,
    val user: User? = null,
    @SerializedName("mfa_required") val mfaRequired: Boolean? = null,
    val error: String? = null,
)
