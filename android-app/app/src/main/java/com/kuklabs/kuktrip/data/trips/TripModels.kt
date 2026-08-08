package com.kuklabs.kuktrip.data.trips

import com.google.gson.annotations.SerializedName

data class Trip(
    val id: Int,
    @SerializedName("user_id") val userId: Int,
    val title: String,
    val description: String? = null,
    @SerializedName("start_date") val startDate: String? = null,
    @SerializedName("end_date") val endDate: String? = null,
    val currency: String = "USD",
    @SerializedName("cover_image") val coverImage: String? = null,
    @SerializedName("is_archived") val isArchived: Int = 0,
    @SerializedName("reminder_days") val reminderDays: Int = 0,
    @SerializedName("day_count") val dayCount: Int? = null,
    @SerializedName("place_count") val placeCount: Int? = null,
    @SerializedName("is_owner") val isOwner: Int? = null,
    @SerializedName("owner_username") val ownerUsername: String? = null,
    @SerializedName("shared_count") val sharedCount: Int? = null,
)

data class TripsEnvelope(val trips: List<Trip> = emptyList())
data class TripEnvelope(val trip: Trip)

data class CreateTripBody(
    val title: String,
    val description: String? = null,
    @SerializedName("start_date") val startDate: String? = null,
    @SerializedName("end_date") val endDate: String? = null,
    val currency: String? = null,
    @SerializedName("day_count") val dayCount: Int? = null,
)

data class Day(
    val id: Int,
    @SerializedName("trip_id") val tripId: Int,
    @SerializedName("day_number") val dayNumber: Int? = null,
    val date: String? = null,
    val title: String? = null,
    val notes: String? = null,
    @SerializedName("notes_items") val notesItems: List<DayNote> = emptyList(),
)

data class DayNote(
    val id: Int,
    @SerializedName("day_id") val dayId: Int,
    val text: String,
    val time: String? = null,
    val icon: String? = null,
)

data class Place(
    val id: Int,
    @SerializedName("trip_id") val tripId: Int,
    val name: String,
    val description: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val address: String? = null,
    val price: Double? = null,
    val currency: String? = null,
    @SerializedName("image_url") val imageUrl: String? = null,
    val website: String? = null,
    val phone: String? = null,
)

data class Reservation(
    val id: Int,
    @SerializedName("trip_id") val tripId: Int,
    val title: String,
    val type: String = "other",
    val status: String = "planned",
    @SerializedName("reservation_time") val reservationTime: String? = null,
    @SerializedName("reservation_end_time") val reservationEndTime: String? = null,
    val location: String? = null,
    @SerializedName("confirmation_number") val confirmationNumber: String? = null,
    val notes: String? = null,
    val url: String? = null,
)

data class DayEnvelope(val day: Day)
data class PlacesEnvelope(val places: List<Place> = emptyList())
data class ReservationsEnvelope(val reservations: List<Reservation> = emptyList())
data class CreateDayBody(val date: String? = null, val notes: String? = null, val position: Int? = null)
