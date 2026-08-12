package com.casuya.sms.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sms_messages")
data class SmsMessage(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val address: String,
    val body: String,
    val date: Long,
    val type: Int, // 1 for inbox, 2 for sent
    val isSynced: Boolean = false,
    val originalSystemId: Long? = null // To map with Android system SMS ID
)
