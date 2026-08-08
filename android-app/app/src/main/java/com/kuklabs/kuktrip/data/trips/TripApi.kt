package com.kuklabs.kuktrip.data.trips

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface TripApi {
    @GET("api/trips")
    suspend fun listTrips(
        @Header("Authorization") authorization: String,
        @Query("archived") archived: Int = 0,
    ): Response<TripsEnvelope>

    @GET("api/trips/{id}")
    suspend fun getTrip(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int,
    ): Response<TripEnvelope>

    @POST("api/trips")
    suspend fun createTrip(
        @Header("Authorization") authorization: String,
        @Body body: CreateTripBody,
    ): Response<TripEnvelope>

    @DELETE("api/trips/{id}")
    suspend fun deleteTrip(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int,
    ): Response<Map<String, Any>>

    @GET("api/trips/{tripId}/days")
    suspend fun listDays(
        @Header("Authorization") authorization: String,
        @Path("tripId") tripId: Int,
    ): Response<List<Day>>

    @POST("api/trips/{tripId}/days")
    suspend fun createDay(
        @Header("Authorization") authorization: String,
        @Path("tripId") tripId: Int,
        @Body body: CreateDayBody = CreateDayBody(),
    ): Response<DayEnvelope>
}
