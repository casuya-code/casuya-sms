package com.casuya.sms.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.services.SMSBackgroundService
import com.casuya.sms.ui.dashboard.DashboardScreen
import com.casuya.sms.ui.login.LoginScreen

class MainActivity : ComponentActivity() {

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            if (arePermissionsGranted()) startService()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (PrefsManager.isLoggedIn() && arePermissionsGranted()) startService()

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    if (PrefsManager.isLoggedIn()) {
                        DashboardScreen(onLogout = { logout() })
                    } else {
                        LoginScreen(onLoggedIn = { requestPermissionsOrStart() })
                    }
                }
            }
        }
    }

    private fun arePermissionsGranted(): Boolean {
        val sms = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
        val notif = if (Build.VERSION.SDK_INT >= 33) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
        } else PackageManager.PERMISSION_GRANTED
        return sms == PackageManager.PERMISSION_GRANTED && notif == PackageManager.PERMISSION_GRANTED
    }

    private fun requestPermissionsOrStart() {
        if (arePermissionsGranted()) {
            startService()
        } else {
            val perms = mutableListOf(Manifest.permission.SEND_SMS)
            if (Build.VERSION.SDK_INT >= 33) perms.add(Manifest.permission.POST_NOTIFICATIONS)
            permissionLauncher.launch(perms.toTypedArray())
        }
    }

    private fun startService() {
        val intent = Intent(this, SMSBackgroundService::class.java)
        ContextCompat.startForegroundService(this, intent)
    }

    private fun logout() {
        stopService(Intent(this, SMSBackgroundService::class.java))
        PrefsManager.clear()
    }
}