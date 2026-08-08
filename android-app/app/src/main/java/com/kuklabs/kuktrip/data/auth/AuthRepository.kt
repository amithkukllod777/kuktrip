package com.kuklabs.kuktrip.data.auth

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

sealed interface AuthResult {
    data class SignedIn(val user: AuthKitUser?) : AuthResult
    data class OtpRequired(val identifier: String) : AuthResult
    data class Failure(val message: String) : AuthResult
}

class AuthRepository(context: Context) {
    private val api = AuthKitClient.api
    private val store = SecureSessionStore(context)

    fun currentSession(): SecureSessionStore.StoredSession? = store.read()

    suspend fun status(): Boolean = withContext(Dispatchers.IO) {
        runCatching {
            val response = api.status()
            response.isSuccessful && response.body()?.contract == "kuklabs-authkit-rest/1"
        }.getOrDefault(false)
    }

    suspend fun login(identifier: String, password: String): AuthResult = withContext(Dispatchers.IO) {
        try {
            val response = api.login(LoginBody(identifier.trim(), password))
            if (response.isSuccessful) {
                val bundle = response.body() ?: return@withContext AuthResult.Failure("Sign-in returned no session.")
                store.write(bundle)
                return@withContext AuthResult.SignedIn(bundle.user)
            }
            val error = AuthKitClient.parseError(response.errorBody()?.string())
            if (response.code() == 403 && error?.status == "otp_required") {
                return@withContext AuthResult.OtpRequired(error.identifier ?: identifier.trim())
            }
            AuthResult.Failure(error?.message ?: "Invalid email/mobile or password.")
        } catch (_: Exception) {
            AuthResult.Failure("Kuklabs Account is temporarily unavailable. Try again.")
        }
    }

    suspend fun signup(fullName: String, identifier: String, password: String): AuthResult = withContext(Dispatchers.IO) {
        try {
            val response = api.signup(SignupBody(fullName.trim(), identifier.trim(), password))
            if (response.isSuccessful) {
                val bundle = response.body()
                if (bundle != null) {
                    store.write(bundle)
                    return@withContext AuthResult.SignedIn(bundle.user)
                }
            }
            val error = AuthKitClient.parseError(response.errorBody()?.string())
            if (response.code() == 403 && error?.status == "otp_required") {
                return@withContext AuthResult.OtpRequired(error.identifier ?: identifier.trim())
            }
            AuthResult.Failure(error?.message ?: "Sign up failed. Please try again.")
        } catch (_: Exception) {
            AuthResult.Failure("Kuklabs Account is temporarily unavailable. Try again.")
        }
    }

    suspend fun verifyOtp(identifier: String, code: String): AuthResult = withContext(Dispatchers.IO) {
        try {
            val response = api.verifyOtp(OtpVerifyBody(identifier.trim(), code.trim()))
            if (response.isSuccessful) {
                val bundle = response.body() ?: return@withContext AuthResult.Failure("Verification returned no session.")
                store.write(bundle)
                return@withContext AuthResult.SignedIn(bundle.user)
            }
            val error = AuthKitClient.parseError(response.errorBody()?.string())
            AuthResult.Failure(error?.message ?: "Invalid or expired code.")
        } catch (_: Exception) {
            AuthResult.Failure("Could not verify the code. Try again.")
        }
    }

    suspend fun requestOtp(identifier: String): Boolean = withContext(Dispatchers.IO) {
        runCatching { api.requestOtp(OtpRequestBody(identifier.trim())).isSuccessful }.getOrDefault(false)
    }

    suspend fun validAccessToken(): String? = withContext(Dispatchers.IO) {
        val current = store.read() ?: return@withContext null
        val hasTime = current.expiresAtEpochMs > 0
        val nearExpiry = hasTime && System.currentTimeMillis() >= current.expiresAtEpochMs - 60_000L
        if (!nearExpiry) return@withContext current.accessToken

        try {
            val response = api.refresh(RefreshBody(current.refreshToken))
            if (!response.isSuccessful) return@withContext null
            val bundle = response.body() ?: return@withContext null
            store.write(bundle.copy(user = bundle.user ?: current.user))
            bundle.accessToken
        } catch (_: Exception) {
            // Network failure is not proof that the central device session ended.
            current.accessToken
        }
    }

    suspend fun logout() = withContext(Dispatchers.IO) {
        val current = store.read()
        if (current != null) {
            runCatching { api.logout(LogoutBody(current.refreshToken)) }
        }
        store.clear()
    }
}
