package com.casuya.sms.ui.register

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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.casuya.sms.network.ApiClient
import com.casuya.sms.network.RegisterRequest
import kotlinx.coroutines.launch

import androidx.compose.ui.tooling.preview.Preview
import com.casuya.sms.ui.theme.CasuyaSMSTheme

@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onBackToLogin: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    suspend fun handleRegister() {
        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            error = "All fields are required"
            return
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
            error = "Invalid email address"
            return
        }
        if (password.length < 6) {
            error = "Password must be at least 6 characters"
            return
        }
        if (password != confirmPassword) {
            error = "Passwords do not match"
            return
        }

        loading = true
        error = null
        try {
            val response = ApiClient.apiService.register(
                RegisterRequest(name.trim(), email.trim(), password)
            )
            if (response.isSuccessful) {
                Toast.makeText(context, "Account created successfully", Toast.LENGTH_LONG).show()
                onRegisterSuccess()
            } else {
                error = when (response.code()) {
                    409 -> "Email already registered"
                    else -> "Registration failed: ${response.code()}"
                }
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
            text = "Create Account",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Join Casuya SMS Gateway",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.outline
        )
        
        Spacer(Modifier.height(32.dp))

        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Full Name") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(Modifier.height(16.dp))

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

        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            label = { Text("Confirm Password") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation()
        )

        Spacer(Modifier.height(32.dp))

        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
        }

        Button(
            onClick = { scope.launch { handleRegister() } },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = !loading
        ) {
            Text(if (loading) "Creating Account..." else "Register")
        }

        TextButton(onClick = onBackToLogin) {
            Text("Already have an account? Login")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun RegisterScreenPreview() {
    CasuyaSMSTheme {
        RegisterScreen({}, {})
    }
}
