package com.kuklabs.kuktrip.ui.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.FlightTakeoff
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Route
import androidx.compose.material.icons.outlined.TravelExplore
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController

private data class MainDestination(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

private val destinations = listOf(
    MainDestination("home", "Home", Icons.Outlined.Home),
    MainDestination("trips", "Trips", Icons.Outlined.FlightTakeoff),
    MainDestination("explore", "Explore", Icons.Outlined.Explore),
    MainDestination("profile", "Profile", Icons.Outlined.Person),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KukTripApp(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("KukTrip", fontWeight = FontWeight.Bold)
                        Text(
                            destinations.firstOrNull { it.route == currentRoute }?.label ?: "Travel",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                },
            )
        },
        bottomBar = {
            NavigationBar {
                val currentDestination = backStack?.destination
                destinations.forEach { item ->
                    NavigationBarItem(
                        selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo("home") { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label) },
                    )
                }
            }
        },
        floatingActionButton = {
            if (currentRoute == "home" || currentRoute == "trips") {
                FloatingActionButton(onClick = { navController.navigate("create") }) {
                    Icon(Icons.Outlined.Add, contentDescription = "Create trip")
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(padding),
        ) {
            composable("home") { HomeScreen(onOpenTrips = { navController.navigate("trips") }) }
            composable("trips") { TripsScreen(onCreate = { navController.navigate("create") }) }
            composable("explore") { ExploreScreen() }
            composable("profile") { ProfileScreen(onLogout) }
            composable("create") { CreateTripScreen() }
        }
    }
}

@Composable
private fun HomeScreen(onOpenTrips: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Text("Where are you going next?", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
            Text(
                "Plan the trip, organize the details, then explore live experiences when you arrive.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        item {
            FeatureCard(
                title = "Plan with KukTrip AI",
                body = "Describe destination, dates, travelers, budget and interests. KukTrip will prepare a reviewable itinerary.",
                icon = Icons.Outlined.AutoAwesome,
            )
        }
        item {
            FeatureCard(
                title = "Your trips",
                body = "Itinerary, bookings, costs, documents, packing, routes and collaboration stay together.",
                icon = Icons.Outlined.Route,
                onClick = onOpenTrips,
            )
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickTile("Map", Icons.Outlined.Map, Modifier.weight(1f))
                QuickTile("Explore", Icons.Outlined.TravelExplore, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun TripsScreen(onCreate: () -> Unit) {
    EmptyModuleScreen(
        icon = Icons.Outlined.FlightTakeoff,
        title = "Trips",
        body = "The next API parity PR wires the existing KukTrip trip, itinerary, bookings, costs and offline data into this native screen.",
        action = "Create trip",
        onAction = onCreate,
    )
}

@Composable
private fun ExploreScreen() {
    EmptyModuleScreen(
        icon = Icons.Outlined.Explore,
        title = "Explore",
        body = "Destination discovery, nearby places and the opt-in social activity layer will live here.",
    )
}

@Composable
private fun ProfileScreen(onLogout: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Text("Profile", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text("Kuklabs Account identity and KukTrip settings stay separate.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item {
            FeatureCard(
                title = "One Kuklabs Account",
                body = "This device session is issued by the shared AuthKit. KukTrip does not maintain a separate password or user identity.",
                icon = Icons.Outlined.Person,
            )
        }
        item {
            Card(
                modifier = Modifier.fillMaxWidth().clickable(onClick = onLogout),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
            ) {
                Text(
                    "Sign out of this device",
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(18.dp),
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun CreateTripScreen() {
    EmptyModuleScreen(
        icon = Icons.Outlined.Add,
        title = "Create a trip",
        body = "Manual creation and AI Trip Builder will share one server contract. AI will propose changes; the user reviews before saving.",
    )
}

@Composable
private fun FeatureCard(
    title: String,
    body: String,
    icon: ImageVector,
    onClick: (() -> Unit)? = null,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(18.dp),
    ) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer)
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(4.dp))
                Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun QuickTile(label: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(18.dp)) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(16.dp))
            Text(label, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun EmptyModuleScreen(
    icon: ImageVector,
    title: String,
    body: String,
    action: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(52.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(18.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(body, textAlign = androidx.compose.ui.text.style.TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (action != null && onAction != null) {
            Spacer(Modifier.height(18.dp))
            TextButton(onClick = onAction) { Text(action) }
        }
    }
}
