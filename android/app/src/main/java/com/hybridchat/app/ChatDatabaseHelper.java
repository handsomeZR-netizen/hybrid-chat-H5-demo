package com.hybridchat.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * ChatDatabaseHelper - SQLite database helper for chat message storage
 * 
 * Provides local caching of chat messages to replace localStorage.
 * Offers better performance, larger storage capacity, and structured queries.
 * 
 * Features:
 * - Store and retrieve chat messages
 * - Query messages by user, time range, or type
 * - Pagination support for history loading
 * - Automatic cleanup of old messages
 */
public class ChatDatabaseHelper extends SQLiteOpenHelper {
    
    private static final String DATABASE_NAME = "hybrid_chat.db";
    private static final int DATABASE_VERSION = 1;
    
    // Table names
    private static final String TABLE_MESSAGES = "messages";
    private static final String TABLE_USERS = "users";
    
    // Messages table columns
    private static final String COL_ID = "id";
    private static final String COL_TYPE = "type";
    private static final String COL_SENDER_ID = "sender_id";
    private static final String COL_CONTENT = "content";
    private static final String COL_TIMESTAMP = "timestamp";
    private static final String COL_STATUS = "status";
    private static final String COL_AVATAR_COLOR = "avatar_color";
    
    // Users table columns
    private static final String COL_USER_ID = "user_id";
    private static final String COL_USER_NAME = "user_name";
    private static final String COL_LAST_SEEN = "last_seen";
    
    public ChatDatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }
    
    @Override
    public void onCreate(SQLiteDatabase db) {
        // Create messages table
        String createMessagesTable = "CREATE TABLE " + TABLE_MESSAGES + " (" +
                COL_ID + " TEXT PRIMARY KEY," +
                COL_TYPE + " TEXT NOT NULL," +
                COL_SENDER_ID + " TEXT NOT NULL," +
                COL_CONTENT + " TEXT NOT NULL," +
                COL_TIMESTAMP + " INTEGER NOT NULL," +
                COL_STATUS + " TEXT," +
                COL_AVATAR_COLOR + " TEXT," +
                "FOREIGN KEY(" + COL_SENDER_ID + ") REFERENCES " + TABLE_USERS + "(" + COL_USER_ID + ")" +
                ")";
        db.execSQL(createMessagesTable);
        
        // Create index on timestamp for faster queries
        db.execSQL("CREATE INDEX idx_timestamp ON " + TABLE_MESSAGES + "(" + COL_TIMESTAMP + " DESC)");
        
        // Create index on sender_id for faster user queries
        db.execSQL("CREATE INDEX idx_sender ON " + TABLE_MESSAGES + "(" + COL_SENDER_ID + ")");
        
        // Create users table
        String createUsersTable = "CREATE TABLE " + TABLE_USERS + " (" +
                COL_USER_ID + " TEXT PRIMARY KEY," +
                COL_USER_NAME + " TEXT," +
                COL_LAST_SEEN + " INTEGER" +
                ")";
        db.execSQL(createUsersTable);
    }
    
    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Drop older tables if existed
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_MESSAGES);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USERS);
        
        // Create tables again
        onCreate(db);
    }
    
    /**
     * Save a message to the database
     * 
     * @param messageJson JSON string of the message
     * @return true if successful, false otherwise
     */
    public boolean saveMessage(String messageJson) {
        try {
            JSONObject message = new JSONObject(messageJson);
            
            SQLiteDatabase db = this.getWritableDatabase();
            ContentValues values = new ContentValues();
            
            values.put(COL_ID, message.getString("id"));
            values.put(COL_TYPE, message.getString("type"));
            values.put(COL_SENDER_ID, message.getString("senderId"));
            values.put(COL_CONTENT, message.getString("content"));
            values.put(COL_TIMESTAMP, message.getLong("timestamp"));
            
            if (message.has("status")) {
                values.put(COL_STATUS, message.getString("status"));
            }
            
            if (message.has("avatarColor")) {
                values.put(COL_AVATAR_COLOR, message.getString("avatarColor"));
            }
            
            long result = db.insertWithOnConflict(TABLE_MESSAGES, null, values, SQLiteDatabase.CONFLICT_REPLACE);
            db.close();
            
            return result != -1;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Get all messages ordered by timestamp
     * 
     * @param limit Maximum number of messages to return (0 for all)
     * @return JSON array string of messages
     */
    public String getAllMessages(int limit) {
        try {
            SQLiteDatabase db = this.getReadableDatabase();
            
            String query = "SELECT * FROM " + TABLE_MESSAGES + 
                          " ORDER BY " + COL_TIMESTAMP + " ASC";
            
            if (limit > 0) {
                query += " LIMIT " + limit;
            }
            
            Cursor cursor = db.rawQuery(query, null);
            JSONArray messages = cursorToJsonArray(cursor);
            cursor.close();
            db.close();
            
            return messages.toString();
            
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
    
    /**
     * Get messages before a specific timestamp (for pagination)
     * 
     * @param beforeTimestamp Get messages before this timestamp
     * @param limit Maximum number of messages to return
     * @return JSON array string of messages
     */
    public String getMessagesBefore(long beforeTimestamp, int limit) {
        try {
            SQLiteDatabase db = this.getReadableDatabase();
            
            String query = "SELECT * FROM " + TABLE_MESSAGES + 
                          " WHERE " + COL_TIMESTAMP + " < ?" +
                          " ORDER BY " + COL_TIMESTAMP + " DESC" +
                          " LIMIT ?";
            
            Cursor cursor = db.rawQuery(query, new String[]{
                String.valueOf(beforeTimestamp),
                String.valueOf(limit)
            });
            
            JSONArray messages = cursorToJsonArray(cursor);
            cursor.close();
            db.close();
            
            // Reverse the array to get chronological order
            JSONArray reversed = new JSONArray();
            for (int i = messages.length() - 1; i >= 0; i--) {
                reversed.put(messages.get(i));
            }
            
            return reversed.toString();
            
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
    
    /**
     * Get messages by sender
     * 
     * @param senderId The sender's user ID
     * @param limit Maximum number of messages to return
     * @return JSON array string of messages
     */
    public String getMessagesBySender(String senderId, int limit) {
        try {
            SQLiteDatabase db = this.getReadableDatabase();
            
            String query = "SELECT * FROM " + TABLE_MESSAGES + 
                          " WHERE " + COL_SENDER_ID + " = ?" +
                          " ORDER BY " + COL_TIMESTAMP + " ASC" +
                          " LIMIT ?";
            
            Cursor cursor = db.rawQuery(query, new String[]{senderId, String.valueOf(limit)});
            JSONArray messages = cursorToJsonArray(cursor);
            cursor.close();
            db.close();
            
            return messages.toString();
            
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
    
    /**
     * Delete messages older than specified days
     * 
     * @param days Number of days to keep
     * @return Number of messages deleted
     */
    public int deleteOldMessages(int days) {
        try {
            SQLiteDatabase db = this.getWritableDatabase();
            
            long cutoffTime = System.currentTimeMillis() - (days * 24L * 60 * 60 * 1000);
            
            int deleted = db.delete(TABLE_MESSAGES, 
                                   COL_TIMESTAMP + " < ?", 
                                   new String[]{String.valueOf(cutoffTime)});
            
            db.close();
            return deleted;
            
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }
    
    /**
     * Clear all messages
     * 
     * @return true if successful
     */
    public boolean clearAllMessages() {
        try {
            SQLiteDatabase db = this.getWritableDatabase();
            db.delete(TABLE_MESSAGES, null, null);
            db.close();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Get message count
     * 
     * @return Total number of messages
     */
    public int getMessageCount() {
        try {
            SQLiteDatabase db = this.getReadableDatabase();
            Cursor cursor = db.rawQuery("SELECT COUNT(*) FROM " + TABLE_MESSAGES, null);
            
            int count = 0;
            if (cursor.moveToFirst()) {
                count = cursor.getInt(0);
            }
            
            cursor.close();
            db.close();
            return count;
            
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }
    
    /**
     * Save or update user information
     * 
     * @param userId User ID
     * @param userName User name (optional)
     * @return true if successful
     */
    public boolean saveUser(String userId, String userName) {
        try {
            SQLiteDatabase db = this.getWritableDatabase();
            ContentValues values = new ContentValues();
            
            values.put(COL_USER_ID, userId);
            if (userName != null) {
                values.put(COL_USER_NAME, userName);
            }
            values.put(COL_LAST_SEEN, System.currentTimeMillis());
            
            long result = db.insertWithOnConflict(TABLE_USERS, null, values, SQLiteDatabase.CONFLICT_REPLACE);
            db.close();
            
            return result != -1;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Convert cursor to JSON array
     * 
     * @param cursor Database cursor
     * @return JSON array of messages
     */
    private JSONArray cursorToJsonArray(Cursor cursor) throws Exception {
        JSONArray array = new JSONArray();
        
        if (cursor.moveToFirst()) {
            do {
                JSONObject message = new JSONObject();
                message.put("id", cursor.getString(cursor.getColumnIndexOrThrow(COL_ID)));
                message.put("type", cursor.getString(cursor.getColumnIndexOrThrow(COL_TYPE)));
                message.put("senderId", cursor.getString(cursor.getColumnIndexOrThrow(COL_SENDER_ID)));
                message.put("content", cursor.getString(cursor.getColumnIndexOrThrow(COL_CONTENT)));
                message.put("timestamp", cursor.getLong(cursor.getColumnIndexOrThrow(COL_TIMESTAMP)));
                
                int statusIndex = cursor.getColumnIndex(COL_STATUS);
                if (statusIndex != -1 && !cursor.isNull(statusIndex)) {
                    message.put("status", cursor.getString(statusIndex));
                }
                
                int colorIndex = cursor.getColumnIndex(COL_AVATAR_COLOR);
                if (colorIndex != -1 && !cursor.isNull(colorIndex)) {
                    message.put("avatarColor", cursor.getString(colorIndex));
                }
                
                array.put(message);
            } while (cursor.moveToNext());
        }
        
        return array;
    }
}
