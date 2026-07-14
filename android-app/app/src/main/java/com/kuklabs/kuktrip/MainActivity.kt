package com.kuklabs.kuktrip

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.kuklabs.kuktrip.ui.auth.AuthScreen
import com.kuklabs.kuktrip.ui.theme.KukTripTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            KukTripTheme {
                AuthScreen()
            }
        }
    }
}
