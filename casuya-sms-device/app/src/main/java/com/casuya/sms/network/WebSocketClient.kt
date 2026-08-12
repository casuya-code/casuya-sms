package com.casuya.sms.network

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.casuya.sms.BuildConfig
import com.casuya.sms.data.local.PrefsManager
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class WebSocketClient(
    private val onSmsOrder: (smsLogId: String, to: String, message: String) -> Unit,
    private val onSyncRequest: () -> Unit,
    private val onStateChange: (Boolean) -> Unit
) {
    private var socket: WebSocket? = null
    private var reconnect = true
    private val handler = Handler(Looper.getMainLooper())

    fun connect() {
        val deviceId = PrefsManager.getDeviceId() ?: run {
            onStateChange(false)
            return
        }
        val token = PrefsManager.getToken() ?: run {
            Log.e(TAG, "No JWT token available, cannot connect")
            onStateChange(false)
            return
        }

        val baseUrl = BuildConfig.BASE_URL.trimEnd('/')
        val url = baseUrl
            .replace("http://", "ws://")
            .replace("https://", "wss://") +
            "/?deviceId=$deviceId&token=$token"

        Log.d(TAG, "Connecting to $url")

        val request = Request.Builder().url(url).build()
        socket = ApiClient.httpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                onStateChange(true)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}")
                onStateChange(false)
                scheduleReconnect()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code $reason")
                onStateChange(false)
                scheduleReconnect()
            }
        })
    }

    internal fun handleMessage(text: String) {
        try {
            val payload = org.json.JSONObject(text)
            when (payload.getString("type")) {
                "sms:send" -> {
                    onSmsOrder(
                        payload.getString("sms_log_id"),
                        payload.getString("to"),
                        payload.getString("message")
                    )
                }
                "sms:sync" -> {
                    onSyncRequest()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse WebSocket message: ${e.message}")
        }
    }

    private fun scheduleReconnect() {
        if (!reconnect) return
        handler.postDelayed({
            if (reconnect) connect()
        }, 5000)
    }

    fun disconnect() {
        reconnect = false
        handler.removeCallbacksAndMessages(null)
        socket?.close(1000, "bye")
        socket = null
    }

    fun reconnect() {
        disconnect()
        reconnect = true
        connect()
    }

    fun reportSmsResult(smsLogId: String, success: Boolean) {
        try {
            val payload = org.json.JSONObject()
                .put("type", "sms:status")
                .put("sms_log_id", smsLogId)
                .put("success", success)
            socket?.send(payload.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Failed to report SMS result: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "WebSocketClient"
    }
}
