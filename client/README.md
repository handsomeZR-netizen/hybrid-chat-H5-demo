# Hybrid Chat Application - React Frontend

React-based web frontend for the hybrid chat application, built with Vite and TypeScript.

## Features

✅ **Web 功能:**
- 登录界面（用户 ID 验证）
- 聊天界面（消息显示）
- WebSocket 连接管理
- 自动重连（指数退避算法）
- 连接状态指示器
- 消息输入与验证
- 响应式 UI 设计
- 多媒体消息（图片、视频、音频）
- 历史消息懒加载

✅ **Android 原生集成:**
- 原生文件选择器（替代 `<input type="file">`）
- SQLite 本地存储（替代 localStorage）
- JSBridge 双向通信
- 自动环境检测与降级

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── LoginScreen.tsx       # 登录界面
│   │   ├── ChatScreen.tsx        # 聊天界面
│   │   ├── MessageBubble.tsx     # 消息气泡
│   │   ├── InputArea.tsx         # 输入区域（集成 Android 文件选择器）
│   │   └── Icons.tsx             # 图标组件
│   ├── utils/
│   │   ├── websocket.ts          # WebSocket 连接管理
│   │   ├── androidStorage.ts     # Android SQLite 存储适配器
│   │   └── cn.ts                 # 样式工具
│   ├── test/
│   │   ├── setup.ts              # 测试配置
│   │   ├── login-connection.test.tsx
│   │   ├── message-functionality.test.tsx
│   │   ├── history-loading.test.tsx
│   │   ├── media-messages.test.tsx
│   │   └── ui-state.test.tsx
│   ├── types.ts                  # TypeScript 类型定义
│   ├── App.tsx                   # 主应用组件
│   └── main.tsx                  # 应用入口
├── vitest.config.ts              # Vitest 配置
└── package.json
```

## Installation

```bash
cd client
npm install
```

## Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

## Building

```bash
npm run build
```

## Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Property-Based Tests

The project includes property-based tests using fast-check to verify correctness properties:

✅ **Property 2: Empty user ID is rejected** - Validates that whitespace-only user IDs are rejected (Requirements 1.4)
✅ **Property 3: Connection loss triggers reconnection** - Validates automatic reconnection (Requirements 1.5)
⚠️ **Property 1: Login establishes connection and sends correct message** - In progress (Requirements 1.1, 1.2)

## Configuration

Create a `.env` file based on `.env.example`:

```bash
VITE_WS_URL=ws://localhost:8080
```

## WebSocket Protocol

The frontend communicates with the WebSocket server using JSON messages:

### LOGIN Message
```json
{
  "type": "LOGIN",
  "userId": "user_123"
}
```

### TEXT Message
```json
{
  "type": "TEXT",
  "id": "uuid-timestamp",
  "senderId": "user_123",
  "content": "Hello, World!",
  "timestamp": 1716283992000
}
```

### GET_HISTORY Request
```json
{
  "type": "GET_HISTORY",
  "lastMessageId": "uuid-timestamp",
  "limit": 20
}
```

## Components

### LoginScreen
- User ID input with validation
- Prevents empty/whitespace-only user IDs
- Clean, centered layout

### ChatScreen
- Message list with auto-scroll
- Connection status indicator
- Message input area
- Logout functionality
- Scroll-to-load history (framework in place)

### WebSocketManager
- Connection management
- Automatic reconnection with exponential backoff
- Event-based message handling
- Connection state tracking

## Android 集成

### 使用 Android 原生功能

应用会自动检测运行环境，在 Android WebView 中使用原生能力：

```typescript
import { storage } from './utils/androidStorage';

// 自动选择 SQLite 或 localStorage
storage.saveMessage(message);
const messages = storage.getMessages(50);

// 检测环境
if (window.AndroidInterface?.chooseFileAsync) {
  // 使用 Android 原生文件选择器
  window.AndroidInterface.chooseFileAsync('image', 'onFileSelected');
} else {
  // 降级到 Web 文件选择器
  input.click();
}
```

### 相关文档

- [Android 功能使用示例](../android/FEATURES_USAGE.md) - 快速上手
- [Android 功能详解](../android/ANDROID_FEATURES.md) - 完整 API
- [Android 部署指南](../android/DEPLOYMENT_GUIDE.md) - 部署步骤

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **fast-check** - Property-based testing
- **Testing Library** - Component testing utilities
