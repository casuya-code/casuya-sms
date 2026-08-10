package com.casuya.sms

import android.app.Application
import com.casuya.sms.data.local.PrefsManager

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        PrefsManager.init(this)
    }
}