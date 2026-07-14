package com.kuklabs.kuktrip.ui.auth

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.kuklabs.kuktrip.BuildConfig
import com.kuklabs.kuktrip.ui.components.KukTripMark
import com.kuklabs.kuktrip.ui.theme.Accent
import com.kuklabs.kuktrip.ui.theme.AccentSubtle
import com.kuklabs.kuktrip.ui.theme.Background
import com.kuklabs.kuktrip.ui.theme.BorderColor
import com.kuklabs.kuktrip.ui.theme.DividerSoft
import com.kuklabs.kuktrip.ui.theme.ErrorColor
import com.kuklabs.kuktrip.ui.theme.ErrorSurface
import com.kuklabs.kuktrip.ui.theme.LabelColor
import com.kuklabs.kuktrip.ui.theme.Placeholder
import com.kuklabs.kuktrip.ui.theme.SurfaceColor
import com.kuklabs.kuktrip.ui.theme.TextMuted
import com.kuklabs.kuktrip.ui.theme.TextPrimary
import com.kuklabs.kuktrip.ui.theme.TextSecondary

@Composable
fun AuthScreen(vm: AuthViewModel = viewModel()) {
    val s by vm.state.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(s.success) {
        if (s.success) {
            Toast.makeText(context, "Signed in", Toast.LENGTH_SHORT).show()
            vm.consumeSuccess()
        }
    }

    val cfg = s.config
    val showTabs = (cfg?.registrationEnabled == true)
    val showGoogle = (cfg?.oidcConfigured == true && cfg.oidcLogin)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(
            modifier = Modifier.widthIn(max = 420.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Header
            KukTripMark(80.dp)
            Spacer(Modifier.height(18.dp))
            Text("Welcome to", fontSize = 24.sp, fontWeight = FontWeight.Medium, color = TextPrimary)
            Text(
                buildAnnotatedString {
                    withStyle(SpanStyle(color = TextPrimary)) { append("Kuk ") }
                    withStyle(SpanStyle(color = Accent)) { append("Trip") }
                },
                fontSize = 38.sp,
                fontWeight = FontWeight.ExtraBold,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                "Maps, budgets & real-time planning — synced with your Kuklabs account.",
                fontSize = 15.sp,
                color = TextSecondary,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(28.dp))

            // Login / Sign Up tabs
            if (showTabs) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .background(SurfaceColor, RoundedCornerShape(16.dp))
                        .border(1.dp, DividerSoft, RoundedCornerShape(16.dp)),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AuthTab("Login", s.mode == AuthMode.LOGIN, Modifier.weight(1f)) {
                        vm.setMode(AuthMode.LOGIN)
                    }
                    Box(Modifier.height(24.dp).width(1.dp).background(DividerSoft))
                    AuthTab("Sign Up", s.mode == AuthMode.REGISTER, Modifier.weight(1f)) {
                        vm.setMode(AuthMode.REGISTER)
                    }
                }
                Spacer(Modifier.height(16.dp))
            }

            // Card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceColor, RoundedCornerShape(16.dp))
                    .border(1.dp, DividerSoft, RoundedCornerShape(16.dp))
                    .padding(24.dp),
            ) {
                s.error?.let { err ->
                    Text(
                        err,
                        color = ErrorColor,
                        fontSize = 13.sp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(ErrorSurface, RoundedCornerShape(10.dp))
                            .padding(10.dp),
                    )
                    Spacer(Modifier.height(14.dp))
                }

                if (s.mode == AuthMode.REGISTER) {
                    FieldLabel("Full name")
                    AppTextField(
                        value = s.fullName,
                        onValueChange = vm::onFullName,
                        placeholder = "Your name",
                        leading = { Icon(Icons.Outlined.Person, null, tint = Placeholder) },
                    )
                    Spacer(Modifier.height(16.dp))
                }

                FieldLabel("Email")
                AppTextField(
                    value = s.email,
                    onValueChange = vm::onEmail,
                    placeholder = "your@email.com",
                    leading = { Icon(Icons.Outlined.Email, null, tint = Placeholder) },
                )
                Spacer(Modifier.height(16.dp))

                FieldLabel("Password")
                AppTextField(
                    value = s.password,
                    onValueChange = vm::onPassword,
                    placeholder = "••••••••",
                    leading = { Icon(Icons.Outlined.Lock, null, tint = Placeholder) },
                    visualTransformation = if (s.showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    trailing = {
                        Icon(
                            if (s.showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                            contentDescription = "Toggle password",
                            tint = Placeholder,
                            modifier = Modifier.clickable { vm.toggleShowPassword() },
                        )
                    },
                )

                if (s.mode == AuthMode.LOGIN) {
                    Spacer(Modifier.height(10.dp))
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Switch(
                                checked = s.rememberMe,
                                onCheckedChange = { vm.toggleRemember() },
                                colors = SwitchDefaults.colors(checkedTrackColor = Accent),
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Remember me", fontSize = 13.sp, color = TextSecondary)
                        }
                        Text(
                            "Forgot password?",
                            fontSize = 13.sp,
                            color = Accent,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.clickable {
                                openUrl(context, BuildConfig.API_BASE_URL + "forgot-password")
                            },
                        )
                    }
                }

                Spacer(Modifier.height(18.dp))
                Button(
                    onClick = vm::submit,
                    enabled = !s.loading,
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Accent),
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                ) {
                    if (s.loading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = SurfaceColor,
                            strokeWidth = 2.dp,
                        )
                    } else {
                        Text(
                            if (s.mode == AuthMode.LOGIN) "Login" else "Create Account",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }

            // Google / SSO
            if (showGoogle) {
                Spacer(Modifier.height(20.dp))
                OrDivider()
                Spacer(Modifier.height(14.dp))
                OutlinedButton(
                    onClick = { openUrl(context, BuildConfig.API_BASE_URL + "api/auth/oidc/login") },
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                ) {
                    Text(
                        "Continue with Google",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary,
                    )
                }
            }

            // Legal + Powered by Kuklabs
            Spacer(Modifier.height(28.dp))
            Text(
                "By continuing, you agree to our Terms of Use and Privacy Policy",
                fontSize = 13.sp,
                color = TextMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier.clickable { openUrl(context, "https://kuklabs.com/terms") },
            )
            Spacer(Modifier.height(12.dp))
            Text(
                buildAnnotatedString {
                    append("Powered by ")
                    withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = TextMuted)) { append("Kuklabs") }
                },
                fontSize = 13.sp,
                color = Placeholder,
            )
        }
    }
}

@Composable
private fun AuthTab(label: String, active: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier.fillMaxHeight().clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            label,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (active) Accent else TextSecondary,
        )
        Spacer(Modifier.height(6.dp))
        Box(
            Modifier
                .height(2.dp)
                .width(if (active) 48.dp else 0.dp)
                .background(if (active) Accent else Background)
        )
    }
}

@Composable
private fun FieldLabel(text: String) {
    Text(text, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = LabelColor)
    Spacer(Modifier.height(6.dp))
}

@Composable
private fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    leading: @Composable (() -> Unit)? = null,
    trailing: @Composable (() -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = Placeholder) },
        leadingIcon = leading,
        trailingIcon = trailing,
        singleLine = true,
        visualTransformation = visualTransformation,
        keyboardOptions = KeyboardOptions.Default,
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Accent,
            unfocusedBorderColor = BorderColor,
            focusedContainerColor = SurfaceColor,
            unfocusedContainerColor = SurfaceColor,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun OrDivider() {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.weight(1f).height(1.dp).background(DividerSoft))
        Text("or", fontSize = 13.sp, color = Placeholder, modifier = Modifier.padding(horizontal = 12.dp))
        Box(Modifier.weight(1f).height(1.dp).background(DividerSoft))
    }
}

private fun openUrl(context: android.content.Context, url: String) {
    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
}
