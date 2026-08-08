package com.kuklabs.kuktrip.data.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.google.gson.Gson
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Stores the rotating AuthKit token bundle encrypted at rest.
 * The AES key never leaves AndroidKeyStore; SharedPreferences receives only
 * IV+ciphertext. This is a device-session cache, never an identity source.
 */
class SecureSessionStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val gson = Gson()

    data class StoredSession(
        val accessToken: String,
        val refreshToken: String,
        val expiresAtEpochMs: Long,
        val user: AuthKitUser? = null,
    )

    fun read(): StoredSession? {
        val iv = prefs.getString(KEY_IV, null) ?: return null
        val payload = prefs.getString(KEY_PAYLOAD, null) ?: return null
        return try {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)))
            val clear = cipher.doFinal(Base64.decode(payload, Base64.NO_WRAP))
            gson.fromJson(String(clear, StandardCharsets.UTF_8), StoredSession::class.java)
        } catch (_: Exception) {
            clear()
            null
        }
    }

    fun write(bundle: TokenBundle) {
        val expiresAt = if (bundle.expiresInSeconds > 0) {
            System.currentTimeMillis() + bundle.expiresInSeconds * 1000L
        } else 0L
        write(
            StoredSession(
                accessToken = bundle.accessToken,
                refreshToken = bundle.refreshToken,
                expiresAtEpochMs = expiresAt,
                user = bundle.user,
            ),
        )
    }

    fun write(session: StoredSession) {
        val clear = gson.toJson(session).toByteArray(StandardCharsets.UTF_8)
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val encrypted = cipher.doFinal(clear)
        prefs.edit()
            .putString(KEY_IV, Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
            .putString(KEY_PAYLOAD, Base64.encodeToString(encrypted, Base64.NO_WRAP))
            .apply()
    }

    fun clear() {
        prefs.edit().remove(KEY_IV).remove(KEY_PAYLOAD).apply()
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE).run {
            init(
                KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setRandomizedEncryptionRequired(true)
                    .build(),
            )
            generateKey()
        }
    }

    companion object {
        private const val PREFS = "kuktrip_secure_session"
        private const val KEY_IV = "session_iv"
        private const val KEY_PAYLOAD = "session_payload"
        private const val KEYSTORE = "AndroidKeyStore"
        private const val KEY_ALIAS = "kuktrip_authkit_session_v1"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}
