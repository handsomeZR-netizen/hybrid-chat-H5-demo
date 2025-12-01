/**
 * SessionManager - 管理用户会话
 * 维护用户 ID 到 WebSocket 连接的映射
 */
export class SessionManager {
  constructor() {
    this.sessions = new Map(); // userId -> { userId, ws, connectedAt, lastActivity }
  }

  /**
   * 创建新会话
   * @param {string} userId - 用户 ID
   * @param {WebSocket} ws - WebSocket 连接
   * @returns {Object} 会话对象
   */
  createSession(userId, ws) {
    const session = {
      userId,
      ws,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    };
    this.sessions.set(userId, session);
    return session;
  }

  /**
   * 获取会话
   * @param {string} userId - 用户 ID
   * @returns {Object|null} 会话对象或 null
   */
  getSession(userId) {
    return this.sessions.get(userId) || null;
  }

  /**
   * 移除会话
   * @param {string} userId - 用户 ID
   */
  removeSession(userId) {
    this.sessions.delete(userId);
  }

  /**
   * 通过 WebSocket 连接查找用户 ID
   * @param {WebSocket} ws - WebSocket 连接
   * @returns {string|null} 用户 ID 或 null
   */
  findUserIdByWs(ws) {
    for (const [userId, session] of this.sessions.entries()) {
      if (session.ws === ws) {
        return userId;
      }
    }
    return null;
  }

  /**
   * 获取所有会话
   * @returns {Array} 会话数组
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * 更新会话活动时间
   * @param {string} userId - 用户 ID
   */
  updateActivity(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }
}
