package com.casuya.sms.data.models

data class LoginResponse(
    val token: String,
    val user: User
)

data class User(
    val id: Int,
    val email: String,
    val role: String
)