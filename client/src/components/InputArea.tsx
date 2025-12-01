import { useState, useRef, type FormEvent } from 'react';
import type { ConnectionStatus, MessageType } from '../types';
import { ImageIcon, VideoIcon, AudioIcon, SendIcon } from './Icons';

interface InputAreaProps {
  connectionStatus: ConnectionStatus;
  onSendMessage: (content: string) => void;
  onSendMediaMessage: (content: string, type: MessageType) => void;
}

// Declare AndroidInterface type for JSBridge
declare global {
  interface Window {
    AndroidInterface?: {
      chooseFile: (type: string) => string;
      getDeviceInfo: () => string;
      showToast: (message: string) => void;
    };
  }
}

export function InputArea({ connectionStatus, onSendMessage, onSendMediaMessage }: InputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMediaType, setPendingMediaType] = useState<'image' | 'video' | 'audio' | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate: message cannot be empty or only whitespace
    if (!inputValue.trim()) {
      return;
    }

    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleMediaSelect = async (mediaType: 'image' | 'video' | 'audio') => {
    // Try JSBridge first (Android environment)
    if (window.AndroidInterface && window.AndroidInterface.chooseFile) {
      try {
        const result = window.AndroidInterface.chooseFile(mediaType);
        
        if (result && result.trim()) {
          // Determine message type based on media type
          let messageType: MessageType;
          if (mediaType === 'image') {
            messageType = 'IMAGE';
          } else if (mediaType === 'video') {
            messageType = 'VIDEO';
          } else {
            messageType = 'AUDIO';
          }
          
          onSendMediaMessage(result, messageType);
        }
      } catch (error) {
        console.error('JSBridge error:', error);
        // Fall back to file input
        fallbackToFileInput(mediaType);
      }
    } else {
      // Fall back to file input for browser environment
      fallbackToFileInput(mediaType);
    }
  };

  const fallbackToFileInput = (mediaType: 'image' | 'video' | 'audio') => {
    setPendingMediaType(mediaType);
    if (fileInputRef.current) {
      // Set accept attribute based on media type
      if (mediaType === 'image') {
        fileInputRef.current.accept = 'image/*';
      } else if (mediaType === 'video') {
        fileInputRef.current.accept = 'video/*';
      } else {
        fileInputRef.current.accept = 'audio/*';
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingMediaType) {
      return;
    }

    try {
      // Read file and convert to Base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        
        // Determine message type
        let messageType: MessageType;
        if (pendingMediaType === 'image') {
          messageType = 'IMAGE';
        } else if (pendingMediaType === 'video') {
          messageType = 'VIDEO';
        } else {
          messageType = 'AUDIO';
        }
        
        onSendMediaMessage(base64, messageType);
        setPendingMediaType(null);
      };
      
      reader.onerror = () => {
        console.error('File reading error');
        setPendingMediaType(null);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      setPendingMediaType(null);
    }
    
    // Reset file input
    e.target.value = '';
  };

  const isDisabled = connectionStatus !== 'connected';
  const canSend = !isDisabled && inputValue.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '15px 20px',
        borderTop: '1px solid #ddd',
        backgroundColor: '#fff',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}
      data-testid="input-area"
    >
      {/* Hidden file input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        data-testid="file-input"
      />
      
      {/* Media buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          type="button"
          onClick={() => handleMediaSelect('image')}
          disabled={isDisabled}
          data-testid="image-button"
          title="发送图片"
          style={{
            padding: '10px',
            backgroundColor: isDisabled ? '#f5f5f5' : '#fff',
            color: isDisabled ? '#bbb' : '#1976d2',
            border: '1px solid #e0e0e0',
            borderRadius: '50%',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          <ImageIcon size={20} color={isDisabled ? '#bbb' : '#1976d2'} />
        </button>
        
        <button
          type="button"
          onClick={() => handleMediaSelect('video')}
          disabled={isDisabled}
          data-testid="video-button"
          title="发送视频"
          style={{
            padding: '10px',
            backgroundColor: isDisabled ? '#f5f5f5' : '#fff',
            color: isDisabled ? '#bbb' : '#1976d2',
            border: '1px solid #e0e0e0',
            borderRadius: '50%',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          <VideoIcon size={20} color={isDisabled ? '#bbb' : '#1976d2'} />
        </button>
        
        <button
          type="button"
          onClick={() => handleMediaSelect('audio')}
          disabled={isDisabled}
          data-testid="audio-button"
          title="发送语音"
          style={{
            padding: '10px',
            backgroundColor: isDisabled ? '#f5f5f5' : '#fff',
            color: isDisabled ? '#bbb' : '#1976d2',
            border: '1px solid #e0e0e0',
            borderRadius: '50%',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          <AudioIcon size={20} color={isDisabled ? '#bbb' : '#1976d2'} />
        </button>
      </div>
      
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="输入消息..."
        disabled={isDisabled}
        data-testid="message-input"
        style={{
          flex: 1,
          padding: '10px 15px',
          border: '1px solid #ddd',
          borderRadius: '20px',
          fontSize: '14px',
          outline: 'none'
        }}
      />
      <button
        type="submit"
        disabled={!canSend}
        data-testid="send-button"
        style={{
          padding: '12px',
          backgroundColor: canSend ? '#1976d2' : '#e0e0e0',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: canSend ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
      >
        <SendIcon size={20} color="white" />
      </button>
    </form>
  );
}
