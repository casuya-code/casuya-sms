package com.casuya.sms.ui.forgotpassword

import android.util.Patterns
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.casuya.sms.network.ApiClient
import com.casuya.sms.network.ForgotPasswordRequest
import kotlinx.coroutines.launch

@Composable
fun ForgotPasswordScreen(
    onResetRequested: () -> Unit,
    onBackToLogin: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    suspend fun handleReset() {
        if (email.trim().isEmpty()) {
            error = "Email is required"
            return
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
            error = "Invalid email address"
            return
        }

        loading = true
        error = null
        try {
            val response = ApiClient.apiService.forgotPassword(ForgotPasswordRequest(email.trim()))
            if (response.isSuccessful) {
                Toast.makeText(context, "Reset link sent to your email", Toast.LENGTH_LONG).show()
                onResetRequested()
            } else {
                error = "Error: ${response.code()}"
            }
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
            text = "Reset Password",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Enter your email to receive a reset link",
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

        Spacer(Modifier.height(32.dp))

        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
        }

        Button(
            onClick = { scope.launch { handleReset() } },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = !loading
        ) {
            Text(if (loading) "Sending..." else "Send Reset Link")
        }

        TextButton(onClick = onBackToLogin) {
            Text("Back to Login")
        }
    }
}
