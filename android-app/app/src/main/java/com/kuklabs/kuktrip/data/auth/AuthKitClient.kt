package com.kuklabs.kuktrip.data.auth

import com.google.gson.Gson
import com.kuklabs.kuktrip.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object AuthKitClient {
    private val gson = Gson()

    private val productHeader = Interceptor { chain ->
        val request = chain.request().newBuilder()
            .header("X-Kuklabs-Product", BuildConfig.KUKLABS_PRODUCT_ID)
            .header("Accept", "application/json")
            .build()
        chain.proceed(request)
    }

    private val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC
        else HttpLoggingInterceptor.Level.NONE
        redactHeader("Authorization")
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .addInterceptor(productHeader)
        .addInterceptor(logging)
        .build()

    val api: AuthKitApi = Retrofit.Builder()
        .baseUrl(BuildConfig.AUTHKIT_BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()
        .create(AuthKitApi::class.java)

    fun parseError(raw: String?): AuthKitError? = try {
        if (raw.isNullOrBlank()) null else gson.fromJson(raw, AuthKitError::class.java)
    } catch (_: Exception) {
        null
    }
}
