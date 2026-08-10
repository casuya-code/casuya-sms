package com.casuya.sms.ui.login

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.data.models.DeviceRegisterRequest
import com.casuya.sms.data.models.LoginRequest
import com.casuya.sms.network.ApiClient
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(onLoggedIn: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    suspend fun submit() {
        loading = true
        try {
            val login = ApiClient.apiService.login(LoginRequest(email, password))
            if (!login.isSuccessful) {
                error = "login failed: ${login.code()}"
                return
            }
            PrefsManager.saveToken(login.body()!!.token)
            PrefsManager.saveEmail(email)

            if (PrefsManager.getDeviceId() == null) {
                val register =
                    ApiClient.apiService.registerDevice(DeviceRegisterRequest("android"))
                if (register.isSuccessful) {
                    PrefsManager.saveDeviceId(register.body()!!.deviceId)
                } else {
                    error = "device register failed: ${register.code()}"
                    return
                }
            }
            onLoggedIn()
        } catch (e: Exception) {
            error = e.message
        } finally {
            loading = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(120.dp))
        OutlinedTextField(email, { email = it }, label = { Text("Email") })
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            password, { password = it }, label = { Text("Password") },
            singleLine = true
        )
        Spacer(Modifier.height(24.dp))
        Button(onClick = { scope.launch { submit() } }) {
            Text(if (loading) "Logging in..." else "Login & Register Device")
        }
        error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it)
        }
    }
}