import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ChatIcon } from './Icons';
import { cn } from '../utils/cn';

interface LoginScreenProps {
  onLogin: (userId: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('用户ID不能为空');
      return;
    }
    setError('');
    onLogin(userId.trim());
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-cream to-warmgray flex items-center justify-center">
      {/* 动态艺术背景 */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-sage-200 blur-[100px] animate-blob" />
        <div className="absolute top-[50%] right-[5%] w-[35%] h-[35%] rounded-full bg-rose-200 blur-[80px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[10%] left-[30%] w-[45%] h-[45%] rounded-full bg-amber-100 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      {/* 登录卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="glass rounded-3xl p-8 shadow-xl">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            className="flex flex-col items-center mb-10"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-400 to-sage-500 flex items-center justify-center mb-4 shadow-lg">
              <ChatIcon size={36} color="white" />
            </div>
            <h1 className="text-2xl font-medium text-gray-800 tracking-wider">智聊</h1>
            <p className="mt-2 text-sm text-gray-500 tracking-wide">开启一段美好的对话</p>
          </motion.div>

          
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label 
                htmlFor="userId" 
                className="block mb-2 text-sm font-medium text-gray-600 tracking-wide"
              >
                用户ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="请输入您的用户ID"
                className={cn(
                  "w-full px-4 py-3.5 rounded-2xl text-base outline-none transition-all duration-300",
                  "bg-white/60 backdrop-blur-sm border",
                  "placeholder-gray-400 text-gray-700",
                  isFocused 
                    ? "border-sage-300 shadow-md shadow-sage-100/50" 
                    : "border-white/50"
                )}
                autoFocus
              />
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2 pl-1"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={cn(
                "w-full py-3.5 rounded-2xl text-base font-medium tracking-wider",
                "bg-gradient-to-r from-sage-400 to-sage-500 text-white",
                "shadow-lg shadow-sage-200/50 hover:shadow-xl hover:shadow-sage-200/60",
                "transition-all duration-300"
              )}
            >
              开始聊天
            </motion.button>
          </form>

          {/* 装饰性文字 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-xs text-gray-400 tracking-widest"
          >
            · 简约 · 优雅 · 畅聊 ·
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
