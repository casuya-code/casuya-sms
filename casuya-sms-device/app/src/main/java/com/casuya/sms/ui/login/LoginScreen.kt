package com.casuya.sms.ui.login

import android.util.Patterns
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.casuya.sms.data.local.PrefsManager
import com.casuya.sms.data.models.LoginRequest
import com.casuya.sms.network.ApiClient
import com.casuya.sms.network.ProvisionDeviceRequest
import kotlinx.coroutines.launch

import androidx.compose.ui.tooling.preview.Preview
import com.casuya.sms.ui.theme.CasuyaSMSTheme

@Composable
fun LoginScreen(
    onLoggedIn: () -> Unit,
    onRegisterClick: () -> Unit,
    onForgotPasswordClick: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(value = false) }
    val scope = rememberCoroutineScope()

    suspend fun submit() {
        val trimmedEmail = email.trim()
        if (trimmedEmail.isEmpty() || password.isEmpty()) {
            error = "Email and password are required"
            return
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(trimmedEmail).matches()) {
            error = "Invalid email address"
            return
        }
        if (password.length < 6) {
            error = "Password must be at least 6 characters"
            return
        }

        loading = true
        error = null
        try {
            val login = ApiClient.apiService.login(LoginRequest(trimmedEmail, password))
            if (!login.isSuccessful) {
                error = when (login.code()) {
                    401 -> "Invalid email or password"
                    403 -> "Account is banned"
                    else -> "Login failed: ${login.code()}"
                }
                return
            }
            val loginBody = login.body()
            if (loginBody == null) {
                error = "Empty response from server"
                return
            }
            PrefsManager.saveToken(loginBody.token)
            PrefsManager.saveEmail(trimmedEmail)

            if (PrefsManager.getDeviceId() == null || PrefsManager.getPairingKey() == null) {
                val provision = ApiClient.apiService.provisionDevice(ProvisionDeviceRequest())
                val provisionBody = provision.body()
                if (provision.isSuccessful && provisionBody != null) {
                    PrefsManager.saveDeviceId(provisionBody.deviceId)
                    PrefsManager.savePairingKey(provisionBody.apiKey)
                } else {
                    error = "Device provisioning failed: ${provision.code()}"
                    return
                }
            }
            onLoggedIn()
        } catch (e: Exception) {
            error = e.message ?: "Network error"
        } finally {
            loading = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Welcome Back",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Sign in to your SMS Gateway",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.outline
        )

        Spacer(Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email Address") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation()
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(onClick = onForgotPasswordClick) {
                Text("Forgot Password?")
            }
        }

        Spacer(Modifier.height(16.dp))

        Button(
            onClick = { scope.launch { submit() } },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = !loading
        ) {
            Text(if (loading) "Signing in..." else "Sign In")
        }

        Spacer(Modifier.height(8.dp))

        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
        }

        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Don't have an account?", style = MaterialTheme.typography.bodySmall)
            TextButton(onClick = onRegisterClick) {
                Text("Register Now")
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    CasuyaSMSTheme {
        LoginScreen({}, {}, {})
    }
}
