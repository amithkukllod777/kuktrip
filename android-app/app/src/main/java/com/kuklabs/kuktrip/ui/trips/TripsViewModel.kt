package com.kuklabs.kuktrip.ui.trips

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kuklabs.kuktrip.data.trips.CreateTripBody
import com.kuklabs.kuktrip.data.trips.Day
import com.kuklabs.kuktrip.data.trips.Place
import com.kuklabs.kuktrip.data.trips.Reservation
import com.kuklabs.kuktrip.data.trips.Trip
import com.kuklabs.kuktrip.data.trips.TripRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TripsUiState(
    val loading: Boolean = false,
    val trips: List<Trip> = emptyList(),
    val selectedTrip: Trip? = null,
    val days: List<Day> = emptyList(),
    val places: List<Place> = emptyList(),
    val reservations: List<Reservation> = emptyList(),
    val error: String? = null,
)

class TripsViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = TripRepository(application.applicationContext)
    private val _state = MutableStateFlow(TripsUiState())
    val state: StateFlow<TripsUiState> = _state.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            runCatching { repo.listTrips() }
                .onSuccess { _state.value = _state.value.copy(loading = false, trips = it) }
                .onFailure { _state.value = _state.value.copy(loading = false, error = it.message) }
        }
    }

    fun openTrip(id: Int) {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            runCatching {
                val trip = async { repo.getTrip(id) }
                val days = async { repo.listDays(id) }
                val places = async { repo.listPlaces(id) }
                val reservations = async { repo.listReservations(id) }
                TripDetailPayload(trip.await(), days.await(), places.await(), reservations.await())
            }.onSuccess { payload ->
                _state.value = _state.value.copy(
                    loading = false,
                    selectedTrip = payload.trip,
                    days = payload.days,
                    places = payload.places,
                    reservations = payload.reservations,
                )
            }.onFailure {
                _state.value = _state.value.copy(loading = false, error = it.message)
            }
        }
    }

    fun closeTrip() {
        _state.value = _state.value.copy(selectedTrip = null, days = emptyList(), places = emptyList(), reservations = emptyList())
    }

    fun createTrip(title: String, startDate: String?, endDate: String?, dayCount: Int?) {
        if (title.isBlank()) return
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            runCatching { repo.createTrip(CreateTripBody(title.trim(), startDate = startDate?.ifBlank { null }, endDate = endDate?.ifBlank { null }, dayCount = dayCount)) }
                .onSuccess { trip ->
                    _state.value = _state.value.copy(loading = false, trips = listOf(trip) + _state.value.trips, selectedTrip = trip)
                    openTrip(trip.id)
                }
                .onFailure { _state.value = _state.value.copy(loading = false, error = it.message) }
        }
    }

    fun addDay() {
        val trip = _state.value.selectedTrip ?: return
        viewModelScope.launch {
            runCatching { repo.addDay(trip.id) }
                .onSuccess { day -> _state.value = _state.value.copy(days = _state.value.days + day) }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }
}

private data class TripDetailPayload(
    val trip: Trip,
    val days: List<Day>,
    val places: List<Place>,
    val reservations: List<Reservation>,
)
