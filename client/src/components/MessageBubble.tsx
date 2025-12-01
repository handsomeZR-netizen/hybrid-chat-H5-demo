import { motion } from 'framer-motion';
import type { Message } from '../types';
import { CheckIcon, ClockIcon, ErrorIcon } from './Icons';
import { cn } from '../utils/cn';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isLastInGroup?: boolean;
}

// Generate consistent color for user based on their ID
function getUserColor(userId: string | undefined): string {
  if (!userId) return '#9e9e9e';
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 使用莫兰迪色系的色相范围
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 35%, 55%)`; // 降低饱和度，更文艺
}

export function MessageBubble({ message, isMe, isLastInGroup }: MessageBubbleProps) {
  const avatarColor = message.avatarColor || getUserColor(message.senderId);

  // System messages
  if (message.type === 'SYSTEM') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-4 flex flex-col items-center"
      >
        <div className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-gray-500 border border-white/40 shadow-sm">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "flex w-full mb-4 relative",
        isMe ? "justify-end" : "justify-start"
      )}
      data-testid="message-bubble"
      data-sender-id={message.senderId}
      data-message-type={message.type}
    >
      <div className={cn(
        "flex max-w-[75%] gap-2",
        isMe ? "flex-row-reverse" : "flex-row"
      )}>
        {/* 头像 */}
        {!isMe && (
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 shadow-sm border-2 border-white/60 flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: avatarColor }}
            data-testid="avatar-color"
          >
            {message.senderId?.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
          {/* 发送者名字 */}
          {!isMe && !isLastInGroup && (
            <span 
              className="text-xs text-gray-500/80 ml-1 mb-1 tracking-wide"
              data-testid="sender-name"
            >
              {message.senderId || '系统'}
            </span>
          )}

          {/* 气泡本体 */}
          <div className={cn(
            "px-4 py-3 shadow-sm text-sm relative transition-all",
            // 对方：磨砂玻璃白
            !isMe && "bg-white/80 backdrop-blur-md text-gray-700 rounded-2xl rounded-tl-sm border border-white/40",
            // 我：渐变莫兰迪色
            isMe && "bg-gradient-to-br from-sage-400 to-sage-500 text-white rounded-2xl rounded-tr-sm shadow-md"
          )}>
            {/* 文本消息 */}
            {message.type === 'TEXT' && (
              <div 
                className="leading-relaxed tracking-wide whitespace-pre-wrap"
                data-testid="message-content"
              >
                {message.content}
              </div>
            )}
            
            {/* 图片消息 */}
            {message.type === 'IMAGE' && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={message.content}
                  alt="分享的图片"
                  className="max-w-full block rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                  data-testid="image-preview"
                />
              </div>
            )}
            
            {/* 视频消息 */}
            {message.type === 'VIDEO' && (
              <div className="overflow-hidden rounded-lg">
                <video
                  src={message.content}
                  controls
                  className="max-w-full block rounded-lg"
                  data-testid="video-player"
                />
              </div>
            )}
            
            {/* 音频消息 - 简化波形样式 */}
            {message.type === 'AUDIO' && (
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="flex items-end gap-0.5 h-8">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 rounded-full transition-all",
                        isMe ? "bg-white/60" : "bg-sage-400/60"
                      )}
                      style={{
                        height: `${Math.random() * 60 + 40}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
                <audio
                  src={message.content}
                  controls
                  className="flex-1 h-8 opacity-80"
                  data-testid="audio-player"
                />
              </div>
            )}
          </div>

          {/* 时间戳和状态 */}
          <div className={cn(
            "text-[10px] mt-1.5 flex items-center gap-1.5 px-1",
            isMe ? "justify-end text-gray-400" : "justify-start text-gray-400"
          )}>
            <span data-testid="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isMe && message.status && (
              <span 
                data-testid="message-status"
                className="flex items-center gap-1"
              >
                {message.status === 'sending' && (
                  <>
                    <ClockIcon size={10} color="#ff9800" />
                    <span className="text-amber-500">发送中</span>
                  </>
                )}
                {message.status === 'sent' && (
                  <>
                    <CheckIcon size={10} color="#8AA29E" />
                    <span className="text-sage-400">已发送</span>
                  </>
                )}
                {message.status === 'failed' && (
                  <>
                    <ErrorIcon size={10} color="#e57373" />
                    <span className="text-red-400">失败</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
