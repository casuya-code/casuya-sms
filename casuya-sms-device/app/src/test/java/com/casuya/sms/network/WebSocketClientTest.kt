package com.casuya.sms.network

import android.util.Log
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.verify
import org.junit.Before
import org.junit.Test

class WebSocketClientTest {

    private lateinit var onSmsOrder: (String, String, String) -> Unit
    private lateinit var onStateChange: (Boolean) -> Unit
    private lateinit var client: WebSocketClient

    @Before
    fun setup() {
        onSmsOrder = mockk(relaxed = true)
        onStateChange = mockk(relaxed = true)
        mockkStatic(Log::class)
        
        client = WebSocketClient(onSmsOrder, onStateChange)
    }

    @Test
    fun `handleMessage should trigger onSmsOrder when type is sms-send`() {
        val json = """
            {
                "type": "sms:send",
                "sms_log_id": "log123",
                "to": "+123456789",
                "message": "Hello World"
            }
        """.trimIndent()

        client.handleMessage(json)

        verify { onSmsOrder("log123", "+123456789", "Hello World") }
    }

    @Test
    fun `handleMessage should not trigger onSmsOrder when type is unknown`() {
        val json = """
            {
                "type": "unknown",
                "data": "some data"
            }
        """.trimIndent()

        client.handleMessage(json)

        verify(exactly = 0) { onSmsOrder(any(), any(), any()) }
    }
}
