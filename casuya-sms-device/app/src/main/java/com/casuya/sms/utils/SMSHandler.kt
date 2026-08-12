package com.casuya.sms.utils

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.Manifest
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.casuya.sms.App
import com.casuya.sms.data.db.SmsMessage
import com.casuya.sms.data.local.PrefsManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SMSHandler(private val context: Context) {
    private val scope = CoroutineScope(Dispatchers.IO)
    private val database = (context.applicationContext as App).database

    companion object {
        private const val TAG = "SMSHandler"
        private const val ACTION_SMS_SENT = "com.casuya.sms.SMS_SENT"
    }

    private fun getSmsManager(): SmsManager {
        val slotIndex = PrefsManager.getSimSlot() // 0 for Auto, 1 for SIM 1, 2 for SIM 2
        
        if (slotIndex == 0) {
            return if (Build.VERSION.SDK_INT >= 31) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }

        // Specific SIM Slot requested
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "Missing READ_PHONE_STATE permission, falling back to default SIM")
            return if (Build.VERSION.SDK_INT >= 31) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }

        return try {
            val subscriptionManager = context.getSystemService(SubscriptionManager::class.java)
            val activeSubscriptions = subscriptionManager.activeSubscriptionInfoList
            
            // Map Slot Index (1-based) to Subscription Info
            val info = activeSubscriptions?.find { it.simSlotIndex == slotIndex - 1 }
            
            if (info != null) {
                if (Build.VERSION.SDK_INT >= 31) {
                    context.getSystemService(SmsManager::class.java).createForSubscriptionId(info.subscriptionId)
                } else {
                    @Suppress("DEPRECATION")
                    SmsManager.getSmsManagerForSubscriptionId(info.subscriptionId)
                }
            } else {
                Log.w(TAG, "Requested SIM slot $slotIndex not found, falling back to default")
                if (Build.VERSION.SDK_INT >= 31) {
                    context.getSystemService(SmsManager::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    SmsManager.getDefault()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting SmsManager for subscription: ${e.message}")
            if (Build.VERSION.SDK_INT >= 31) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }
    }

    fun send(to: String, message: String, smsLogId: String, onResult: (Boolean) -> Unit) {
        try {
            val smsManager = getSmsManager()
            val parts = smsManager.divideMessage(message)
            val intentAction = "$ACTION_SMS_SENT.$smsLogId"

            val sentIntent = PendingIntent.getBroadcast(
                context,
                smsLogId.hashCode(),
                Intent(intentAction),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_ONE_SHOT
            )

            val receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val success = resultCode == Activity.RESULT_OK
                    Log.d(TAG, "SMS result for $smsLogId: success=$success (code=$resultCode)")
                    
                    if (success) {
                        scope.launch {
                            database.smsDao().insert(SmsMessage(
                                address = to,
                                body = message,
                                date = System.currentTimeMillis(),
                                type = 2 // Sent
                            ))
                        }
                    }
                    
                    onResult(success)
                    context.unregisterReceiver(this)
                }
            }

            if (Build.VERSION.SDK_INT >= 33) {
                context.registerReceiver(receiver, IntentFilter(intentAction), Context.RECEIVER_NOT_EXPORTED)
            } else {
                context.registerReceiver(receiver, IntentFilter(intentAction))
            }

            if (parts.size == 1) {
                smsManager.sendTextMessage(to, null, message, sentIntent, null)
            } else {
                val sentIntents = ArrayList<PendingIntent>(parts.size).apply {
                    repeat(parts.size) { add(sentIntent) }
                }
                smsManager.sendMultipartTextMessage(to, null, parts, sentIntents, null)
            }

            Log.d(TAG, "SMS initiated to $to (${parts.size} parts)")
        } catch (e: Exception) {
            Log.e(TAG, "SMS initiation failed: ${e.message}")
            onResult(false)
        }
    }
}
