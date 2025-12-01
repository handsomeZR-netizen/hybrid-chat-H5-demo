# 智聊 - Hybrid Chat App

一款文艺风格的实时聊天应用，支持 Web 端和 Android 原生端。

## 技术栈

### 前端

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.17-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.23.24-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Vitest](https://img.shields.io/badge/Vitest-4.0.14-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

### 后端

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/ws-8.14.2-010101?style=flat-square&logo=websocket&logoColor=white)](https://github.com/websockets/ws)
[![Supabase](https://img.shields.io/badge/Supabase-2.86.0-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Jest](https://img.shields.io/badge/Jest-29.7.0-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)

### 移动端

[![Android](https://img.shields.io/badge/Android-SDK_24+-3DDC84?style=flat-square&logo=android&logoColor=white)](https://developer.android.com/)
[![WebView](https://img.shields.io/badge/WebView-Hybrid-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.android.com/reference/android/webkit/WebView)

## 项目结构

```
├── client/                 # Web 前端 (React + Vite)
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── utils/          # 工具函数
│   │   └── test/           # 测试文件
│   └── package.json
├── src/                    # 后端服务
│   ├── server.js           # 入口文件
│   ├── WebSocketServer.js  # WebSocket 服务
│   ├── MessageHandler.js   # 消息处理
│   ├── SessionManager.js   # 会话管理
│   └── StorageService.js   # 存储服务
├── android/                # Android 原生端
│   └── app/
├── __tests__/              # 后端测试
├── data/                   # 本地数据存储
└── doc/                    # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
# 后端依赖
npm install

# 前端依赖
cd client && npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置 Supabase 连接信息（可选）。

### 3. 启动服务

```bash
# 启动 WebSocket 服务器 (默认端口 8080)
npm start

# 启动前端开发服务器 (新终端)
cd client && npm run dev
```

### 4. 访问应用

打开浏览器访问 `http://localhost:5173`

## 功能特性

### Web 端
- 🎨 **文艺风格 UI** - 莫兰迪配色、磨砂玻璃效果、霞鹜文楷字体
- � ***实时聊天** - WebSocket 双向通信
- � **历多媒体消息** - 支持图片、视频、音频
- � ***历史记录** - 滚动加载聊天历史
- � **断线开重连** - 自动重连机制（指数退避算法）

### Android 原生能力
- 📱 **原生文件选择器** - 使用 Android 系统文件选择器，替代 Web `<input type="file">`
  - 支持图片、视频、音频选择
  - 自动图片压缩（最大 1920px，质量 85%）
  - 文件大小限制（10MB）
  - Base64 编码返回
- 💾 **SQLite 本地存储** - 替代 localStorage，提供更强大的数据管理
  - 无存储容量限制（不受 5MB 限制）
  - 支持复杂查询和索引
  - 分页加载历史消息
  - 自动清理旧消息
- 🔗 **JSBridge 通信** - Web 与 Android 原生双向通信
- 🔐 **权限管理** - 自动处理 Android 运行时权限

## 运行测试

```bash
# 后端测试
npm test

# 前端测试
cd client && npm test
```

## Android 部署

### 快速开始

1. **安装 Android Studio**：https://developer.android.com/studio
2. **打开项目**：在 Android Studio 中打开 `android` 目录
3. **同步 Gradle**：等待依赖下载完成
4. **运行应用**：点击 Run 按钮或按 Shift+F10

### 使用 Android 原生功能

在 Android 环境中，应用会自动使用原生能力：

```javascript
// 使用原生文件选择器（自动图片压缩）
window.onFileSelected = (result) => {
  const data = JSON.parse(result);
  if (data.success) {
    console.log('文件 Base64:', data.data);
  }
};
window.AndroidInterface.chooseFileAsync('image', 'onFileSelected');

// 使用 SQLite 存储（无容量限制）
import { storage } from './utils/androidStorage';
storage.saveMessage(message);
const messages = storage.getMessages(50);
```

**快速开始：** [Android 功能使用示例](android/FEATURES_USAGE.md) ⚡

详细文档：
- 📱 [Android 完整部署指南](android/DEPLOYMENT_GUIDE.md) - **推荐新手阅读**
- ✨ [Android 原生功能使用指南](android/ANDROID_FEATURES.md) - **功能详解**
- 🚀 [快速开始](android/QUICKSTART.md)
- 📖 [Android 项目说明](android/README.md)

## 技术亮点

### 前端架构
- **React 19** + **TypeScript** - 类型安全的现代前端开发
- **Vite** - 极速的开发体验和构建性能
- **Tailwind CSS 4** - 原子化 CSS，高度可定制
- **Framer Motion** - 流畅的动画效果
- **Property-Based Testing** - 使用 fast-check 进行属性测试

### 后端架构
- **WebSocket** - 低延迟的实时双向通信
- **双存储模式** - 支持文件存储和 Supabase 云存储
- **会话管理** - 用户在线状态追踪
- **消息持久化** - 可靠的消息存储和历史查询

### 混合开发
- **WebView + JSBridge** - Web 与原生无缝通信
- **原生能力增强** - 文件选择器、SQLite 存储
- **统一接口** - 自动检测环境，降级到 Web API
- **权限管理** - Android 运行时权限自动处理

## 相关文档

### 通用文档
- [功能说明](doc/FEATURES.md)
- [Supabase 配置](doc/SUPABASE_SETUP.md)
- [更新日志](doc/CHANGELOG.md)

### Android 文档
- [Android 功能使用示例](android/FEATURES_USAGE.md) ⚡ - 快速上手
- [Android 原生功能详解](android/ANDROID_FEATURES.md) 📖 - 完整 API
- [Android 实现状态](android/IMPLEMENTATION_STATUS.md) ✅ - 功能清单
- [Android 部署指南](android/DEPLOYMENT_GUIDE.md) 📱 - 部署步骤
- [Android 快速开始](android/QUICKSTART.md) 🚀 - 5 分钟上手

## License

MIT
