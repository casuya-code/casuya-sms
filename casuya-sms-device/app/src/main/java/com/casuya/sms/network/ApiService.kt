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

    @POST("api/devices/register")
    suspend fun registerDevice(@Body body: DeviceRegisterRequest): Response<RegisterDeviceResponse>
}

data class RegisterDeviceResponse(val deviceId: String)