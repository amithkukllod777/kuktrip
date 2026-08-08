package com.kuklabs.kuktrip.data.explore

import android.content.Context
import com.google.gson.annotations.SerializedName
import com.kuklabs.kuktrip.BuildConfig
import com.kuklabs.kuktrip.data.auth.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

data class ExploreActivity(
    val id: Int,
    val hostUserId: Int,
    val title: String,
    val category: String,
    val description: String? = null,
    val destination: String? = null,
    val area: String? = null,
    val startAt: String,
    val endAt: String? = null,
    val timezone: String? = null,
    val capacity: Int? = null,
    val joinMode: String = "approval",
    val lat: Double? = null,
    val lng: Double? = null,
    val participantCount: Int = 0,
    val myStatus: String? = null,
)

data class CreateExploreActivityBody(
    val title: String,
    val category: String,
    val description: String? = null,
    val destination: String? = null,
    val area: String? = null,
    val startAt: String,
    val endAt: String? = null,
    val timezone: String? = null,
    val capacity: Int? = null,
    val visibility: String = "public",
    val joinMode: String = "approval",
    val tripId: Int? = null,
    val publicLat: Double? = null,
    val publicLng: Double? = null,
)

data class CreateActivityResult(val id: Int)
data class JoinActivityResult(val status: String, val alreadyHost: Boolean? = null)
data class DiscoveryBody(val enabled: Boolean, val showUpcomingDestinations: Boolean = false, val interests: List<String> = emptyList())
data class DiscoveryResult(val enabled: Boolean)

private interface ExploreApi {
    @GET("api/explore/activities")
    suspend fun activities(@Header("Authorization") auth: String, @Query("destination") destination: String? = null): Response<List<ExploreActivity>>

    @POST("api/explore/activities")
    suspend fun create(@Header("Authorization") auth: String, @Body body: CreateExploreActivityBody): Response<CreateActivityResult>

    @POST("api/explore/activities/{id}/join")
    suspend fun join(@Header("Authorization") auth: String, @Path("id") id: Int): Response<JoinActivityResult>

    @PUT("api/explore/discovery")
    suspend fun discovery(@Header("Authorization") auth: String, @Body body: DiscoveryBody): Response<DiscoveryResult>
}

class ExploreRepository(context: Context) {
    private val auth = AuthRepository(context)
    private val api = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(OkHttpClient.Builder().build())
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(ExploreApi::class.java)

    private suspend fun bearer(): String = "Bearer " + (auth.validAccessToken()
        ?: throw ExploreDataException("Your Kuklabs session expired. Sign in again."))

    suspend fun listActivities(destination: String? = null): List<ExploreActivity> = withContext(Dispatchers.IO) {
        val r = api.activities(bearer(), destination?.trim()?.takeIf { it.isNotEmpty() })
        if (!r.isSuccessful) throw ExploreDataException("Could not load Explore (${r.code()}).")
        r.body().orEmpty()
    }

    suspend fun createActivity(body: CreateExploreActivityBody): CreateActivityResult = withContext(Dispatchers.IO) {
        val r = api.create(bearer(), body)
        if (!r.isSuccessful) throw ExploreDataException("Could not create activity (${r.code()}).")
        r.body() ?: throw ExploreDataException("Activity response was empty.")
    }

    suspend fun joinActivity(id: Int): JoinActivityResult = withContext(Dispatchers.IO) {
        val r = api.join(bearer(), id)
        if (!r.isSuccessful) throw ExploreDataException("Could not join activity (${r.code()}).")
        r.body() ?: throw ExploreDataException("Join response was empty.")
    }

    suspend fun setTravelerDiscovery(enabled: Boolean, interests: List<String> = emptyList()): DiscoveryResult = withContext(Dispatchers.IO) {
        val r = api.discovery(bearer(), DiscoveryBody(enabled, enabled, interests.take(30)))
        if (!r.isSuccessful) throw ExploreDataException("Could not update traveler discovery (${r.code()}).")
        r.body() ?: DiscoveryResult(enabled)
    }
}

class ExploreDataException(message: String) : Exception(message)
