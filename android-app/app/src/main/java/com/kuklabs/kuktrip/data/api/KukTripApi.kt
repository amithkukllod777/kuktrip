package com.kuklabs.kuktrip.data.api

import com.kuklabs.kuktrip.data.model.AppConfig
import com.kuklabs.kuktrip.data.model.AuthResponse
import com.kuklabs.kuktrip.data.model.LoginRequest
import com.kuklabs.kuktrip.data.model.RegisterRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/** Auth surface of the Kuk Trip server. Extend with trips/itinerary/etc. */
interface KukTripApi {

    @GET("api/auth/app-config")
    suspend fun getAppConfig(): AppConfig

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse
}
