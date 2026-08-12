package com.casuya.sms.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SmsDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: SmsMessage)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(messages: List<SmsMessage>)

    @Query("SELECT * FROM sms_messages ORDER BY date DESC")
    fun getAllMessages(): Flow<List<SmsMessage>>

    @Query("SELECT * FROM sms_messages WHERE isSynced = 0")
    suspend fun getUnsyncedMessages(): List<SmsMessage>

    @Query("UPDATE sms_messages SET isSynced = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)

    @Query("SELECT COUNT(*) FROM sms_messages WHERE type = 1")
    fun getReceivedCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM sms_messages WHERE type = 2")
    fun getSentCount(): Flow<Int>

    @Query("SELECT MAX(date) FROM sms_messages")
    fun getLastSmsTime(): Flow<Long?>
    
    @Query("DELETE FROM sms_messages WHERE id = :id")
    suspend fun deleteById(id: Long)
}
