package com.kuklabs.kuktrip.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kuklabs.kuktrip.data.api.ApiClient
import com.kuklabs.kuktrip.data.model.AppConfig
import com.kuklabs.kuktrip.data.model.LoginRequest
import com.kuklabs.kuktrip.data.model.RegisterRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class AuthMode { LOGIN, REGISTER }

data class AuthUiState(
    val mode: AuthMode = AuthMode.LOGIN,
    val fullName: String = "",
    val email: String = "",
    val password: String = "",
    val rememberMe: Boolean = false,
    val showPassword: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
    val config: AppConfig? = null,
    val success: Boolean = false,
)

class AuthViewModel : ViewModel() {

    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    // Friendly-error policy (KUKLABS_UI_AUTH_AGENT_PACK): never surface raw errors.
    private val genericSignInError =
        "We couldn't sign you in. Check your email and password, then try again."

    init { loadConfig() }

    private fun loadConfig() {
        viewModelScope.launch {
            try {
                val cfg = ApiClient.api.getAppConfig()
                _state.value = _state.value.copy(
                    config = cfg,
                    mode = if (!cfg.hasUsers) AuthMode.REGISTER else _state.value.mode,
                )
            } catch (_: Exception) {
                // Offline / no server reachable — keep sensible defaults.
            }
        }
    }

    fun setMode(m: AuthMode) { _state.value = _state.value.copy(mode = m, error = null) }
    fun onFullName(v: String) { _state.value = _state.value.copy(fullName = v) }
    fun onEmail(v: String) { _state.value = _state.value.copy(email = v) }
    fun onPassword(v: String) { _state.value = _state.value.copy(password = v) }
    fun toggleRemember() { _state.value = _state.value.copy(rememberMe = !_state.value.rememberMe) }
    fun toggleShowPassword() { _state.value = _state.value.copy(showPassword = !_state.value.showPassword) }
    fun consumeSuccess() { _state.value = _state.value.copy(success = false) }

    fun submit() {
        val s = _state.value
        if (s.email.isBlank() || s.password.isBlank()) {
            _state.value = s.copy(error = "Enter your email and password.")
            return
        }
        if (s.mode == AuthMode.REGISTER && s.password.length < 8) {
            _state.value = s.copy(error = "Use at least 8 characters.")
            return
        }
        _state.value = s.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val res = if (s.mode == AuthMode.LOGIN) {
                    ApiClient.api.login(LoginRequest(s.email.trim(), s.password, s.rememberMe))
                } else {
                    val name = s.fullName.ifBlank { s.email.substringBefore("@") }
                    ApiClient.api.register(RegisterRequest(name, s.email.trim(), s.password))
                }
                _state.value = if (res.error != null) {
                    _state.value.copy(loading = false, error = res.error)
                } else {
                    _state.value.copy(loading = false, success = true)
                }
            } catch (_: Exception) {
                _state.value = _state.value.copy(loading = false, error = genericSignInError)
            }
        }
    }
}
