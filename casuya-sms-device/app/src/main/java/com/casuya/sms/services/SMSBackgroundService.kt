package com.casuya.sms.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.casuya.sms.R
import com.casuya.sms.network.WebSocketClient
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.ui.MainActivity
import com.casuya.sms.utils.SMSHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

class SMSBackgroundService : Service() {

    companion object {
        const val CHANNEL_ID = "casuya_sms_channel"
        private const val TAG = "SMSBackgroundService"

        @Volatile
        var isConnected: Boolean = false
            private set

        @Volatile
        var smsCount: Int = 0
            private set

        @Volatile
        var smsReceivedCount: Int = 0
            private set

        @Volatile
        var lastSmsTime: Long = 0L
            private set

        @Volatile
        var instance: SMSBackgroundService? = null
            private set

        fun reconnectInstance() {
            instance?.reconnect()
        }

        fun disconnectInstance() {
            instance?.webSocketClient?.disconnect()
        }

        fun incrementReceivedCount() {
            synchronized(Companion) {
                smsReceivedCount++
            }
        }
    }

    private var webSocketClient: WebSocketClient? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val serviceScope = CoroutineScope(Dispatchers.Default)

    private fun reconnect() {
        webSocketClient?.reconnect()
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createChannel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(1, buildNotification())
        }
        acquireWakeLock()
        startWebSocket()
    }

    private fun acquireWakeLock() {
        try {
            val pm = getSystemService(POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "CasuyaSMS:WakeLock").apply {
                acquire(10 * 60 * 1000L /*10 minutes*/)
            }
            Log.d(TAG, "WakeLock acquired")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire WakeLock: ${e.message}")
        }
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
            Log.d(TAG, "WakeLock released")
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing WakeLock: ${e.message}")
        }
        wakeLock = null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (webSocketClient == null) startWebSocket()
        return START_STICKY
    }

    override fun onDestroy() {
        instance = null
        webSocketClient?.disconnect()
        releaseWakeLock()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startWebSocket() {
        val smsHandler = SMSHandler(this)
        webSocketClient = WebSocketClient(
            onSmsOrder = { smsLogId, to, message ->
                Log.d(TAG, "SMS order received: $smsLogId -> $to")
                
                serviceScope.launch {
                    if (!PrefsManager.isGatewayEnabled()) {
                        Log.w(TAG, "Gateway disabled, skipping SMS")
                        return@launch
                    }

                    val delaySec = PrefsManager.getSendDelay()
                    if (delaySec > 0) {
                        Log.d(TAG, "Applying send delay: ${delaySec}s")
                        delay(delaySec * 1000L)
                    }

                    smsHandler.send(to, message, smsLogId) { success ->
                        if (success) {
                            synchronized(Companion) {
                                smsCount++
                                lastSmsTime = System.currentTimeMillis()
                            }
                        }
                        webSocketClient?.reportSmsResult(smsLogId, success)
                        updateNotification()
                    }
                }
            },
            onStateChange = { connected ->
                isConnected = connected
                Log.d(TAG, "WebSocket state: connected=$connected")
                updateNotification()
            }
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
            .setContentText(getNotificationText())
            .setSmallIcon(R.drawable.ic_launcher)
            .setOngoing(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    this, 0, Intent(this, MainActivity::class.java),
                    PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()

    private fun getNotificationText(): String {
        return if (isConnected) {
            "Online \u2022 $smsCount SMS sent"
        } else {
            "Reconnecting..."
        }
    }

    private fun updateNotification() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.notify(1, buildNotification())
    }
}
