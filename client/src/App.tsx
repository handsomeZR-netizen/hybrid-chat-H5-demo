import { useState, useEffect, useCallback, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ChatScreen } from './components/ChatScreen';
import { WebSocketManager } from './utils/websocket';
import type { Message, ViewType, ConnectionStatus, WebSocketMessage, MessageType } from './types';
import { v4 as uuidv4 } from 'uuid';

// WebSocket 服务器地址 - 可通过环境变量配置
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

function App() {
  const [view, setView] = useState<ViewType>('login');
  const [userId, setUserId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const userIdRef = useRef<string>('');

  // 保持 userId 的最新引用
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // 初始化 WebSocket 管理器（只执行一次）
  useEffect(() => {
    const wsManager = new WebSocketManager(WS_URL);
    wsManagerRef.current = wsManager;

    wsManager.onOpen(() => {
      setConnectionStatus('connected');
      
      // 连接建立后发送 LOGIN 消息
      if (userIdRef.current) {
        wsManager.send({
          type: 'LOGIN',
          userId: userIdRef.current
        });
      }
    });

    wsManager.onClose(() => {
      setConnectionStatus('disconnected');
    });

    wsManager.onError((error) => {
      console.error('WebSocket 错误:', error);
      setConnectionStatus('disconnected');
    });

    wsManager.onMessage((message: WebSocketMessage) => {
      if (message.type === 'HISTORY_RESPONSE') {
        // 处理历史消息响应
        if ('messages' in message) {
          const historyMessages = message.messages;
          
          // 如果是登录后的初始历史加载（当前消息为空），直接设置
          setMessages(prev => {
            if (prev.length === 0) {
              // 登录后首次加载历史
              return historyMessages;
            } else {
              // 滚动加载更多历史（添加到前面）
              return [...historyMessages, ...prev];
            }
          });
          
          setHasMoreHistory(message.hasMore);
          setIsLoadingHistory(false);
        }
      } else if ('id' in message) {
        const incomingMessage = message as Message;
        
        // 检查是否是自己发送的消息（避免重复）
        // 如果消息已存在于本地（通过 id 判断），则跳过
        setMessages(prev => {
          const exists = prev.some(m => m.id === incomingMessage.id);
          if (exists) {
            return prev;
          }
          return [...prev, incomingMessage];
        });
      }
    });

    // 组件卸载时清理
    return () => {
      wsManager.disconnect();
    };
  }, []);

  const handleLogin = useCallback((newUserId: string) => {
    setUserId(newUserId);
    userIdRef.current = newUserId;
    setConnectionStatus('connecting');
    setView('chat');
    
    // 连接 WebSocket 服务器
    wsManagerRef.current?.connect();
  }, []);

  const handleLogout = useCallback(() => {
    wsManagerRef.current?.disconnect();
    setView('login');
    setUserId('');
    userIdRef.current = '';
    setMessages([]);
    setConnectionStatus('disconnected');
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!wsManagerRef.current?.isConnected()) {
      setErrorMessage('无法发送消息：未连接到服务器');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const message: Message = {
      id: `${uuidv4()}-${Date.now()}`,
      type: 'TEXT',
      senderId: userIdRef.current,
      content: content,
      timestamp: Date.now(),
      status: 'sending'
    };

    // 立即添加消息到本地状态，状态为 'sending'
    setMessages(prev => [...prev, message]);

    try {
      wsManagerRef.current.send(message);
      
      // 短暂延迟后更新消息状态为 'sent'
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'sent' } : msg
        ));
      }, 100);
    } catch {
      // 发送失败时更新消息状态为 'failed'
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'failed' } : msg
      ));
      setErrorMessage('消息发送失败');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  }, []);

  const handleSendMediaMessage = useCallback((content: string, type: MessageType) => {
    if (!wsManagerRef.current?.isConnected()) {
      setErrorMessage('无法发送媒体：未连接到服务器');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const message: Message = {
      id: `${uuidv4()}-${Date.now()}`,
      type: type,
      senderId: userIdRef.current,
      content: content,
      timestamp: Date.now(),
      status: 'sending'
    };

    // 立即添加消息到本地状态，状态为 'sending'
    setMessages(prev => [...prev, message]);

    try {
      wsManagerRef.current.send(message);
      
      // 短暂延迟后更新消息状态为 'sent'
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'sent' } : msg
        ));
      }, 100);
    } catch {
      // 发送失败时更新消息状态为 'failed'
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'failed' } : msg
      ));
      setErrorMessage('媒体发送失败');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  }, []);

  const handleLoadHistory = useCallback((lastMessageId: string) => {
    if (!wsManagerRef.current?.isConnected()) {
      setErrorMessage('无法加载历史：未连接到服务器');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    if (isLoadingHistory) {
      // 防止重复请求
      return;
    }

    setIsLoadingHistory(true);
    wsManagerRef.current.send({
      type: 'GET_HISTORY',
      lastMessageId: lastMessageId,
      limit: 20
    });
  }, [isLoadingHistory]);

  const handleRetryMessage = useCallback((messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId && msg.status === 'failed');
    if (!failedMessage) return;

    // 更新状态为 'sending'
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'sending' } : msg
    ));

    try {
      wsManagerRef.current?.send(failedMessage);
      
      // 短暂延迟后更新消息状态为 'sent'
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'sent' } : msg
        ));
      }, 100);
    } catch {
      // 重试失败时更新消息状态为 'failed'
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'failed' } : msg
      ));
      setErrorMessage('重试失败');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  }, [messages]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      {view === 'login' ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <ChatScreen
          userId={userId}
          messages={messages}
          connectionStatus={connectionStatus}
          onSendMessage={handleSendMessage}
          onSendMediaMessage={handleSendMediaMessage}
          onLoadHistory={handleLoadHistory}
          onLogout={handleLogout}
          onRetryMessage={handleRetryMessage}
          isLoadingHistory={isLoadingHistory}
          hasMoreHistory={hasMoreHistory}
          errorMessage={errorMessage}
          showError={showError}
        />
      )}
    </div>
  );
}

export default App;
