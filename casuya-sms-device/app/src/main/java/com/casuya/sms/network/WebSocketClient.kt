package com.casuya.sms.network

import android.os.Handler
import android.os.Looper
import com.casuya.sms.BuildConfig
import com.casuya.sms.data.local.PrefsManager
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class WebSocketClient(
    private val onSmsOrder: (smsId: String, to: String, message: String) -> Unit,
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
        val url = BuildConfig.BASE_URL
            .replace("http://", "ws://")
            .replace("https://", "wss://") +
            "/?deviceId=$deviceId"

        val request = Request.Builder().url(url).build()
        socket = OkHttpClient().newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                onStateChange(true)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val payload = org.json.JSONObject(text)
                if (payload.getString("type") == "sms:send") {
                    onSmsOrder(
                        payload.getString("sms_id"),
                        payload.getString("to"),
                        payload.getString("message")
                    )
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                onStateChange(false)
                scheduleReconnect()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                onStateChange(false)
                scheduleReconnect()
            }
        })
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

    fun reportSmsResult(smsId: String, success: Boolean) {
        try {
            val payload = org.json.JSONObject()
                .put("type", "sms:status")
                .put("sms_id", smsId)
                .put("success", success)
            socket?.send(payload.toString())
        } catch (e: Exception) {
        }
    }
}