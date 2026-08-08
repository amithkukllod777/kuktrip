package com.kuklabs.kuktrip.data.auth

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthKitApi {
    @GET("status")
    suspend fun status(): Response<AuthKitStatus>

    @POST("login")
    suspend fun login(@Body body: LoginBody): Response<TokenBundle>

    @POST("signup")
    suspend fun signup(@Body body: SignupBody): Response<TokenBundle>

    @POST("otp/request")
    suspend fun requestOtp(@Body body: OtpRequestBody): Response<Unit>

    @POST("otp/verify")
    suspend fun verifyOtp(@Body body: OtpVerifyBody): Response<TokenBundle>

    @POST("token/refresh")
    suspend fun refresh(@Body body: RefreshBody): Response<TokenBundle>

    @POST("logout")
    suspend fun logout(@Body body: LogoutBody): Response<Unit>
}
