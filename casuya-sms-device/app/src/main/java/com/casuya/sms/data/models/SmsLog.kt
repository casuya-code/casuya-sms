package com.casuya.sms.data.models

data class SmsLog(
    val address: String,
    val body: String,
    val date: Long,
    val type: Int // 1 for inbox, 2 for sent
)
