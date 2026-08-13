package com.casuya.sms.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.SecureRandom
import java.util.UUID

object PrefsManager {
    private const val PREF_NAME = "casuya_secure_store"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_PAIRING_KEY = "pairing_key"
    private const val KEY_EMAIL = "user_email"
    private const val KEY_GATEWAY_ENABLED = "gateway_enabled"
    private const val KEY_STICKY_NOTIF = "sticky_notif"
    private const val KEY_SEND_DELAY = "send_delay"
    private const val KEY_SIM_SLOT = "sim_slot"

    private var prefs: SharedPreferences? = null

    fun init(context: Context) {
        try {
            initPrefs(context)
        } catch (e: Exception) {
            // If initialization fails (e.g. corrupted key), clear and retry once
            try {
                context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE).edit().clear().apply()
                initPrefs(context)
            } catch (e2: Exception) {
                // Last resort: Fallback to plain preferences so the app doesn't crash
                prefs = context.getSharedPreferences(PREF_NAME + "_fallback", Context.MODE_PRIVATE)
            }
        }
    }

    private fun initPrefs(context: Context) {
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

    fun saveToken(token: String) = prefs?.edit()?.putString(KEY_TOKEN, token)?.apply()
    fun getToken(): String? = prefs?.getString(KEY_TOKEN, null)

    fun saveDeviceId(deviceId: String) = prefs?.edit()?.putString(KEY_DEVICE_ID, deviceId)?.apply()
    fun getDeviceId(): String? = prefs?.getString(KEY_DEVICE_ID, null)

    fun savePairingKey(key: String) = prefs?.edit()?.putString(KEY_PAIRING_KEY, key)?.apply()
    fun getPairingKey(): String? = prefs?.getString(KEY_PAIRING_KEY, null)

    fun ensureDeviceIdentity() {
        if (getDeviceId() == null) saveDeviceId(UUID.randomUUID().toString())
        if (getPairingKey() == null) savePairingKey(generatePairingKey())
    }

    private fun generatePairingKey(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return "casuya_dv_" + bytes.joinToString("") { "%02x".format(it.toInt() and 0xff) }
    }

    fun saveEmail(email: String) = prefs?.edit()?.putString(KEY_EMAIL, email)?.apply()
    fun getEmail(): String? = prefs?.getString(KEY_EMAIL, null)

    fun isGatewayEnabled() = prefs?.getBoolean(KEY_GATEWAY_ENABLED, true) ?: true
    fun setGatewayEnabled(enabled: Boolean) = prefs?.edit()?.putBoolean(KEY_GATEWAY_ENABLED, enabled)?.apply()

    fun isStickyNotifEnabled() = prefs?.getBoolean(KEY_STICKY_NOTIF, true) ?: true
    fun setStickyNotifEnabled(enabled: Boolean) = prefs?.edit()?.putBoolean(KEY_STICKY_NOTIF, enabled)?.apply()

    fun getSendDelay() = prefs?.getInt(KEY_SEND_DELAY, 2) ?: 2
    fun setSendDelay(delay: Int) = prefs?.edit()?.putInt(KEY_SEND_DELAY, delay)?.apply()

    fun getSimSlot() = prefs?.getInt(KEY_SIM_SLOT, 0) ?: 0 // 0 for Auto/Default
    fun setSimSlot(slot: Int) = prefs?.edit()?.putInt(KEY_SIM_SLOT, slot)?.apply()

    fun clearSession() {
        prefs?.edit()?.remove(KEY_TOKEN)?.remove(KEY_EMAIL)?.apply()
    }

    fun clearAll() {
        prefs?.edit()?.clear()?.apply()
    }

    fun isLoggedIn() = !getToken().isNullOrEmpty() && !getDeviceId().isNullOrEmpty()
}