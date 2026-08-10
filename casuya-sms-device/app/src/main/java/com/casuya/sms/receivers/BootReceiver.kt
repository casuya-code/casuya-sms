package com.casuya.sms.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.services.SMSBackgroundService

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            PrefsManager.init(context)
            if (PrefsManager.isLoggedIn()) {
                val service = Intent(context, SMSBackgroundService::class.java)
                context.startForegroundService(service)
            }
        }
    }
}