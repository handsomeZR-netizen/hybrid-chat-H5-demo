import { useState, type FormEvent } from 'react';
import { ChatIcon } from './Icons';

interface LoginScreenProps {
  onLogin: (userId: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // 验证：用户ID不能为空或只有空格
    if (!userId.trim()) {
      setError('用户ID不能为空');
      return;
    }

    setError('');
    onLogin(userId.trim());
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '480px',
      height: '100vh',
      padding: '20px',
      backgroundColor: '#fff',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        width: '100%',
        padding: '24px'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <ChatIcon size={36} color="white" />
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600',
            color: '#333'
          }}>
            智聊
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: '14px',
            color: '#666'
          }}>
            输入用户ID开始聊天
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="userId" 
              style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#333'
              }}
            >
              用户ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="请输入您的用户ID"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              autoFocus
            />
            {error && (
              <div 
                style={{ 
                  color: '#d32f2f', 
                  fontSize: '13px', 
                  marginTop: '8px' 
                }}
              >
                {error}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
