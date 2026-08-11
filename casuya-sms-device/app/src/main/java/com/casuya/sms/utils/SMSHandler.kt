package com.casuya.sms.utils

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import android.util.Log

class SMSHandler(private val context: Context) {

    companion object {
        private const val TAG = "SMSHandler"
        private const val ACTION_SMS_SENT = "com.casuya.sms.SMS_SENT"
    }

    private fun getSmsManager(): SmsManager {
        return if (Build.VERSION.SDK_INT >= 31) {
            context.getSystemService(SmsManager::class.java)
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
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
