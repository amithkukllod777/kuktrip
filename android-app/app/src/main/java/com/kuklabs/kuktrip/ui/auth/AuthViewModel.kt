package com.kuklabs.kuktrip.ui.auth

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kuklabs.kuktrip.data.auth.AuthRepository
import com.kuklabs.kuktrip.data.auth.AuthResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class AuthMode { LOGIN, SIGNUP, OTP }

data class AuthUiState(
    val mode: AuthMode = AuthMode.LOGIN,
    val fullName: String = "",
    val identifier: String = "",
    val password: String = "",
    val otpCode: String = "",
    val otpIdentifier: String = "",
    val showPassword: Boolean = false,
    val loading: Boolean = false,
    val authKitReachable: Boolean? = null,
    val error: String? = null,
    val success: Boolean = false,
)

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = AuthRepository(application)
    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            _state.value = _state.value.copy(authKitReachable = repository.status())
        }
    }

    fun setMode(mode: AuthMode) {
        _state.value = _state.value.copy(mode = mode, error = null)
    }

    fun onFullName(value: String) { _state.value = _state.value.copy(fullName = value) }
    fun onIdentifier(value: String) { _state.value = _state.value.copy(identifier = value) }
    fun onPassword(value: String) { _state.value = _state.value.copy(password = value) }
    fun onOtpCode(value: String) {
        _state.value = _state.value.copy(otpCode = value.filter(Char::isDigit).take(6))
    }
    fun toggleShowPassword() { _state.value = _state.value.copy(showPassword = !_state.value.showPassword) }
    fun consumeSuccess() { _state.value = _state.value.copy(success = false) }

    fun submit() {
        when (_state.value.mode) {
            AuthMode.LOGIN -> submitLogin()
            AuthMode.SIGNUP -> submitSignup()
            AuthMode.OTP -> submitOtp()
        }
    }

    fun resendOtp() {
        val identifier = _state.value.otpIdentifier
        if (identifier.isBlank()) return
        viewModelScope.launch {
            val ok = repository.requestOtp(identifier)
            if (!ok) _state.value = _state.value.copy(error = "Could not send a new code. Try again.")
        }
    }

    private fun submitLogin() {
        val s = _state.value
        if (s.identifier.isBlank() || s.password.isBlank()) {
            _state.value = s.copy(error = "Enter your email/mobile and password.")
            return
        }
        runAuth { repository.login(s.identifier, s.password) }
    }

    private fun submitSignup() {
        val s = _state.value
        if (s.fullName.isBlank() || s.identifier.isBlank() || s.password.length < 8) {
            _state.value = s.copy(error = "Enter your name, email/mobile and a password of at least 8 characters.")
            return
        }
        runAuth { repository.signup(s.fullName, s.identifier, s.password) }
    }

    private fun submitOtp() {
        val s = _state.value
        if (s.otpCode.length != 6) {
            _state.value = s.copy(error = "Enter the 6-digit code.")
            return
        }
        runAuth { repository.verifyOtp(s.otpIdentifier, s.otpCode) }
    }

    private fun runAuth(block: suspend () -> AuthResult) {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val result = block()) {
                is AuthResult.SignedIn -> {
                    _state.value = _state.value.copy(loading = false, success = true)
                }
                is AuthResult.OtpRequired -> {
                    _state.value = _state.value.copy(
                        loading = false,
                        mode = AuthMode.OTP,
                        otpIdentifier = result.identifier,
                        otpCode = "",
                    )
                }
                is AuthResult.Failure -> {
                    _state.value = _state.value.copy(loading = false, error = result.message)
                }
            }
        }
    }
}
