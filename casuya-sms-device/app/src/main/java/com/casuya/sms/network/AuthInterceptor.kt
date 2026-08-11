package com.casuya.sms.network

import android.util.Log
import com.casuya.sms.data.local.PrefsManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val token = PrefsManager.getToken()
        val newRequest = if (token != null) {
            request.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            request
        }
        val response = chain.proceed(newRequest)
        if (response.code == 401) {
            Log.w("AuthInterceptor", "401 received — clearing session")
            PrefsManager.clearSession()
        }
        return response
    }
}
