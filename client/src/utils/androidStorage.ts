/**
 * Android SQLite Storage Adapter
 * 
 * 提供与 Android SQLite 数据库交互的接口
 * 当在 Android WebView 中运行时，使用 SQLite 替代 localStorage
 */

import type { Message } from '../types';

/**
 * 检查是否在 Android 环境中运行
 */
export function isAndroidEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.AndroidInterface;
}

/**
 * 保存消息到 Android SQLite 数据库
 */
export function saveMessageToAndroid(message: Message): boolean {
  if (!isAndroidEnvironment() || !window.AndroidInterface?.saveMessage) {
    return false;
  }

  try {
    const messageJson = JSON.stringify(message);
    const result = window.AndroidInterface.saveMessage(messageJson);
    const data = JSON.parse(result);
    return data.success === true;
  } catch (error) {
    console.error('Failed to save message to Android:', error);
    return false;
  }
}

/**
 * 从 Android SQLite 数据库获取消息
 */
export function getMessagesFromAndroid(limit: number = 0): Message[] {
  if (!isAndroidEnvironment() || !window.AndroidInterface?.getMessages) {
    return [];
  }

  try {
    const result = window.AndroidInterface.getMessages(limit);
    const messages = JSON.parse(result);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('Failed to get messages from Android:', error);
    return [];
  }
}

/**
 * 获取指定时间戳之前的消息（用于分页加载历史）
 */
export function getMessagesBeforeFromAndroid(
  beforeTimestamp: number,
  limit: number = 20
): Message[] {
  if (!isAndroidEnvironment() || !window.AndroidInterface?.getMessagesBefore) {
    return [];
  }

  try {
    const result = window.AndroidInterface.getMessagesBefore(beforeTimestamp, limit);
    const messages = JSON.parse(result);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('Failed to get messages before timestamp from Android:', error);
    return [];
  }
}

/**
 * 清除所有消息
 */
export function clearMessagesInAndroid(): boolean {
  if (!isAndroidEnvironment() || !window.AndroidInterface?.clearMessages) {
    return false;
  }

  try {
    const result = window.AndroidInterface.clearMessages();
    const data = JSON.parse(result);
    return data.success === true;
  } catch (error) {
    console.error('Failed to clear messages in Android:', error);
    return false;
  }
}

/**
 * 统一的存储接口 - 自动选择 Android SQLite 或 localStorage
 */
export const storage = {
  /**
   * 保存消息
   */
  saveMessage(message: Message): void {
    if (isAndroidEnvironment()) {
      saveMessageToAndroid(message);
    } else {
      // 降级到 localStorage
      try {
        const messages = this.getMessages();
        messages.push(message);
        localStorage.setItem('chat_messages', JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save message to localStorage:', error);
      }
    }
  },

  /**
   * 获取所有消息
   */
  getMessages(limit: number = 0): Message[] {
    if (isAndroidEnvironment()) {
      return getMessagesFromAndroid(limit);
    } else {
      // 降级到 localStorage
      try {
        const data = localStorage.getItem('chat_messages');
        if (!data) return [];
        const messages = JSON.parse(data);
        return limit > 0 ? messages.slice(-limit) : messages;
      } catch (error) {
        console.error('Failed to get messages from localStorage:', error);
        return [];
      }
    }
  },

  /**
   * 获取指定时间戳之前的消息
   */
  getMessagesBefore(beforeTimestamp: number, limit: number = 20): Message[] {
    if (isAndroidEnvironment()) {
      return getMessagesBeforeFromAndroid(beforeTimestamp, limit);
    } else {
      // 降级到 localStorage
      try {
        const messages = this.getMessages();
        const filtered = messages
          .filter(m => m.timestamp < beforeTimestamp)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        return filtered.reverse(); // 返回时间正序
      } catch (error) {
        console.error('Failed to get messages before timestamp:', error);
        return [];
      }
    }
  },

  /**
   * 清除所有消息
   */
  clearMessages(): void {
    if (isAndroidEnvironment()) {
      clearMessagesInAndroid();
    } else {
      // 降级到 localStorage
      try {
        localStorage.removeItem('chat_messages');
      } catch (error) {
        console.error('Failed to clear messages from localStorage:', error);
      }
    }
  },

  /**
   * 获取存储类型
   */
  getStorageType(): 'android-sqlite' | 'localStorage' {
    return isAndroidEnvironment() ? 'android-sqlite' : 'localStorage';
  }
};
