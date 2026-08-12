package com.casuya.sms.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import com.casuya.sms.App
import com.casuya.sms.R
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.network.ApiClient
import com.casuya.sms.network.HeartbeatRequest
import com.casuya.sms.network.ReceivedSmsRequest
import com.casuya.sms.network.WebSocketClient
import com.casuya.sms.ui.MainActivity
import com.casuya.sms.utils.DiagnosticsManager
import com.casuya.sms.utils.SmsSyncManager
import com.casuya.sms.utils.SMSHandler
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collectLatest
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
        var isNetworkAvailable: Boolean = false
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
            DiagnosticsManager.log("Manual reconnect requested")
            instance?.reconnect()
        }

        fun disconnectInstance() {
            DiagnosticsManager.log("Manual disconnect requested")
            instance?.webSocketClient?.disconnect()
        }

        fun incrementReceivedCount() {
            synchronized(Companion) {
                smsReceivedCount++
            }
        }

        fun handleIncomingSms(from: String, message: String, timestamp: Long) {
            DiagnosticsManager.log("Incoming SMS from $from")
            instance?.reportReceivedSms(from, message, timestamp)
            incrementReceivedCount()
        }
    }

    private var webSocketClient: WebSocketClient? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var heartbeatJob: Job? = null

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            isNetworkAvailable = true
            DiagnosticsManager.log("Network available, attempting reconnect", "NETWORK")
            reconnect()
        }

        override fun onLost(network: Network) {
            isNetworkAvailable = false
            DiagnosticsManager.log("Network lost", "NETWORK")
        }
    }

    private fun reconnect() {
        webSocketClient?.reconnect()
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        DiagnosticsManager.log("Gateway Service created")
        createChannel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(1, buildNotification())
        }
        acquireWakeLock()
        registerNetworkCallback()
        startWebSocket()
        startHeartbeat()
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        cm.registerNetworkCallback(request, networkCallback)
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                if (isConnected) {
                    val deviceId = PrefsManager.getDeviceId()
                    if (deviceId != null) {
                        try {
                            val batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                            val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                            val status = registerReceiver(null, android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED))
                            val isCharging = status?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) == BatteryManager.BATTERY_STATUS_CHARGING
                            
                            ApiClient.apiService.sendHeartbeat(
                                HeartbeatRequest(deviceId, batteryLevel, isCharging)
                            )
                        } catch (e: Exception) {
                            Log.e(TAG, "Heartbeat failed: ${e.message}")
                        }
                    }
                }
                delay(60000) // Every 1 minute
            }
        }
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
        DiagnosticsManager.log("Gateway Service destroyed")
        serviceScope.cancel()
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        try { cm.unregisterNetworkCallback(networkCallback) } catch (e: Exception) {}
        webSocketClient?.disconnect()
        releaseWakeLock()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startWebSocket() {
        val smsHandler = SMSHandler(this)
        val database = (application as App).database

        // Start observing counts from DB
        serviceScope.launch {
            database.smsDao().getSentCount().collectLatest { synchronized(Companion) { smsCount = it } }
        }
        serviceScope.launch {
            database.smsDao().getReceivedCount().collectLatest { synchronized(Companion) { smsReceivedCount = it } }
        }
        serviceScope.launch {
            database.smsDao().getLastSmsTime().collectLatest { synchronized(Companion) { lastSmsTime = it ?: 0L } }
        }

        webSocketClient = WebSocketClient(
            onSmsOrder = { smsLogId, to, message ->
                DiagnosticsManager.log("Processing order: $smsLogId")
                
                serviceScope.launch {
                    if (!PrefsManager.isGatewayEnabled()) {
                        DiagnosticsManager.log("Skipping SMS: Gateway disabled", "WARN")
                        return@launch
                    }

                    val delaySec = PrefsManager.getSendDelay()
                    if (delaySec > 0) {
                        delay(delaySec * 1000L)
                    }

                    smsHandler.send(to, message, smsLogId) { success ->
                        if (success) {
                            DiagnosticsManager.log("SMS $smsLogId sent successfully")
                        } else {
                            DiagnosticsManager.log("SMS $smsLogId failed to send", "ERROR")
                        }
                        webSocketClient?.reportSmsResult(smsLogId, success)
                        updateNotification()
                    }
                }
            },
            onSyncRequest = {
                serviceScope.launch {
                    DiagnosticsManager.log("Sync requested from backend")
                    SmsSyncManager.fullSync(this@SMSBackgroundService)
                    DiagnosticsManager.log("Sync completed")
                }
            },
            onStateChange = { connected ->
                isConnected = connected
                DiagnosticsManager.log(if (connected) "Connected to server" else "Disconnected from server", if (connected) "INFO" else "WARN")
                updateNotification()
            }
        )
        webSocketClient?.connect()
    }

    private fun reportReceivedSms(from: String, message: String, timestamp: Long) {
        val deviceId = PrefsManager.getDeviceId() ?: return
        serviceScope.launch {
            try {
                ApiClient.apiService.reportReceivedSms(
                    ReceivedSmsRequest(from, message, timestamp, deviceId, 1)
                )
                DiagnosticsManager.log("Reported received SMS from $from")
            } catch (e: Exception) {
                DiagnosticsManager.log("Failed to report received SMS: ${e.message}", "ERROR")
            }
        }
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
            .setContentTitle("Casuya Gateway")
            .setContentText(getNotificationText())
            .setSmallIcon(R.drawable.ic_launcher)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(
                PendingIntent.getActivity(
                    this, 0, Intent(this, MainActivity::class.java),
                    PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()

    private fun getNotificationText(): String {
        return when {
            !isNetworkAvailable -> "Offline - Check internet connection"
            isConnected -> "Online \u2022 $smsCount sent \u2022 $smsReceivedCount received"
            else -> "Connecting..."
        }
    }

    private fun updateNotification() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.notify(1, buildNotification())
    }
}
