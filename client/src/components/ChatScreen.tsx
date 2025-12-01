import { useRef, useEffect, useState } from 'react';
import type { Message, ConnectionStatus, MessageType } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { LogoutIcon, RefreshIcon, ChatIcon } from './Icons';

interface ChatScreenProps {
  userId: string;
  messages: Message[];
  connectionStatus: ConnectionStatus;
  onSendMessage: (content: string) => void;
  onSendMediaMessage: (content: string, type: MessageType) => void;
  onLoadHistory: (lastMessageId: string) => void;
  onLogout: () => void;
  onRetryMessage: (messageId: string) => void;
  isLoadingHistory?: boolean;
  hasMoreHistory?: boolean;
  errorMessage?: string;
  showError?: boolean;
}

export function ChatScreen({
  userId,
  messages,
  connectionStatus,
  onSendMessage,
  onSendMediaMessage,
  onLoadHistory,
  onLogout,
  onRetryMessage,
  isLoadingHistory = false,
  hasMoreHistory = true,
  errorMessage = '',
  showError = false
}: ChatScreenProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);
  const [isLoadingHistoryInternal, setIsLoadingHistoryInternal] = useState(false);

  // Add keyframes for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes slideDown {
        0% { 
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        100% { 
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive (but not when loading history)
  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.scrollIntoView && !isLoadingHistoryInternal) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingHistoryInternal]);

  // Preserve scroll position when history is loaded
  useEffect(() => {
    if (messagesContainerRef.current && previousScrollHeight > 0) {
      const currentScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = currentScrollHeight - previousScrollHeight;
      
      if (scrollDiff > 0) {
        // Restore scroll position
        messagesContainerRef.current.scrollTop = scrollDiff;
        setPreviousScrollHeight(0);
        setIsLoadingHistoryInternal(false);
      }
    }
  }, [messages, previousScrollHeight]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      
      // If scrolled to top, load more history
      if (scrollTop === 0 && messages.length > 0 && !isLoadingHistoryInternal && !isLoadingHistory && hasMoreHistory) {
        setIsLoadingHistoryInternal(true);
        setPreviousScrollHeight(messagesContainerRef.current.scrollHeight);
        
        const oldestMessage = messages[0];
        onLoadHistory(oldestMessage.id);
      }
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4caf50';
      case 'connecting':
        return '#ff9800';
      case 'disconnected':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'disconnected':
        return '未连接';
      default:
        return '未知';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      maxWidth: '480px',
      backgroundColor: '#fff',
      position: 'relative',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Error Notification */}
      {showError && errorMessage && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          animation: 'slideDown 0.3s ease-out',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {errorMessage}
        </div>
      )}
      
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#1976d2',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ChatIcon size={24} color="white" />
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>智聊</h2>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              {userId}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getConnectionStatusColor()
            }} />
            <span style={{ fontSize: '12px' }}>
              {getConnectionStatusText()}
            </span>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="退出登录"
          >
            <LogoutIcon size={18} color="white" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#fafafa'
        }}
        data-testid="messages-container"
      >
        {/* Loading Indicator */}
        {(isLoadingHistory || isLoadingHistoryInternal) && (
          <div 
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '10px',
              color: '#666'
            }}
            data-testid="loading-indicator"
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ddd',
                borderTopColor: '#2196f3',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ fontSize: '14px' }}>加载消息中...</span>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => {
          // Check if this is the last message in a group from the same sender
          const isLastInGroup = 
            index === messages.length - 1 || 
            messages[index + 1]?.senderId !== message.senderId;
          
          return (
            <div key={message.id} style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <MessageBubble
                message={message}
                isMe={message.senderId === userId}
                isLastInGroup={isLastInGroup}
              />
              {message.status === 'failed' && message.senderId === userId && (
                <div style={{
                  textAlign: message.senderId === userId ? 'right' : 'left',
                  marginTop: '-8px',
                  marginBottom: '8px',
                  paddingRight: message.senderId === userId ? '12px' : '0',
                  paddingLeft: message.senderId === userId ? '0' : '12px'
                }}>
                  <button
                    onClick={() => onRetryMessage(message.id)}
                    style={{
                      backgroundColor: '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshIcon size={12} color="white" />
                    重试
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} data-testid="messages-end" />
      </div>

      {/* Input Area */}
      <InputArea
        connectionStatus={connectionStatus}
        onSendMessage={onSendMessage}
        onSendMediaMessage={onSendMediaMessage}
      />
    </div>
  );
}
