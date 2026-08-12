package com.casuya.sms.utils

import androidx.compose.runtime.mutableStateListOf
import java.text.SimpleDateFormat
import java.util.*

object DiagnosticsManager {
    data class LogEntry(val time: String, val level: String, val message: String)
    
    private val sdf get() = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    val logs = mutableStateListOf<LogEntry>()

    fun log(message: String, level: String = "INFO") {
        val entry = LogEntry(sdf.format(Date()), level, message)
        logs.add(0, entry)
        if (logs.size > 100) logs.removeAt(logs.size - 1)
        android.util.Log.d("CASUYA_DIAG", "[$level] $message")
    }
}
