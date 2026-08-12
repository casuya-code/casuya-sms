package com.casuya.sms.network

import com.casuya.sms.data.models.DeviceRegisterRequest
import com.casuya.sms.data.models.LoginRequest
import com.casuya.sms.data.models.LoginResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<LoginResponse>

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<Unit>

    @POST("api/auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): Response<Unit>

    @POST("api/devices/register")
    suspend fun registerDevice(@Body body: DeviceRegisterRequest): Response<RegisterDeviceResponse>

    @POST("api/messages/received")
    suspend fun reportReceivedSms(@Body body: ReceivedSmsRequest): Response<Unit>

    @POST("api/messages/received")
    suspend fun reportBatchSms(@Body body: ReceivedBatchRequest): Response<Unit>

    @POST("api/devices/heartbeat")
    suspend fun sendHeartbeat(@Body body: HeartbeatRequest): Response<Unit>
}

data class HeartbeatRequest(
    val deviceId: String,
    val batteryLevel: Int,
    val isCharging: Boolean,
    val signalStrength: String? = null
)

data class ReceivedSmsRequest(
    val from: String,
    val message: String,
    val timestamp: Long,
    val deviceId: String,
    val type: Int? = null
)

data class ReceivedBatchRequest(
    val deviceId: String,
    val items: List<ReceivedSmsRequest>
)

data class RegisterRequest(val name: String, val email: String, val password: String)
data class ForgotPasswordRequest(val email: String)
data class RegisterDeviceResponse(val deviceId: String)