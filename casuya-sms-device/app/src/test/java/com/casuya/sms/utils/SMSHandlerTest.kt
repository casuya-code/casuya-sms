package com.casuya.sms.utils

import android.app.PendingIntent
import android.content.Context
import android.telephony.SmsManager
import android.util.Log
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.verify
import org.junit.Before
import org.junit.Test

class SMSHandlerTest {

    private lateinit var context: Context
    private lateinit var smsManager: SmsManager
    private lateinit var smsHandler: SMSHandler

    @Before
    fun setup() {
        context = mockk(relaxed = true)
        smsManager = mockk(relaxed = true)
        mockkStatic(Log::class)
        mockkStatic(PendingIntent::class)
        mockkStatic(SmsManager::class)

        every { context.getSystemService(SmsManager::class.java) } returns smsManager
        every { SmsManager.getDefault() } returns smsManager
        
        smsHandler = SMSHandler(context)
    }

    @Test
    fun `send should call sendTextMessage when message is short`() {
        val to = "123456789"
        val message = "Short message"
        val smsLogId = "log123"

        every { smsManager.divideMessage(any()) } returns arrayListOf(message)
        every { PendingIntent.getBroadcast(any(), any(), any(), any()) } returns mockk()

        smsHandler.send(to, message, smsLogId) { }

        verify { smsManager.sendTextMessage(eq(to), any(), eq(message), any(), any()) }
    }

    @Test
    fun `send should call sendMultipartTextMessage when message is long`() {
        val to = "123456789"
        val message = "This is a very long message"
        val smsLogId = "log456"
        val parts = arrayListOf("Part 1", "Part 2")

        every { smsManager.divideMessage(any()) } returns parts
        every { PendingIntent.getBroadcast(any(), any(), any(), any()) } returns mockk()

        smsHandler.send(to, message, smsLogId) { }

        verify { smsManager.sendMultipartTextMessage(eq(to), any(), eq(parts), any(), any()) }
    }
}
