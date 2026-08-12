package com.casuya.sms.utils

import android.content.Context
import androidx.core.net.toUri
import com.casuya.sms.App
import com.casuya.sms.data.db.SmsMessage
import com.casuya.sms.network.ApiClient
import com.casuya.sms.network.ReceivedBatchRequest
import com.casuya.sms.network.ReceivedSmsRequest
import com.casuya.sms.data.local.PrefsManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object SmsSyncManager {
    suspend fun fullSync(context: Context) {
        val database = (context.applicationContext as App).database
        val deviceId = PrefsManager.getDeviceId() ?: return

        withContext(Dispatchers.IO) {
            DiagnosticsManager.log("Sync: Scanning system SMS database...")
            
            // 1. Scan System SMS and store in local DB
            val systemSms = fetchAllSystemSms(context)
            database.smsDao().insertAll(systemSms)

            // 2. Upload Unsynced to Backend
            val unsynced = database.smsDao().getUnsyncedMessages()
            DiagnosticsManager.log("Sync: Found ${unsynced.size} unsynced messages")
            
            unsynced.chunked(50).forEach { chunk ->
                try {
                    val response = ApiClient.apiService.reportBatchSms(
                        ReceivedBatchRequest(
                            deviceId,
                            chunk.map {
                                ReceivedSmsRequest(it.address, it.body, it.date, deviceId, it.type)
                            }
                        )
                    )
                    if (response.isSuccessful) {
                        database.smsDao().markAsSynced(chunk.map { it.id })
                    } else {
                        DiagnosticsManager.log("Sync: Batch upload failed (${response.code()})", "ERROR")
                    }
                } catch (e: Exception) {
                    DiagnosticsManager.log("Sync: Batch upload error: ${e.message}", "ERROR")
                }
            }
            DiagnosticsManager.log("Sync: Database sync complete")
        }
    }

    private fun fetchAllSystemSms(context: Context): List<SmsMessage> {
        val messages = mutableListOf<SmsMessage>()
        try {
            val uri = "content://sms/".toUri()
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                val addressIdx = it.getColumnIndex("address")
                val bodyIdx = it.getColumnIndex("body")
                val dateIdx = it.getColumnIndex("date")
                val typeIdx = it.getColumnIndex("type")
                val idIdx = it.getColumnIndex("_id")

                while (it.moveToNext()) {
                    messages.add(SmsMessage(
                        address = it.getString(addressIdx) ?: "Unknown",
                        body = it.getString(bodyIdx) ?: "",
                        date = it.getLong(dateIdx),
                        type = it.getInt(typeIdx),
                        originalSystemId = it.getLong(idIdx)
                    ))
                }
            }
        } catch (e: Exception) {
            DiagnosticsManager.log("Sync: System scan error: ${e.message}", "ERROR")
        }
        return messages
    }
}
