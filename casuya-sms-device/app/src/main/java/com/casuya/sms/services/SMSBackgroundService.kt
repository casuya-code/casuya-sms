package com.casuya.sms.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.casuya.sms.R
import com.casuya.sms.network.WebSocketClient
import com.casuya.sms.ui.MainActivity
import com.casuya.sms.utils.SMSHandler

class SMSBackgroundService : Service() {

    companion object {
        const val CHANNEL_ID = "casuya_sms_channel"
    }

    private var webSocketClient: WebSocketClient? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
        startForeground(1, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        startWebSocket()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (webSocketClient == null) startWebSocket()
        return START_STICKY
    }

    override fun onDestroy() {
        webSocketClient?.disconnect()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startWebSocket() {
        val smsHandler = SMSHandler(this)
        webSocketClient = WebSocketClient(
            onSmsOrder = { smsId, to, message ->
                val success = smsHandler.send(to, message)
                webSocketClient?.reportSmsResult(smsId, success)
            },
            onStateChange = {}
        )
        webSocketClient?.connect()
    }

    private fun createChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "casuya-sms gateway",
            NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification() =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("casuya-sms")
            .setContentText("Gateway online - receiving SMS orders")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    this, 0, Intent(this, MainActivity::class.java),
                    PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()
}