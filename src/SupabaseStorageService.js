import { createClient } from '@supabase/supabase-js';

/**
 * SupabaseStorageService - 使用 Supabase 进行消息持久化
 */
export class SupabaseStorageService {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initialized = false;
  }

  /**
   * 初始化存储服务
   */
  async initialize() {
    try {
      // 测试连接
      const { error } = await this.supabase.from('messages').select('id').limit(1);
      
      if (error && error.code === '42P01') {
        console.error('Messages table does not exist. Please run the SQL setup script.');
        throw new Error('Database table not found');
      }
      
      if (error) {
        console.error('Supabase connection error:', error);
        throw error;
      }
      
      this.initialized = true;
      console.log('Supabase storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase storage:', error);
      throw error;
    }
  }

  /**
   * 保存消息
   * @param {Object} message - 消息对象
   */
  async saveMessage(message) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { error } = await this.supabase.from('messages').insert({
        id: message.id,
        type: message.type,
        sender_id: message.senderId || null,
        content: message.content,
        timestamp: message.timestamp,
        created_at: new Date(message.timestamp).toISOString()
      });

      if (error) {
        console.error('Failed to save message to Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }


  /**
   * 获取指定消息 ID 之前的消息（用于历史加载）
   * @param {string} messageId - 消息 ID
   * @param {number} limit - 返回的消息数量限制
   * @returns {Promise<Array>} 消息数组
   */
  async getMessagesBefore(messageId, limit = 20) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let query;
      
      if (messageId) {
        // 先获取指定消息的时间戳
        const { data: targetMsg, error: targetError } = await this.supabase
          .from('messages')
          .select('timestamp')
          .eq('id', messageId)
          .single();

        if (targetError || !targetMsg) {
          // 如果找不到消息，返回最新的消息
          const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

          if (error) throw error;
          return this.formatMessages(data?.reverse() || []);
        }

        // 获取该时间戳之前的消息
        query = this.supabase
          .from('messages')
          .select('*')
          .lt('timestamp', targetMsg.timestamp)
          .order('timestamp', { ascending: false })
          .limit(limit);
      } else {
        // 没有指定消息ID，返回最新的消息
        query = this.supabase
          .from('messages')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get messages:', error);
        throw error;
      }

      // 反转顺序，使消息按时间正序排列
      return this.formatMessages(data?.reverse() || []);
    } catch (error) {
      console.error('Failed to get messages before:', error);
      return [];
    }
  }

  /**
   * 获取所有消息
   * @returns {Promise<Array>} 所有消息数组
   */
  async getAllMessages() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to get all messages:', error);
        throw error;
      }

      return this.formatMessages(data || []);
    } catch (error) {
      console.error('Failed to get all messages:', error);
      return [];
    }
  }

  /**
   * 删除消息
   * @param {string} messageId - 消息 ID
   */
  async deleteMessage(messageId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Failed to delete message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * 清空所有消息（用于测试）
   */
  async clear() {
    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .neq('id', ''); // 删除所有记录

      if (error) {
        console.error('Failed to clear messages:', error);
      }
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }

  /**
   * 格式化数据库记录为消息对象
   * @param {Array} records - 数据库记录
   * @returns {Array} 格式化后的消息数组
   */
  formatMessages(records) {
    return records.map(record => ({
      id: record.id,
      type: record.type,
      senderId: record.sender_id,
      content: record.content,
      timestamp: record.timestamp
    }));
  }

  /**
   * 上传媒体文件到 Supabase Storage
   * @param {string} base64Data - Base64 编码的文件数据
   * @param {string} fileName - 文件名
   * @param {string} bucket - 存储桶名称
   * @returns {Promise<string>} 文件的公开 URL
   */
  async uploadMedia(base64Data, fileName, bucket = 'chat-media') {
    try {
      // 从 Base64 提取实际数据
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 data format');
      }

      const contentType = matches[1];
      const base64Content = matches[2];
      const buffer = Buffer.from(base64Content, 'base64');

      // 生成唯一文件名
      const uniqueFileName = `${Date.now()}-${fileName}`;

      // 上传到 Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(uniqueFileName, buffer, {
          contentType,
          upsert: false
        });

      if (uploadError) {
        console.error('Failed to upload media:', uploadError);
        throw uploadError;
      }

      // 获取公开 URL
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw error;
    }
  }
}
