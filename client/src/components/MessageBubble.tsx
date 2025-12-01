import type { Message } from '../types';
import { CheckIcon, ClockIcon, ErrorIcon } from './Icons';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isLastInGroup?: boolean;
}

// Generate consistent color for user based on their ID
function getUserColor(userId: string | undefined): string {
  if (!userId) return '#9e9e9e'; // 默认灰色
  
  // Simple hash function to generate consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const avatarColor = message.avatarColor || getUserColor(message.senderId);

  // System messages have special styling
  if (message.type === 'SYSTEM') {
    return (
      <div style={{
        marginBottom: '15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#e0e0e0',
          borderRadius: '16px',
          fontSize: '14px',
          color: '#666'
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  // Regular messages (TEXT, IMAGE, VIDEO, AUDIO)
  return (
    <div
      style={{
        marginBottom: '15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start'
      }}
      data-testid="message-bubble"
      data-sender-id={message.senderId}
      data-message-type={message.type}
    >
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Sender name with color indicator */}
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '4px',
          paddingLeft: isMe ? '0' : '12px',
          paddingRight: isMe ? '12px' : '0',
          textAlign: isMe ? 'right' : 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: isMe ? 'flex-end' : 'flex-start'
        }}>
          {!isMe && (
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: avatarColor
              }}
              data-testid="avatar-color"
            />
          )}
          <span data-testid="sender-name">{message.senderId || '系统'}</span>
        </div>

        {/* Message content bubble */}
        <div style={{
          padding: '10px 15px',
          backgroundColor: isMe ? '#1976d2' : '#fff',
          color: isMe ? '#fff' : '#000',
          borderRadius: '12px',
          border: isMe ? 'none' : '1px solid #ddd',
          wordBreak: 'break-word'
        }}>
          {message.type === 'TEXT' && (
            <div data-testid="message-content">{message.content}</div>
          )}
          
          {message.type === 'IMAGE' && (
            <div>
              <img
                src={message.content}
                alt="分享的图片"
                style={{
                  maxWidth: '100%',
                  borderRadius: '8px',
                  display: 'block'
                }}
                data-testid="image-preview"
              />
            </div>
          )}
          
          {message.type === 'VIDEO' && (
            <div>
              <video
                src={message.content}
                controls
                style={{
                  maxWidth: '100%',
                  borderRadius: '8px',
                  display: 'block'
                }}
                data-testid="video-player"
              />
            </div>
          )}
          
          {message.type === 'AUDIO' && (
            <div>
              <audio
                src={message.content}
                controls
                style={{
                  width: '100%'
                }}
                data-testid="audio-player"
              />
            </div>
          )}
        </div>

        {/* Timestamp and Status */}
        <div style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '4px',
          paddingLeft: isMe ? '0' : '12px',
          paddingRight: isMe ? '12px' : '0',
          textAlign: isMe ? 'right' : 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: isMe ? 'flex-end' : 'flex-start'
        }}>
          <span data-testid="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {isMe && message.status && (
            <span 
              data-testid="message-status"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                color: message.status === 'failed' ? '#f44336' : 
                       message.status === 'sending' ? '#ff9800' : '#4caf50'
              }}
            >
              {message.status === 'sending' && (
                <>
                  <ClockIcon size={12} color="#ff9800" />
                  <span>发送中</span>
                </>
              )}
              {message.status === 'sent' && (
                <>
                  <CheckIcon size={12} color="#4caf50" />
                  <span>已发送</span>
                </>
              )}
              {message.status === 'failed' && (
                <>
                  <ErrorIcon size={12} color="#f44336" />
                  <span>失败</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
