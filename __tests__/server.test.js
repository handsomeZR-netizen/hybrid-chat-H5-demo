import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { WebSocketServer } from '../src/WebSocketServer.js';
import { SessionManager } from '../src/SessionManager.js';
import WebSocket from 'ws';

// 测试辅助函数
const createMockWebSocket = () => {
  const ws = {
    readyState: 1, // OPEN
    send: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    _listeners: {}
  };
  
  // 模拟事件监听
  ws.on = (event, handler) => {
    if (!ws._listeners[event]) {
      ws._listeners[event] = [];
    }
    ws._listeners[event].push(handler);
  };
  
  // 模拟触发事件
  ws._emit = (event, ...args) => {
    if (ws._listeners[event]) {
      ws._listeners[event].forEach(handler => handler(...args));
    }
  };
  
  return ws;
};

const waitForAsync = () => new Promise(resolve => setImmediate(resolve));

describe('WebSocket Server Property-Based Tests', () => {
  let server;
  
  beforeEach(() => {
    server = new WebSocketServer(8081);
    // 不启动真实服务器，只测试逻辑
  });
  
  afterEach(() => {
    if (server) {
      server.sessionManager.sessions.clear();
    }
  });

  /**
   * Feature: hybrid-chat-app, Property 4: 消息广播排除发送者
   * Validates: Requirements 2.2, 3.2
   * 
   * 对于任何用户发送的消息，消息服务器应该将该消息广播给所有其他已连接的用户，但不包括发送者本身。
   */
  test('Property 4: 消息广播排除发送者', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (userIds, senderIndex, messageContent) => {
          // 确保用户 ID 唯一
          const uniqueUserIds = [...new Set(userIds)];
          if (uniqueUserIds.length < 2) return true; // 跳过少于2个用户的情况
          
          const actualSenderIndex = senderIndex % uniqueUserIds.length;
          const senderId = uniqueUserIds[actualSenderIndex];
          
          // 创建模拟 WebSocket 连接
          const mockSockets = uniqueUserIds.map(() => createMockWebSocket());
          
          // 为每个用户创建会话
          uniqueUserIds.forEach((userId, index) => {
            server.sessionManager.createSession(userId, mockSockets[index]);
          });
          
          // 发送者发送消息
          const message = {
            type: 'TEXT',
            id: `test-${Date.now()}`,
            senderId: senderId,
            content: messageContent,
            timestamp: Date.now()
          };
          
          // 广播消息，排除发送者
          server.broadcast(message, mockSockets[actualSenderIndex]);
          
          // 验证：发送者不应该收到消息
          expect(mockSockets[actualSenderIndex].send).not.toHaveBeenCalled();
          
          // 验证：其他所有用户都应该收到消息
          uniqueUserIds.forEach((userId, index) => {
            if (index !== actualSenderIndex) {
              expect(mockSockets[index].send).toHaveBeenCalledWith(JSON.stringify(message));
            }
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hybrid-chat-app, Property 8: 多用户连接独立维护
   * Validates: Requirements 3.1
   * 
   * 对于任何N个用户同时连接，消息服务器应该为每个用户维护独立的 WebSocket 连接和会话。
   */
  test('Property 8: 多用户连接独立维护', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 20 }),
        (userIds) => {
          // 确保用户 ID 唯一
          const uniqueUserIds = [...new Set(userIds)];
          
          const sessionManager = new SessionManager();
          const mockSockets = uniqueUserIds.map(() => createMockWebSocket());
          
          // 为每个用户创建会话
          uniqueUserIds.forEach((userId, index) => {
            sessionManager.createSession(userId, mockSockets[index]);
          });
          
          // 验证：每个用户都有独立的会话
          expect(sessionManager.getAllSessions().length).toBe(uniqueUserIds.length);
          
          // 验证：每个会话都有正确的用户 ID 和 WebSocket
          uniqueUserIds.forEach((userId, index) => {
            const session = sessionManager.getSession(userId);
            expect(session).not.toBeNull();
            expect(session.userId).toBe(userId);
            expect(session.ws).toBe(mockSockets[index]);
            expect(session.connectedAt).toBeDefined();
            expect(session.lastActivity).toBeDefined();
          });
          
          // 验证：每个 WebSocket 都映射到正确的用户
          uniqueUserIds.forEach((userId, index) => {
            const foundUserId = sessionManager.findUserIdByWs(mockSockets[index]);
            expect(foundUserId).toBe(userId);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hybrid-chat-app, Property 10: 用户加入广播通知
   * Validates: Requirements 3.4
   * 
   * 对于任何新用户加入聊天，消息服务器应该向所有现有用户广播 SYSTEM 类型的通知消息。
   */
  test('Property 10: 用户加入广播通知', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (existingUserIds, newUserId) => {
          // 确保新用户不在现有用户中
          const uniqueExistingIds = [...new Set(existingUserIds)];
          if (uniqueExistingIds.includes(newUserId)) {
            return true; // 跳过这种情况
          }
          
          // 创建现有用户的会话
          const existingMockSockets = uniqueExistingIds.map(() => createMockWebSocket());
          uniqueExistingIds.forEach((userId, index) => {
            server.sessionManager.createSession(userId, existingMockSockets[index]);
          });
          
          // 新用户加入
          const newUserSocket = createMockWebSocket();
          const loginMessage = {
            type: 'LOGIN',
            userId: newUserId
          };
          
          // 模拟处理 LOGIN 消息
          await server.messageHandler.handleLogin(newUserSocket, loginMessage);
          
          // 验证：新用户会话已创建
          const newSession = server.sessionManager.getSession(newUserId);
          expect(newSession).not.toBeNull();
          expect(newSession.userId).toBe(newUserId);
          
          // 验证：所有现有用户都收到了系统通知
          existingMockSockets.forEach(socket => {
            expect(socket.send).toHaveBeenCalled();
            const calls = socket.send.mock.calls;
            const systemMessages = calls.filter(call => {
              const msg = JSON.parse(call[0]);
              return msg.type === 'SYSTEM' && msg.content.includes(`${newUserId} joined`);
            });
            expect(systemMessages.length).toBeGreaterThan(0);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hybrid-chat-app, Property 11: 用户离开广播通知
   * Validates: Requirements 3.5
   * 
   * 对于任何用户断开连接，消息服务器应该向所有剩余用户广播 SYSTEM 类型的通知消息。
   */
  test('Property 11: 用户离开广播通知', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        async (userIds, disconnectIndex) => {
          // 确保用户 ID 唯一
          const uniqueUserIds = [...new Set(userIds)];
          if (uniqueUserIds.length < 2) return true; // 至少需要2个用户
          
          const actualDisconnectIndex = disconnectIndex % uniqueUserIds.length;
          const disconnectUserId = uniqueUserIds[actualDisconnectIndex];
          
          // 创建所有用户的会话
          const mockSockets = uniqueUserIds.map(() => createMockWebSocket());
          uniqueUserIds.forEach((userId, index) => {
            server.sessionManager.createSession(userId, mockSockets[index]);
          });
          
          // 清除之前的调用记录
          mockSockets.forEach(socket => socket.send.mockClear());
          
          // 模拟用户断开连接
          await server.handleClose(mockSockets[actualDisconnectIndex]);
          
          // 验证：断开的用户会话已被移除
          const removedSession = server.sessionManager.getSession(disconnectUserId);
          expect(removedSession).toBeNull();
          
          // 验证：所有剩余用户都收到了系统通知
          uniqueUserIds.forEach((userId, index) => {
            if (index !== actualDisconnectIndex) {
              expect(mockSockets[index].send).toHaveBeenCalled();
              const calls = mockSockets[index].send.mock.calls;
              const systemMessages = calls.filter(call => {
                const msg = JSON.parse(call[0]);
                return msg.type === 'SYSTEM' && msg.content.includes(`${disconnectUserId} left`);
              });
              expect(systemMessages.length).toBeGreaterThan(0);
            }
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hybrid-chat-app, Property 23: 连接关闭清理会话
   * Validates: Requirements 8.3
   * 
   * 对于任何WebSocket连接关闭事件，消息服务器应该从会话管理器中移除对应的用户会话。
   */
  test('Property 23: 连接关闭清理会话', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 15 }),
        async (userIds) => {
          // 确保用户 ID 唯一
          const uniqueUserIds = [...new Set(userIds)];
          
          // 创建所有用户的会话
          const mockSockets = uniqueUserIds.map(() => createMockWebSocket());
          uniqueUserIds.forEach((userId, index) => {
            server.sessionManager.createSession(userId, mockSockets[index]);
          });
          
          // 验证初始状态：所有会话都存在
          expect(server.sessionManager.getAllSessions().length).toBe(uniqueUserIds.length);
          
          // 逐个关闭连接
          for (let index = 0; index < uniqueUserIds.length; index++) {
            const userId = uniqueUserIds[index];
            await server.handleClose(mockSockets[index]);
            
            // 验证：该用户的会话已被移除
            const session = server.sessionManager.getSession(userId);
            expect(session).toBeNull();
            
            // 验证：剩余会话数量正确
            const remainingSessions = server.sessionManager.getAllSessions().length;
            expect(remainingSessions).toBe(uniqueUserIds.length - index - 1);
          }
          
          // 验证最终状态：所有会话都已清理
          expect(server.sessionManager.getAllSessions().length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hybrid-chat-app, Property 21: 存储错误不导致崩溃
   * Validates: Requirements 6.5
   * 
   * 对于任何存储操作错误，消息服务器应该记录错误并继续处理后续请求，而不是崩溃或停止服务。
   */
  test('Property 21: 存储错误不导致崩溃', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (userIds, messageContent) => {
          // 确保用户 ID 唯一
          const uniqueUserIds = [...new Set(userIds)];
          if (uniqueUserIds.length === 0) return true;
          
          // 创建一个会抛出错误的存储服务
          const failingStorageService = {
            saveMessage: jest.fn().mockRejectedValue(new Error('Storage failure')),
            getMessagesBefore: jest.fn().mockRejectedValue(new Error('Storage failure')),
            getAllMessages: jest.fn().mockRejectedValue(new Error('Storage failure'))
          };
          
          // 创建使用失败存储的服务器
          const testServer = new WebSocketServer(8082);
          testServer.storageService = failingStorageService;
          testServer.messageHandler.storageService = failingStorageService;
          
          // 创建用户会话
          const mockSockets = uniqueUserIds.map(() => createMockWebSocket());
          uniqueUserIds.forEach((userId, index) => {
            testServer.sessionManager.createSession(userId, mockSockets[index]);
          });
          
          // 尝试发送消息（存储会失败）
          const message = {
            type: 'TEXT',
            content: messageContent
          };
          
          // 这不应该抛出异常
          await expect(async () => {
            await testServer.messageHandler.handleTextMessage(mockSockets[0], message);
          }).not.toThrow();
          
          // 验证：消息仍然被广播（即使存储失败）
          // 其他用户应该收到消息
          for (let i = 1; i < mockSockets.length; i++) {
            expect(mockSockets[i].send).toHaveBeenCalled();
          }
          
          // 验证：服务器仍然可以处理后续请求
          const message2 = {
            type: 'TEXT',
            content: 'Second message'
          };
          
          await expect(async () => {
            await testServer.messageHandler.handleTextMessage(mockSockets[0], message2);
          }).not.toThrow();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hybrid-chat-app, Property 24: 格式错误消息不导致崩溃
   * Validates: Requirements 8.4
   * 
   * 对于任何格式错误的 JSON 消息或缺少必需字段的消息，消息服务器应该记录错误并继续处理其他消息，而不是崩溃。
   */
  test('Property 24: 格式错误消息不导致崩溃', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // 无效的 JSON
          fc.string().filter(s => {
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
          // 缺少 type 字段的对象
          fc.record({
            content: fc.string(),
            userId: fc.string()
          }).map(obj => JSON.stringify(obj)),
          // type 字段不是字符串
          fc.record({
            type: fc.integer(),
            content: fc.string()
          }).map(obj => JSON.stringify(obj)),
          // 缺少必需字段的 LOGIN 消息
          fc.constant(JSON.stringify({ type: 'LOGIN' })),
          // 缺少必需字段的 TEXT 消息
          fc.constant(JSON.stringify({ type: 'TEXT' }))
        ),
        async (malformedMessage) => {
          const mockSocket = createMockWebSocket();
          
          // 处理格式错误的消息不应该抛出异常
          await expect(async () => {
            await server.handleMessage(mockSocket, malformedMessage);
          }).not.toThrow();
          
          // 验证：服务器发送了错误响应
          expect(mockSocket.send).toHaveBeenCalled();
          const calls = mockSocket.send.mock.calls;
          const errorResponses = calls.filter(call => {
            try {
              const msg = JSON.parse(call[0]);
              return msg.type === 'ERROR';
            } catch {
              return false;
            }
          });
          expect(errorResponses.length).toBeGreaterThan(0);
          
          // 验证：服务器仍然可以处理后续的有效消息
          mockSocket.send.mockClear();
          const validMessage = JSON.stringify({
            type: 'LOGIN',
            userId: 'test-user'
          });
          
          await expect(async () => {
            await server.handleMessage(mockSocket, validMessage);
          }).not.toThrow();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hybrid-chat-app, Property 25: 消息按接收顺序处理
   * Validates: Requirements 8.5
   * 
   * 对于任何同时到达的多条消息，消息服务器应该按照接收的顺序依次处理和广播它们。
   */
  test('Property 25: 消息按接收顺序处理', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { minLength: 2, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (messageContents, userId) => {
          // 清理之前的会话
          server.sessionManager.sessions.clear();
          server.messageQueues.clear();
          
          // 创建其他用户来接收广播（先创建，避免接收到发送者的登录消息）
          const receiverSocket = createMockWebSocket();
          server.sessionManager.createSession('receiver', receiverSocket);
          server.messageQueues.set(receiverSocket, { queue: [], processing: false });
          
          // 清除接收者的调用记录
          receiverSocket.send.mockClear();
          
          // 创建发送者会话
          const mockSocket = createMockWebSocket();
          server.sessionManager.createSession(userId, mockSocket);
          
          // 初始化消息队列
          server.messageQueues.set(mockSocket, { queue: [], processing: false });
          
          // 快速连续发送多条消息（模拟同时到达）
          const messages = messageContents.map(content => JSON.stringify({
            type: 'TEXT',
            content: content
          }));
          
          // 将所有消息加入队列
          for (const msg of messages) {
            server.enqueueMessage(mockSocket, msg);
          }
          
          // 等待所有消息处理完成
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // 验证：接收者收到的消息顺序与发送顺序一致
          const receivedCalls = receiverSocket.send.mock.calls;
          const receivedMessages = receivedCalls.map(call => {
            try {
              return JSON.parse(call[0]);
            } catch {
              return null;
            }
          }).filter(msg => msg && msg.type === 'TEXT');
          
          // 验证消息数量
          expect(receivedMessages.length).toBe(messageContents.length);
          
          // 验证消息顺序
          receivedMessages.forEach((msg, index) => {
            expect(msg.content).toBe(messageContents[index]);
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 30000);
});
