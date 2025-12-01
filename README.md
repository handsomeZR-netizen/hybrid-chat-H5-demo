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

- 🎨 **文艺风格 UI** - 莫兰迪配色、磨砂玻璃效果、霞鹜文楷字体
- 💬 **实时聊天** - WebSocket 双向通信
- 📷 **多媒体消息** - 支持图片、视频、音频
- 📜 **历史记录** - 滚动加载聊天历史
- 🔄 **断线重连** - 自动重连机制
- 📱 **混合开发** - Web + Android 原生

## 运行测试

```bash
# 后端测试
npm test

# 前端测试
cd client && npm test
```

## 相关文档

- [功能说明](doc/FEATURES.md)
- [Supabase 配置](doc/SUPABASE_SETUP.md)
- [Android 快速开始](android/QUICKSTART.md)
- [更新日志](doc/CHANGELOG.md)

## License

MIT
