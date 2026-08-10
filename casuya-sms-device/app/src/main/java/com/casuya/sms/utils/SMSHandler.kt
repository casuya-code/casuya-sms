package com.casuya.sms.utils

import android.content.Context
import android.telephony.SmsManager

class SMSHandler(private val context: Context) {

    fun send(to: String, message: String): Boolean {
        return try {
            val smsManager = SmsManager.getDefault()
            val parts = smsManager.divideMessage(message)

            if (parts.size == 1) {
                smsManager.sendTextMessage(to, null, message, null, null)
            } else {
                smsManager.sendMultipartTextMessage(to, null, parts, null, null)
            }
            true
        } catch (e: Exception) {
            false
        }
    }
}