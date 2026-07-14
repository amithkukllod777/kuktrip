package com.kuklabs.kuktrip.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * KukTrip "K" product mark (placeholder — replace with the official logo asset
 * once available). Navy stem + blue→purple chevron + travel pin, on a white
 * rounded square, matching client/public/icons/icon.svg.
 */
@Composable
fun KukTripMark(size: Dp = 80.dp) {
    Canvas(
        modifier = Modifier
            .size(size)
            .shadow(12.dp, RoundedCornerShape(size * 0.23f))
            .clip(RoundedCornerShape(size * 0.23f))
            .background(Color.White)
    ) {
        val s = this.size.minDimension
        val u = s / 512f
        fun p(x: Float, y: Float) = Offset(x * u, y * u)
        val arm = Brush.linearGradient(
            colors = listOf(Color(0xFF2F6BFF), Color(0xFF7C3AED)),
            start = p(200f, 140f), end = p(392f, 372f),
        )
        val stem = Brush.linearGradient(
            colors = listOf(Color(0xFF24318A), Color(0xFF1A2352)),
            start = p(177f, 140f), end = p(177f, 372f),
        )
        drawLine(stem, p(177f, 150f), p(177f, 362f), strokeWidth = 76f * u, cap = StrokeCap.Round)
        drawLine(arm, p(206f, 258f), p(358f, 152f), strokeWidth = 58f * u, cap = StrokeCap.Round)
        drawLine(arm, p(206f, 258f), p(358f, 364f), strokeWidth = 58f * u, cap = StrokeCap.Round)
        // travel pin at the upper-right tip
        drawCircle(Color(0xFF7C3AED), radius = 26f * u, center = p(378f, 150f))
        drawCircle(Color.White, radius = 10f * u, center = p(378f, 146f))
    }
}
