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
import androidx.compose.foundation.lazy.items
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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.kuklabs.kuktrip.data.trips.Day
import com.kuklabs.kuktrip.data.trips.Place
import com.kuklabs.kuktrip.data.trips.Reservation
import com.kuklabs.kuktrip.data.trips.Trip
import com.kuklabs.kuktrip.ui.maps.TripMapScreen
import com.kuklabs.kuktrip.ui.trips.TripsViewModel

private data class MainDestination(val route: String, val label: String, val icon: ImageVector)

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
    val tripsVm: TripsViewModel = viewModel()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    Scaffold(
        topBar = {
            TopAppBar(title = {
                Column {
                    Text("KukTrip", fontWeight = FontWeight.Bold)
                    Text(destinations.firstOrNull { it.route == currentRoute }?.label ?: "Travel", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            })
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
        NavHost(navController = navController, startDestination = "home", modifier = Modifier.padding(padding)) {
            composable("home") { HomeScreen(onOpenTrips = { navController.navigate("trips") }) }
            composable("trips") {
                TripsScreen(
                    vm = tripsVm,
                    onCreate = { navController.navigate("create") },
                    onOpen = { id -> tripsVm.openTrip(id); navController.navigate("trip/$id") },
                )
            }
            composable("trip/{id}") { TripDetailScreen(tripsVm, onOpenMap = { navController.navigate("trip-map") }) }
            composable("trip-map") {
                val state by tripsVm.state.collectAsState()
                TripMapScreen(state.places)
            }
            composable("explore") { ExploreScreen() }
            composable("profile") { ProfileScreen(onLogout) }
            composable("create") {
                CreateTripScreen(
                    onCreate = { title, start, end, days ->
                        tripsVm.createTrip(title, start, end, days)
                        navController.popBackStack()
                    },
                )
            }
        }
    }
}

@Composable
private fun HomeScreen(onOpenTrips: () -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text("Where are you going next?", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
            Text("Plan the trip, organize the details, then explore live experiences when you arrive.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { FeatureCard("Plan with KukTrip AI", "Describe destination, dates, travelers, budget and interests. KukTrip will prepare a reviewable itinerary.", Icons.Outlined.AutoAwesome) }
        item { FeatureCard("Your trips", "Itinerary, bookings, costs, documents, packing, routes and collaboration stay together.", Icons.Outlined.Route, onOpenTrips) }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickTile("Map", Icons.Outlined.Map, Modifier.weight(1f))
                QuickTile("Explore", Icons.Outlined.TravelExplore, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun TripsScreen(vm: TripsViewModel, onCreate: () -> Unit, onOpen: (Int) -> Unit) {
    val s by vm.state.collectAsState()
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Your trips", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Synced with your Kuklabs Account", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                TextButton(onClick = vm::refresh) { Text("Refresh") }
            }
        }
        s.error?.let { error -> item { Text(error, color = MaterialTheme.colorScheme.error) } }
        if (s.loading && s.trips.isEmpty()) item { CircularProgressIndicator() }
        if (!s.loading && s.trips.isEmpty()) {
            item { EmptyModuleScreen(Icons.Outlined.FlightTakeoff, "No trips yet", "Create your first trip or use KukTrip AI.", "Create trip", onCreate) }
        } else {
            items(s.trips, key = { it.id }) { trip -> TripCard(trip) { onOpen(trip.id) } }
        }
    }
}

@Composable
private fun TripCard(trip: Trip, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(18.dp)) {
            Text(trip.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            val dates = listOfNotNull(trip.startDate, trip.endDate).joinToString(" → ")
            if (dates.isNotBlank()) Text(dates, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(8.dp))
            Text("${trip.dayCount ?: 0} days • ${trip.placeCount ?: 0} places • ${trip.currency}", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun TripDetailScreen(vm: TripsViewModel, onOpenMap: () -> Unit) {
    val s by vm.state.collectAsState()
    val trip = s.selectedTrip
    if (trip == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(trip.title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text(listOfNotNull(trip.startDate, trip.endDate).joinToString(" → "), color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(8.dp))
            if (!trip.description.isNullOrBlank()) Text(trip.description)
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Itinerary", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                TextButton(onClick = vm::addDay) { Text("+ Day") }
            }
        }
        if (s.days.isEmpty()) item { Text("No itinerary days yet.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
        items(s.days, key = { "day-${it.id}" }) { day -> DayCard(day) }

        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Places", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("${s.places.size} saved", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (s.places.any { it.lat != null && it.lng != null }) {
                    TextButton(onClick = onOpenMap) { Text("Map") }
                }
            }
        }
        if (s.places.isEmpty()) item { Text("No saved places yet.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
        items(s.places, key = { "place-${it.id}" }) { place -> PlaceCard(place, trip.currency) }

        item { SectionTitle("Bookings", "${s.reservations.size} reservations") }
        if (s.reservations.isEmpty()) item { Text("No reservations yet.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
        items(s.reservations, key = { "reservation-${it.id}" }) { reservation -> ReservationCard(reservation) }
    }
}

@Composable
private fun SectionTitle(title: String, meta: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(meta, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun DayCard(day: Day) {
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text(day.title ?: "Day ${day.dayNumber ?: ""}", fontWeight = FontWeight.Bold)
            day.date?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            if (!day.notes.isNullOrBlank()) { Spacer(Modifier.height(6.dp)); Text(day.notes) }
            if (day.notesItems.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                day.notesItems.forEach { note -> Text("${note.time ?: ""} ${note.icon ?: "•"} ${note.text}".trim()) }
            }
        }
    }
}

@Composable
private fun PlaceCard(place: Place, tripCurrency: String) {
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text(place.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            if (!place.address.isNullOrBlank()) Text(place.address, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (!place.description.isNullOrBlank()) { Spacer(Modifier.height(6.dp)); Text(place.description) }
            place.price?.let { Text("Estimated: $it ${place.currency ?: tripCurrency}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        }
    }
}

@Composable
private fun ReservationCard(reservation: Reservation) {
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(reservation.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                Text(reservation.status.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(reservation.type.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
            reservation.reservationTime?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            if (!reservation.location.isNullOrBlank()) Text(reservation.location)
            if (!reservation.confirmationNumber.isNullOrBlank()) Text("Confirmation: ${reservation.confirmationNumber}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun CreateTripScreen(onCreate: (String, String?, String?, Int?) -> Unit) {
    var title by remember { mutableStateOf("") }
    var start by remember { mutableStateOf("") }
    var end by remember { mutableStateOf("") }
    var days by remember { mutableStateOf("7") }
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Create a trip", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        OutlinedTextField(title, { title = it }, label = { Text("Trip name") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(start, { start = it }, label = { Text("Start date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(end, { end = it }, label = { Text("End date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(days, { days = it.filter(Char::isDigit) }, label = { Text("Days") }, modifier = Modifier.fillMaxWidth())
        Button(onClick = { onCreate(title, start.ifBlank { null }, end.ifBlank { null }, days.toIntOrNull()) }, enabled = title.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text("Create trip") }
    }
}

@Composable
private fun ExploreScreen() = EmptyModuleScreen(Icons.Outlined.Explore, "Explore", "Destination discovery, nearby places and the opt-in social activity layer will live here.")

@Composable
private fun ProfileScreen(onLogout: () -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Profile", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold) }
        item { FeatureCard("One Kuklabs Account", "This device session is issued by the shared AuthKit. KukTrip does not maintain a separate password or user identity.", Icons.Outlined.Person) }
        item {
            Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onLogout), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                Text("Sign out of this device", color = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.padding(18.dp), fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun FeatureCard(title: String, body: String, icon: ImageVector, onClick: (() -> Unit)? = null) {
    Card(modifier = Modifier.fillMaxWidth().then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier), shape = RoundedCornerShape(18.dp)) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.Top) {
            Box(Modifier.size(44.dp).background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) { Icon(icon, null, tint = MaterialTheme.colorScheme.onPrimaryContainer) }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) { Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium); Spacer(Modifier.height(4.dp)); Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        }
    }
}

@Composable
private fun QuickTile(label: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(18.dp)) { Icon(icon, null, tint = MaterialTheme.colorScheme.primary); Spacer(Modifier.height(16.dp)); Text(label, fontWeight = FontWeight.SemiBold) } }
}

@Composable
private fun EmptyModuleScreen(icon: ImageVector, title: String, body: String, action: String? = null, onAction: (() -> Unit)? = null) {
    Column(modifier = Modifier.fillMaxSize().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(icon, null, modifier = Modifier.size(52.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(18.dp)); Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp)); Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (action != null && onAction != null) { Spacer(Modifier.height(18.dp)); TextButton(onClick = onAction) { Text(action) } }
    }
}
