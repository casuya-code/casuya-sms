package com.casuya.sms.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object PrefsManager {
    private const val PREF_NAME = "casuya_secure_store"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_EMAIL = "user_email"

    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context,
            PREF_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveToken(token: String) = prefs.edit().putString(KEY_TOKEN, token).apply()
    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveDeviceId(deviceId: String) = prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
    fun getDeviceId(): String? = prefs.getString(KEY_DEVICE_ID, null)

    fun saveEmail(email: String) = prefs.edit().putString(KEY_EMAIL, email).apply()
    fun getEmail(): String? = prefs.getString(KEY_EMAIL, null)

    fun clear() {
        prefs.edit().remove(KEY_TOKEN).remove(KEY_DEVICE_ID).remove(KEY_EMAIL).apply()
    }

    fun isLoggedIn() = !getToken().isNullOrEmpty() && !getDeviceId().isNullOrEmpty()
}