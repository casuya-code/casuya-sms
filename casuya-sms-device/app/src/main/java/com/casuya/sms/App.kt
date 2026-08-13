package com.casuya.sms

import android.app.Application
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.data.db.AppDatabase

class App : Application() {
    val database: AppDatabase by lazy { AppDatabase.getDatabase(this) }
    
    override fun onCreate() {
        super.onCreate()
        PrefsManager.init(this)
        PrefsManager.ensureDeviceIdentity()
    }
}