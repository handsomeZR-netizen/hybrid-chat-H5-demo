import fs from 'fs/promises';
import path from 'path';

/**
 * StorageService - 消息持久化服务
 * 使用文件系统存储消息
 */
export class StorageService {
  constructor(storagePath = './data/messages.json') {
    this.storagePath = storagePath;
    this.messages = [];
    this.initialized = false;
  }

  /**
   * 初始化存储服务
   */
  async initialize() {
    try {
      // 确保数据目录存在
      const dir = path.dirname(this.storagePath);
      await fs.mkdir(dir, { recursive: true });

      // 尝试加载现有消息
      try {
        const data = await fs.readFile(this.storagePath, 'utf-8');
        this.messages = JSON.parse(data);
      } catch (error) {
        // 文件不存在或为空，使用空数组
        this.messages = [];
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      // 即使初始化失败，也使用内存存储
      this.messages = [];
      this.initialized = true;
    }
  }

  /**
   * 保存消息
   * @param {Object} message - 消息对象
   */
  async saveMessage(message) {
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to initialize storage during save:', error);
        // 即使初始化失败，也尝试保存到内存
      }
    }

    try {
      // 添加消息到内存数组
      this.messages.push(message);

      // 持久化到文件
      try {
        await fs.writeFile(
          this.storagePath,
          JSON.stringify(this.messages, null, 2),
          'utf-8'
        );
      } catch (writeError) {
        console.error('Failed to write message to file:', writeError);
        // 消息已在内存中，文件写入失败不影响内存操作
        throw writeError;
      }
    } catch (error) {
      console.error('Failed to save message:', error);
      // 即使保存失败，消息仍在内存中
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
      // 找到指定消息的索引
      const messageIndex = this.messages.findIndex(msg => msg.id === messageId);

      if (messageIndex === -1) {
        // 如果找不到消息，返回最新的 limit 条消息
        return this.messages.slice(-limit);
      }

      // 获取该消息之前的消息
      const startIndex = Math.max(0, messageIndex - limit);
      return this.messages.slice(startIndex, messageIndex);
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

    return [...this.messages];
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
      // 从内存中删除
      this.messages = this.messages.filter(msg => msg.id !== messageId);

      // 持久化到文件
      await fs.writeFile(
        this.storagePath,
        JSON.stringify(this.messages, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * 清空所有消息（用于测试）
   */
  async clear() {
    this.messages = [];
    try {
      await fs.writeFile(this.storagePath, JSON.stringify([]), 'utf-8');
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }
}
