package com.casuya.sms.ui.dashboard

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.casuya.sms.data.local.PrefsManager

@Composable
fun DashboardScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(80.dp))
        Text("casuya-sms gateway")
        Spacer(Modifier.height(8.dp))
        Text("device: ${PrefsManager.getDeviceId() ?: "none"}")
        Spacer(Modifier.height(8.dp))
        Text("user: ${PrefsManager.getEmail() ?: "unknown"}")
        Spacer(Modifier.height(32.dp))
        Button(onClick = onLogout) {
            Text("Logout")
        }
    }
}