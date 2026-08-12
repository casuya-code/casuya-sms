package com.casuya.sms.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.casuya.sms.App
import com.casuya.sms.data.db.SmsMessage
import com.casuya.sms.services.SMSBackgroundService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SMSReceiver : BroadcastReceiver() {
    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            val database = (context.applicationContext as App).database
            
            for (sms in messages) {
                val from = sms.originatingAddress ?: "Unknown"
                val body = sms.messageBody ?: ""
                val timestamp = sms.timestampMillis
                
                scope.launch {
                    database.smsDao().insert(SmsMessage(
                        address = from,
                        body = body,
                        date = timestamp,
                        type = 1 // Inbox
                    ))
                }
                
                SMSBackgroundService.handleIncomingSms(from, body, timestamp)
            }
        }
    }
}
