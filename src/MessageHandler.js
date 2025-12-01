import { v4 as uuidv4 } from 'uuid';

/**
 * MessageHandler - 处理各种类型的消息
 */
export class MessageHandler {
  constructor(sessionManager, broadcastFn, storageService = null) {
    this.sessionManager = sessionManager;
    this.broadcast = broadcastFn;
    this.storageService = storageService;
  }

  /**
   * 处理 LOGIN 消息
   * @param {WebSocket} ws - WebSocket 连接
   * @param {Object} data - 消息数据
   */
  async handleLogin(ws, data) {
    const { userId } = data;
    
    if (!userId || userId.trim().length === 0) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid user ID'
      }));
      return;
    }

    try {
      // 创建会话
      this.sessionManager.createSession(userId, ws);

      // 发送登录成功响应
      ws.send(JSON.stringify({
        type: 'LOGIN_SUCCESS',
        userId
      }));

      // 自动加载并发送最近的历史消息（最近50条）
      if (this.storageService) {
        try {
          const recentMessages = await this.storageService.getMessagesBefore(null, 50);
          
          if (recentMessages && recentMessages.length > 0) {
            ws.send(JSON.stringify({
              type: 'HISTORY_RESPONSE',
              messages: recentMessages,
              hasMore: recentMessages.length === 50
            }));
          }
        } catch (error) {
          console.error('Failed to load initial history:', error);
          // 历史加载失败不影响登录
        }
      }

      // 广播系统通知：用户加入
      const systemMessage = {
        type: 'SYSTEM',
        id: `${uuidv4()}-${Date.now()}`,
        content: `${userId} joined the chat`,
        timestamp: Date.now()
      };

      // 持久化系统消息（即使失败也继续）
      if (this.storageService) {
        try {
          await this.storageService.saveMessage(systemMessage);
        } catch (error) {
          console.error('Failed to persist system message:', error);
          // 存储错误不应阻止广播
        }
      }

      this.broadcast(systemMessage, ws);
    } catch (error) {
      console.error('Error in handleLogin:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Login failed'
      }));
    }
  }

  /**
   * 处理 TEXT 消息
   * @param {WebSocket} ws - WebSocket 连接
   * @param {Object} data - 消息数据
   */
  async handleTextMessage(ws, data) {
    try {
      const userId = this.sessionManager.findUserIdByWs(ws);
      
      if (!userId) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Not authenticated'
        }));
        return;
      }

      // 验证消息内容
      if (!data.content || data.content.trim().length === 0) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Empty message not allowed'
        }));
        return;
      }

      // 更新活动时间
      this.sessionManager.updateActivity(userId);

      // 构造完整消息
      const message = {
        type: 'TEXT',
        id: data.id || `${uuidv4()}-${Date.now()}`,
        senderId: userId,
        content: data.content,
        timestamp: data.timestamp || Date.now()
      };

      // 持久化消息（即使失败也继续广播）
      if (this.storageService) {
        try {
          await this.storageService.saveMessage(message);
        } catch (error) {
          console.error('Failed to persist message:', error);
          // 存储错误不应阻止消息广播
        }
      }

      // 广播给除发送者外的所有用户
      this.broadcast(message, ws);
    } catch (error) {
      console.error('Error in handleTextMessage:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Failed to send message'
      }));
    }
  }

  /**
   * 处理 SYSTEM 消息（通常由服务器生成）
   * @param {Object} data - 消息数据
   */
  async handleSystemMessage(data) {
    const message = {
      type: 'SYSTEM',
      id: data.id || `${uuidv4()}-${Date.now()}`,
      content: data.content,
      timestamp: data.timestamp || Date.now()
    };

    // 持久化系统消息
    if (this.storageService) {
      try {
        await this.storageService.saveMessage(message);
      } catch (error) {
        console.error('Failed to persist system message:', error);
      }
    }

    this.broadcast(message);
  }

  /**
   * 处理 GET_HISTORY 请求
   * @param {WebSocket} ws - WebSocket 连接
   * @param {Object} data - 请求数据
   */
  async handleGetHistory(ws, data) {
    const userId = this.sessionManager.findUserIdByWs(ws);
    
    if (!userId) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Not authenticated'
      }));
      return;
    }

    if (!this.storageService) {
      ws.send(JSON.stringify({
        type: 'HISTORY_RESPONSE',
        messages: [],
        hasMore: false
      }));
      return;
    }

    try {
      const { lastMessageId, limit = 20 } = data;
      const messages = await this.storageService.getMessagesBefore(lastMessageId, limit);
      
      // 检查是否还有更多消息
      const hasMore = messages.length === limit;

      ws.send(JSON.stringify({
        type: 'HISTORY_RESPONSE',
        messages: messages,
        hasMore: hasMore
      }));
    } catch (error) {
      console.error('Failed to get history:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Failed to retrieve message history'
      }));
    }
  }

  /**
   * 处理媒体消息（IMAGE、VIDEO、AUDIO）
   * @param {WebSocket} ws - WebSocket 连接
   * @param {Object} data - 消息数据
   */
  async handleMediaMessage(ws, data) {
    try {
      const userId = this.sessionManager.findUserIdByWs(ws);
      
      if (!userId) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Not authenticated'
        }));
        return;
      }

      // 验证消息内容
      if (!data.content || data.content.trim().length === 0) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Empty media content not allowed'
        }));
        return;
      }

      // 更新活动时间
      this.sessionManager.updateActivity(userId);

      // 构造完整消息
      const message = {
        type: data.type, // IMAGE, VIDEO, or AUDIO
        id: data.id || `${uuidv4()}-${Date.now()}`,
        senderId: userId,
        content: data.content,
        timestamp: data.timestamp || Date.now()
      };

      // 持久化消息（即使失败也继续广播）
      if (this.storageService) {
        try {
          await this.storageService.saveMessage(message);
        } catch (error) {
          console.error('Failed to persist media message:', error);
          // 存储错误不应阻止消息广播
        }
      }

      // 广播给所有用户（包括发送者，用于确认）
      this.broadcast(message);
    } catch (error) {
      console.error('Error in handleMediaMessage:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Failed to send media message'
      }));
    }
  }

  /**
   * 验证消息格式
   * @param {any} data - 消息数据
   * @returns {string|null} 错误消息，如果有效则返回 null
   */
  validateMessage(data) {
    // 检查数据是否为对象
    if (!data || typeof data !== 'object') {
      return 'Message must be an object';
    }

    // 检查必需字段：type
    if (!data.type || typeof data.type !== 'string') {
      return 'Message must have a valid type field';
    }

    // 根据消息类型验证特定字段
    switch (data.type) {
      case 'LOGIN':
        if (!data.userId || typeof data.userId !== 'string') {
          return 'LOGIN message must have a valid userId field';
        }
        break;
      
      case 'TEXT':
      case 'IMAGE':
      case 'VIDEO':
      case 'AUDIO':
        if (!data.content || typeof data.content !== 'string') {
          return `${data.type} message must have a valid content field`;
        }
        break;
      
      case 'GET_HISTORY':
        // lastMessageId 是可选的，但如果存在必须是字符串
        if (data.lastMessageId !== undefined && typeof data.lastMessageId !== 'string') {
          return 'GET_HISTORY message lastMessageId must be a string';
        }
        // limit 是可选的，但如果存在必须是数字
        if (data.limit !== undefined && typeof data.limit !== 'number') {
          return 'GET_HISTORY message limit must be a number';
        }
        break;
      
      case 'SYSTEM':
        // SYSTEM 消息由服务器生成，客户端不应发送
        return 'SYSTEM messages cannot be sent by clients';
      
      default:
        // 未知类型不算错误，由调用者决定如何处理
        break;
    }

    return null; // 验证通过
  }
}
