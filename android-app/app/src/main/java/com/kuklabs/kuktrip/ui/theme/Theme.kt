package com.kuklabs.kuktrip.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    secondary = AccentPurple,
    background = Background,
    onBackground = TextPrimary,
    surface = SurfaceColor,
    onSurface = TextPrimary,
    error = ErrorColor,
    onError = Color.White,
)

@Composable
fun KukTripTheme(content: @Composable () -> Unit) {
    // Light-only for now (auth surface is light per the approved reference).
    MaterialTheme(
        colorScheme = LightColors,
        typography = KukTripTypography,
        content = content,
    )
}
