import 'dotenv/config';
import { WebSocketServer } from './WebSocketServer.js';

const PORT = process.env.PORT || 8080;
const STORAGE_MODE = process.env.STORAGE_MODE || 'file';

// 根据配置选择存储模式
const storageConfig = {
  mode: STORAGE_MODE,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
};

const server = new WebSocketServer(PORT, storageConfig);

// 启动服务器（异步）
(async () => {
  try {
    await server.start();
    console.log(`Storage mode: ${STORAGE_MODE}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.stop();
  process.exit(0);
});
