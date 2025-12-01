-- ============================================
-- Hybrid Chat App - Supabase Database Schema
-- ============================================
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'SYSTEM')),
  sender_id TEXT,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- 3. 启用 Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. 创建访问策略（开发环境 - 允许所有操作）
-- 注意：生产环境应配置更严格的策略
DROP POLICY IF EXISTS "Allow all operations" ON messages;
CREATE POLICY "Allow all operations" ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 可选：媒体存储桶策略
-- ============================================
-- 如果你创建了 chat-media 存储桶，运行以下策略：

-- 允许上传文件
-- CREATE POLICY "Allow uploads" ON storage.objects
--   FOR INSERT
--   WITH CHECK (bucket_id = 'chat-media');

-- 允许公开读取
-- CREATE POLICY "Allow public read" ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'chat-media');

-- ============================================
-- 验证：查看表结构
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages';
