package com.kuklabs.kuktrip

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.kuklabs.kuktrip.data.auth.AuthRepository
import com.kuklabs.kuktrip.ui.app.KukTripApp
import com.kuklabs.kuktrip.ui.auth.AuthScreen
import com.kuklabs.kuktrip.ui.theme.KukTripTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            KukTripTheme {
                val repository = remember { AuthRepository(applicationContext) }
                val scope = rememberCoroutineScope()
                var authenticated by remember { mutableStateOf<Boolean?>(null) }

                LaunchedEffect(Unit) {
                    authenticated = repository.validAccessToken() != null
                }

                when (authenticated) {
                    null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                    true -> KukTripApp(
                        onLogout = {
                            scope.launch {
                                repository.logout()
                                authenticated = false
                            }
                        },
                    )
                    false -> AuthScreen(onAuthenticated = { authenticated = true })
                }
            }
        }
    }
}
