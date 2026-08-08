package com.kuklabs.kuktrip.data.trips

import android.content.Context
import com.kuklabs.kuktrip.BuildConfig
import com.kuklabs.kuktrip.data.auth.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class TripRepository(context: Context) {
    private val auth = AuthRepository(context)
    private val api: TripApi = Retrofit.Builder().baseUrl(BuildConfig.API_BASE_URL).client(OkHttpClient.Builder().build()).addConverterFactory(GsonConverterFactory.create()).build().create(TripApi::class.java)

    private suspend fun bearer(): String {
        val token = auth.validAccessToken() ?: throw TripDataException("Your Kuklabs session expired. Sign in again.")
        return "Bearer $token"
    }

    suspend fun listTrips(archived: Boolean = false): List<Trip> = withContext(Dispatchers.IO) {
        val response = api.listTrips(bearer(), if (archived) 1 else 0); if (!response.isSuccessful) throw TripDataException("Could not load trips (${response.code()})."); response.body()?.trips.orEmpty()
    }
    suspend fun getTrip(id: Int): Trip = withContext(Dispatchers.IO) {
        val response = api.getTrip(bearer(), id); if (!response.isSuccessful) throw TripDataException("Could not load this trip (${response.code()})."); response.body()?.trip ?: throw TripDataException("Trip response was empty.")
    }
    suspend fun createTrip(body: CreateTripBody): Trip = withContext(Dispatchers.IO) {
        val response = api.createTrip(bearer(), body); if (!response.isSuccessful) throw TripDataException("Could not create trip (${response.code()})."); response.body()?.trip ?: throw TripDataException("Trip response was empty.")
    }
    suspend fun deleteTrip(id: Int) = withContext(Dispatchers.IO) { val response = api.deleteTrip(bearer(), id); if (!response.isSuccessful) throw TripDataException("Could not delete trip (${response.code()}).") }
    suspend fun listDays(tripId: Int): List<Day> = withContext(Dispatchers.IO) { val response = api.listDays(bearer(), tripId); if (!response.isSuccessful) throw TripDataException("Could not load itinerary (${response.code()})."); response.body().orEmpty() }
    suspend fun listPlaces(tripId: Int): List<Place> = withContext(Dispatchers.IO) { val response = api.listPlaces(bearer(), tripId); if (!response.isSuccessful) throw TripDataException("Could not load places (${response.code()})."); response.body()?.places.orEmpty() }
    suspend fun listReservations(tripId: Int): List<Reservation> = withContext(Dispatchers.IO) { val response = api.listReservations(bearer(), tripId); if (!response.isSuccessful) throw TripDataException("Could not load bookings (${response.code()})."); response.body()?.reservations.orEmpty() }
    suspend fun listBudget(tripId: Int): List<BudgetItem> = withContext(Dispatchers.IO) { val response = api.listBudget(bearer(), tripId); if (!response.isSuccessful) throw TripDataException("Could not load budget (${response.code()})."); response.body()?.items.orEmpty() }
    suspend fun createBudgetItem(tripId: Int, body: CreateBudgetItemBody): BudgetItem = withContext(Dispatchers.IO) { val response = api.createBudgetItem(bearer(), tripId, body); if (!response.isSuccessful) throw TripDataException("Could not add expense (${response.code()})."); response.body()?.item ?: throw TripDataException("Budget response was empty.") }
    suspend fun addDay(tripId: Int): Day = withContext(Dispatchers.IO) { val response = api.createDay(bearer(), tripId); if (!response.isSuccessful) throw TripDataException("Could not add itinerary day (${response.code()})."); response.body()?.day ?: throw TripDataException("Day response was empty.") }
}

class TripDataException(message: String) : Exception(message)
