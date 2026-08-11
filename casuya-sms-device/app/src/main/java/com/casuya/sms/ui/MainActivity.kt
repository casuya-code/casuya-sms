package com.casuya.sms.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.services.SMSBackgroundService
import com.casuya.sms.ui.dashboard.DashboardScreen
import com.casuya.sms.ui.forgotpassword.ForgotPasswordScreen
import com.casuya.sms.ui.login.LoginScreen
import com.casuya.sms.ui.register.RegisterScreen
import com.casuya.sms.ui.theme.CasuyaSMSTheme

class MainActivity : ComponentActivity() {

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { perms ->
            val allGranted = perms.all { it.value }
            if (allGranted) startService()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        if (PrefsManager.isLoggedIn() && arePermissionsGranted()) startService()

        setContent {
            CasuyaSMSTheme {
                val navController = rememberNavController()
                val startDestination = if (PrefsManager.isLoggedIn()) "dashboard" else "login"

                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .safeDrawingPadding(),
                ) {
                    NavHost(
                        navController = navController, 
                        startDestination = startDestination
                    ) {
                        composable("login") {
                            LoginScreen(
                                onLoggedIn = {
                                    requestPermissionsOrStart()
                                    navController.navigate("dashboard") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                },
                                onRegisterClick = { navController.navigate("register") },
                                onForgotPasswordClick = { 
                                    navController.navigate("forgot_password") 
                                }
                            )
                        }
                        composable("register") {
                            RegisterScreen(
                                onRegisterSuccess = { navController.navigate("login") },
                                onBackToLogin = { navController.navigateUp() }
                            )
                        }
                        composable("forgot_password") {
                            ForgotPasswordScreen(
                                onResetRequested = { navController.navigateUp() },
                                onBackToLogin = { navController.navigateUp() }
                            )
                        }
                        composable("dashboard") {
                            DashboardScreen(
                                onLogout = {
                                    logout()
                                    navController.navigate("login") {
                                        popUpTo("dashboard") { inclusive = true }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun arePermissionsGranted(): Boolean {
        val sms = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
        val receiveSms = ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS)
        val notif = if (Build.VERSION.SDK_INT >= 33) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
        } else {
            PackageManager.PERMISSION_GRANTED
        }
        return (sms == PackageManager.PERMISSION_GRANTED &&
                receiveSms == PackageManager.PERMISSION_GRANTED &&
                (notif == PackageManager.PERMISSION_GRANTED))
    }

    private fun requestPermissionsOrStart() {
        if (arePermissionsGranted()) {
            startService()
        } else {
            val perms = mutableListOf(Manifest.permission.SEND_SMS, Manifest.permission.RECEIVE_SMS)
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
        PrefsManager.clearSession()
    }
}
