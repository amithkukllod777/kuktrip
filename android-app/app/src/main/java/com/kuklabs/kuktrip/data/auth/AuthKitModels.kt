package com.kuklabs.kuktrip.data.auth

import com.google.gson.annotations.SerializedName

/** Canonical Kuklabs native AuthKit contract (`/v1/auth/*`). */
data class AuthKitStatus(
    val ok: Boolean = false,
    val contract: String? = null,
    val google: GoogleStatus? = null,
) {
    data class GoogleStatus(val enabled: Boolean = false)
}

data class AuthKitUser(
    @SerializedName("kuklabs_user_id") val kuklabsUserId: String,
    val id: String? = null,
    @SerializedName("full_name") val fullName: String = "",
    val email: String? = null,
    val phone: String? = null,
    @SerializedName("email_verified") val emailVerified: Boolean = false,
    @SerializedName("phone_verified") val phoneVerified: Boolean = false,
)

data class TokenBundle(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String,
    @SerializedName("token_type") val tokenType: String? = null,
    @SerializedName("expires_in") val expiresInSeconds: Long = 0,
    val user: AuthKitUser? = null,
)

data class LoginBody(val identifier: String, val password: String)
data class SignupBody(
    @SerializedName("full_name") val fullName: String,
    val identifier: String,
    val password: String,
)
data class OtpRequestBody(val identifier: String)
data class OtpVerifyBody(val identifier: String, val code: String)
data class RefreshBody(@SerializedName("refresh_token") val refreshToken: String)
data class LogoutBody(@SerializedName("refresh_token") val refreshToken: String? = null)

data class AuthKitError(
    val error: Boolean? = null,
    val status: String? = null,
    val identifier: String? = null,
    val message: String? = null,
)
