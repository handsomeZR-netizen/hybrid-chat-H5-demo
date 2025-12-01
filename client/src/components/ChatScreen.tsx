import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message, ConnectionStatus, MessageType } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { LogoutIcon, RefreshIcon, ChatIcon } from './Icons';
import { cn } from '../utils/cn';

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

  useEffect(() => {
    if (messagesEndRef.current && !isLoadingHistoryInternal) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingHistoryInternal]);

  useEffect(() => {
    if (messagesContainerRef.current && previousScrollHeight > 0) {
      const currentScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = currentScrollHeight - previousScrollHeight;
      if (scrollDiff > 0) {
        messagesContainerRef.current.scrollTop = scrollDiff;
        setPreviousScrollHeight(0);
        setIsLoadingHistoryInternal(false);
      }
    }
  }, [messages, previousScrollHeight]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && messages.length > 0 && !isLoadingHistoryInternal && !isLoadingHistory && hasMoreHistory) {
        setIsLoadingHistoryInternal(true);
        setPreviousScrollHeight(messagesContainerRef.current.scrollHeight);
        onLoadHistory(messages[0].id);
      }
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-400';
      case 'connecting': return 'bg-amber-400';
      case 'disconnected': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中...';
      case 'disconnected': return '未连接';
      default: return '未知';
    }
  };


  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-cream to-warmgray">
      {/* 动态艺术背景 */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200 blur-[80px] mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-200 blur-[80px] mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-rose-200 blur-[80px] mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      {/* 错误通知 */}
      <AnimatePresence>
        {showError && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-400/90 backdrop-blur-sm text-white rounded-2xl shadow-lg text-sm"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 顶部导航 - 磨砂玻璃 */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 glass border-b border-white/20 shadow-sm">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-400 to-sage-500 flex items-center justify-center shadow-md">
              <ChatIcon size={20} color="white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-800 tracking-wide">智聊</h2>
              <div className="text-xs text-gray-500">{userId}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
              <span className="text-xs text-gray-600">{getStatusText()}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2.5 bg-white/50 hover:bg-white/70 rounded-full transition-all duration-200 hover:scale-105"
              title="退出登录"
            >
              <LogoutIcon size={18} color="#6b7280" />
            </button>
          </div>
        </div>
      </div>


      {/* 消息列表 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="relative z-0 h-full overflow-y-auto pt-20 pb-28 px-4"
        data-testid="messages-container"
      >
        <div className="max-w-lg mx-auto">
          {/* 加载指示器 */}
          {(isLoadingHistory || isLoadingHistoryInternal) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-4"
              data-testid="loading-indicator"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full">
                <div className="w-4 h-4 border-2 border-sage-200 border-t-sage-400 rounded-full animate-spin" />
                <span className="text-sm text-gray-500">加载消息中...</span>
              </div>
            </motion.div>
          )}
          
          {/* 消息列表 */}
          <AnimatePresence>
            {messages.map((message, index) => {
              const isLastInGroup = 
                index === messages.length - 1 || 
                messages[index + 1]?.senderId !== message.senderId;
              
              return (
                <div key={message.id}>
                  <MessageBubble
                    message={message}
                    isMe={message.senderId === userId}
                    isLastInGroup={isLastInGroup}
                  />
                  {message.status === 'failed' && message.senderId === userId && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "mb-2",
                        message.senderId === userId ? "text-right pr-3" : "text-left pl-3"
                      )}
                    >
                      <button
                        onClick={() => onRetryMessage(message.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/90 hover:bg-amber-500 text-white text-xs rounded-full transition-colors shadow-sm"
                      >
                        <RefreshIcon size={12} color="white" />
                        重试
                      </button>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} data-testid="messages-end" />
        </div>
      </div>

      {/* 底部输入区 - 渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-cream via-cream/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <InputArea
            connectionStatus={connectionStatus}
            onSendMessage={onSendMessage}
            onSendMediaMessage={onSendMediaMessage}
          />
        </div>
      </div>
    </div>
  );
}
