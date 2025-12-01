import { useState, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConnectionStatus, MessageType } from '../types';
import { ImageIcon, VideoIcon, AudioIcon, SendIcon } from './Icons';
import { cn } from '../utils/cn';

interface InputAreaProps {
  connectionStatus: ConnectionStatus;
  onSendMessage: (content: string) => void;
  onSendMediaMessage: (content: string, type: MessageType) => void;
}

declare global {
  interface Window {
    AndroidInterface?: {
      chooseFile: (type: string) => string;
      chooseFileAsync: (type: string, callback: string) => void;
      getDeviceInfo: () => string;
      showToast: (message: string) => void;
      saveMessage: (messageJson: string) => string;
      getMessages: (limit: number) => string;
      getMessagesBefore: (beforeTimestamp: number, limit: number) => string;
      clearMessages: () => string;
    };
    onFileSelected?: (result: any) => void;
  }
}

export function InputArea({ connectionStatus, onSendMessage, onSendMediaMessage }: InputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMediaType, setPendingMediaType] = useState<'image' | 'video' | 'audio' | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleMediaSelect = async (mediaType: 'image' | 'video' | 'audio') => {
    // 优先使用 Android 原生文件选择器
    if (window.AndroidInterface?.chooseFileAsync) {
      try {
        // 设置全局回调函数
        window.onFileSelected = (result: any) => {
          try {
            const data = typeof result === 'string' ? JSON.parse(result) : result;
            if (data.success && data.data) {
              const messageType: MessageType = mediaType === 'image' ? 'IMAGE' : mediaType === 'video' ? 'VIDEO' : 'AUDIO';
              onSendMediaMessage(data.data, messageType);
            } else {
              console.error('File selection failed:', data.error);
              if (window.AndroidInterface?.showToast) {
                window.AndroidInterface.showToast(data.error || '文件选择失败');
              }
            }
          } catch (e) {
            console.error('Error processing file result:', e);
          }
        };
        
        // 调用 Android 异步文件选择器
        window.AndroidInterface.chooseFileAsync(mediaType, 'onFileSelected');
      } catch (error) {
        console.error('Android file picker error:', error);
        fallbackToFileInput(mediaType);
      }
    } else {
      // 降级到 Web 文件选择器
      fallbackToFileInput(mediaType);
    }
  };

  const fallbackToFileInput = (mediaType: 'image' | 'video' | 'audio') => {
    setPendingMediaType(mediaType);
    if (fileInputRef.current) {
      fileInputRef.current.accept = mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'audio/*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingMediaType) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const messageType: MessageType = pendingMediaType === 'image' ? 'IMAGE' : pendingMediaType === 'video' ? 'VIDEO' : 'AUDIO';
      onSendMediaMessage(base64, messageType);
      setPendingMediaType(null);
    };
    reader.onerror = () => setPendingMediaType(null);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isDisabled = connectionStatus !== 'connected';
  const canSend = !isDisabled && inputValue.trim().length > 0;


  return (
    <motion.form
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onSubmit={handleSubmit}
      className={cn(
        "flex items-end gap-2 p-3 rounded-3xl transition-all duration-300",
        "bg-white/80 backdrop-blur-xl border shadow-lg",
        isFocused ? "border-sage-300 shadow-sage-100" : "border-white/50"
      )}
      data-testid="input-area"
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        data-testid="file-input"
      />
      
      {/* 媒体按钮组 */}
      <div className="flex gap-1 pl-1 pb-0.5">
        <MediaButton
          icon={<ImageIcon size={18} color={isDisabled ? '#d1d5db' : '#8AA29E'} />}
          onClick={() => handleMediaSelect('image')}
          disabled={isDisabled}
          testId="image-button"
          title="发送图片"
        />
        <MediaButton
          icon={<VideoIcon size={18} color={isDisabled ? '#d1d5db' : '#8AA29E'} />}
          onClick={() => handleMediaSelect('video')}
          disabled={isDisabled}
          testId="video-button"
          title="发送视频"
        />
        <MediaButton
          icon={<AudioIcon size={18} color={isDisabled ? '#d1d5db' : '#8AA29E'} />}
          onClick={() => handleMediaSelect('audio')}
          disabled={isDisabled}
          testId="audio-button"
          title="发送语音"
        />
      </div>
      
      {/* 输入框 */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="写下你的想法..."
        disabled={isDisabled}
        data-testid="message-input"
        className={cn(
          "flex-1 bg-transparent border-none outline-none py-2 px-1",
          "text-gray-700 placeholder-gray-400 text-sm tracking-wide",
          "disabled:text-gray-300"
        )}
      />
      
      {/* 发送按钮 */}
      <AnimatePresence>
        {canSend && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            type="submit"
            data-testid="send-button"
            className="p-2.5 bg-gradient-to-br from-sage-400 to-sage-500 rounded-full text-white shadow-md hover:shadow-lg transition-shadow active:scale-95"
          >
            <SendIcon size={18} color="white" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {!canSend && (
        <button
          type="submit"
          disabled
          data-testid="send-button"
          className="p-2.5 bg-gray-200 rounded-full text-white cursor-not-allowed"
        >
          <SendIcon size={18} color="#d1d5db" />
        </button>
      )}
    </motion.form>
  );
}

// 媒体按钮子组件
function MediaButton({ 
  icon, 
  onClick, 
  disabled, 
  testId, 
  title 
}: { 
  icon: React.ReactNode; 
  onClick: () => void; 
  disabled: boolean; 
  testId: string; 
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      title={title}
      className={cn(
        "p-2 rounded-full transition-all duration-200",
        disabled 
          ? "bg-gray-100 cursor-not-allowed" 
          : "bg-transparent hover:bg-sage-50 active:scale-95"
      )}
    >
      {icon}
    </button>
  );
}
