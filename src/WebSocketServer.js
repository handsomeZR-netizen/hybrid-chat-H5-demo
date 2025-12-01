import { WebSocketServer as WSServer } from 'ws';
import { SessionManager } from './SessionManager.js';
import { MessageHandler } from './MessageHandler.js';
import { StorageService } from './StorageService.js';
import { SupabaseStorageService } from './SupabaseStorageService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocketServer - WebSocket 服务器主类
 */
export class WebSocketServer {
  constructor(port = 8080, storageConfig = {}) {
    this.port = port;
    this.wss = null;
    this.sessionManager = new SessionManager();
    this.storageConfig = storageConfig;
    
    // 立即创建存储服务和消息处理器（用于测试兼容性）
    this.storageService = this.createStorageService(storageConfig);
    this.messageHandler = new MessageHandler(
      this.sessionManager,
      this.broadcast.bind(this),
      this.storageService
    );
    
    // 消息队列：为每个连接维护一个消息队列
    this.messageQueues = new Map(); // ws -> { queue: [], processing: boolean }
  }

  /**
   * 创建存储服务实例
   */
  createStorageService(config = this.storageConfig) {
    const { mode, supabaseUrl, supabaseKey } = config || {};

    if (mode === 'supabase') {
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not provided, falling back to file storage');
        return new StorageService('./data/messages.json');
      }
      return new SupabaseStorageService(supabaseUrl, supabaseKey);
    }

    // 默认使用文件存储
    return new StorageService(
      typeof this.storageConfig === 'string' 
        ? this.storageConfig 
        : './data/messages.json'
    );
  }

  /**
   * 启动服务器
   */
  async start() {
    // 初始化存储服务
    await this.storageService.initialize();

    this.wss = new WSServer({ port: this.port });

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket Server Error:', error);
    });

    console.log(`WebSocket server started on port ${this.port}`);
  }

  /**
   * 停止服务器
   */
  stop() {
    if (this.wss) {
      this.wss.close();
      this.sessionManager.sessions.clear();
    }
  }

  /**
   * 处理新连接
   * @param {WebSocket} ws - WebSocket 连接
   */
  handleConnection(ws) {
    console.log('New connection established');

    // 为新连接初始化消息队列
    this.messageQueues.set(ws, { queue: [], processing: false });

    ws.on('message', (data) => {
      this.enqueueMessage(ws, data);
    });

    ws.on('close', () => {
      this.handleClose(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      // 连接错误时清理资源
      this.cleanupConnection(ws);
    });

    ws.on('pong', () => {
      // 心跳响应，更新连接活跃状态
      const userId = this.sessionManager.findUserIdByWs(ws);
      if (userId) {
        this.sessionManager.updateActivity(userId);
      }
    });
  }

  /**
   * 将消息加入队列
   * @param {WebSocket} ws - WebSocket 连接
   * @param {string} data - 消息数据
   */
  enqueueMessage(ws, data) {
    const queueInfo = this.messageQueues.get(ws);
    if (!queueInfo) {
      console.error('No queue found for connection');
      return;
    }

    queueInfo.queue.push(data);
    this.processMessageQueue(ws);
  }

  /**
   * 处理消息队列（确保消息按顺序处理）
   * @param {WebSocket} ws - WebSocket 连接
   */
  async processMessageQueue(ws) {
    const queueInfo = this.messageQueues.get(ws);
    if (!queueInfo) {
      return;
    }

    // 如果已经在处理，则等待当前消息处理完成
    if (queueInfo.processing) {
      return;
    }

    // 标记为正在处理
    queueInfo.processing = true;

    try {
      while (queueInfo.queue.length > 0) {
        const data = queueInfo.queue.shift();
        await this.handleMessage(ws, data);
      }
    } finally {
      // 处理完成，重置标志
      queueInfo.processing = false;
    }
  }

  /**
   * 处理接收的消息
   * @param {WebSocket} ws - WebSocket 连接
   * @param {string} data - 消息数据
   */
  async handleMessage(ws, data) {
    try {
      // JSON 解析错误处理
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        this.sendErrorResponse(ws, 'Invalid JSON format');
        return;
      }

      // 消息格式验证
      const validationError = this.messageHandler.validateMessage(message);
      if (validationError) {
        console.error('Message validation error:', validationError);
        this.sendErrorResponse(ws, validationError);
        return;
      }

      // 处理不同类型的消息
      switch (message.type) {
        case 'LOGIN':
          await this.messageHandler.handleLogin(ws, message);
          break;
        case 'TEXT':
          await this.messageHandler.handleTextMessage(ws, message);
          break;
        case 'IMAGE':
        case 'VIDEO':
        case 'AUDIO':
          await this.messageHandler.handleMediaMessage(ws, message);
          break;
        case 'GET_HISTORY':
          await this.messageHandler.handleGetHistory(ws, message);
          break;
        case 'SYSTEM':
          // SYSTEM 消息通常由服务器生成，客户端不应发送
          console.warn('Client attempted to send SYSTEM message');
          this.sendErrorResponse(ws, 'SYSTEM messages can only be sent by server');
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
          this.sendErrorResponse(ws, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendErrorResponse(ws, 'Failed to process message');
    }
  }

  /**
   * 发送错误响应
   * @param {WebSocket} ws - WebSocket 连接
   * @param {string} errorMessage - 错误消息
   */
  sendErrorResponse(ws, errorMessage) {
    try {
      if (ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: errorMessage,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Failed to send error response:', error);
    }
  }

  /**
   * 清理连接资源
   * @param {WebSocket} ws - WebSocket 连接
   */
  cleanupConnection(ws) {
    // 清理消息队列
    this.messageQueues.delete(ws);
  }

  /**
   * 处理连接关闭
   * @param {WebSocket} ws - WebSocket 连接
   */
  async handleClose(ws) {
    const userId = this.sessionManager.findUserIdByWs(ws);
    
    // 清理连接资源
    this.cleanupConnection(ws);
    
    if (userId) {
      console.log(`User ${userId} disconnected`);
      
      // 移除会话
      this.sessionManager.removeSession(userId);

      // 广播系统通知：用户离开
      const systemMessage = {
        type: 'SYSTEM',
        id: `${uuidv4()}-${Date.now()}`,
        content: `${userId} left the chat`,
        timestamp: Date.now()
      };

      // 持久化系统消息
      if (this.storageService) {
        try {
          await this.storageService.saveMessage(systemMessage);
        } catch (error) {
          console.error('Failed to persist system message:', error);
          // 即使持久化失败，也继续广播
        }
      }

      this.broadcast(systemMessage);
    }
  }

  /**
   * 广播消息给所有客户端（可选排除某个连接）
   * @param {Object} message - 消息对象
   * @param {WebSocket} excludeWs - 要排除的 WebSocket 连接（可选）
   */
  broadcast(message, excludeWs = null) {
    const messageStr = JSON.stringify(message);

    this.sessionManager.getAllSessions().forEach(session => {
      if (session.ws !== excludeWs && session.ws.readyState === 1) { // 1 = OPEN
        try {
          session.ws.send(messageStr);
        } catch (error) {
          console.error(`Error broadcasting to user ${session.userId}:`, error);
        }
      }
    });
  }
}
