# Hybrid Chat Application

混合聊天应用 - 结合 H5/Web 技术与原生 Android 能力的实时通信系统。

## 🚀 项目亮点

- 💬 **实时群聊** - 基于 WebSocket 的多人实时通信
- 📱 **跨平台** - Web + Android 混合开发架构
- 🎨 **现代 UI** - React + TypeScript 构建的响应式界面
- 📦 **多媒体支持** - 图片、视频、音频消息发送
- 🔄 **懒加载** - 智能历史消息加载
- 💾 **双存储模式** - 本地文件存储 / Supabase 云存储
- 🔌 **JSBridge** - Web 与原生 Android 能力互通

## 项目组成

- **Node.js WebSocket 服务器** - 实时消息服务器
- **React Web 前端** - 聊天界面（TypeScript + Vite）
- **Android WebView 应用** - 原生容器与 JSBridge

## ✨ 功能特性

### 核心功能
- ✅ **实时通信** - WebSocket 连接管理与消息广播
- ✅ **多人群聊** - 支持多用户同时在线聊天
- ✅ **用户会话管理** - 用户 ID 到 WebSocket 的映射
- ✅ **在线状态** - 用户加入/离开实时通知
- ✅ **连接管理** - 自动重连、心跳检测、会话清理

### 消息功能
- ✅ **文本消息** - 支持文本聊天
- ✅ **多媒体消息** - 图片、视频、音频发送
- ✅ **系统通知** - 用户加入/离开提示
- ✅ **消息状态** - 发送中、已发送、失败状态显示
- ✅ **消息重试** - 失败消息可重新发送

### 数据管理
- ✅ **自动加载历史** - 登录后自动加载最近 50 条聊天记录
- ✅ **历史记录懒加载** - 滚动到顶部自动加载更早的消息
- ✅ **持久化存储** - 支持本地文件存储或 Supabase 云存储
- ✅ **消息追溯** - 完整的聊天记录保存与查询
- ✅ **多设备同步** - 使用 Supabase 实现跨设备消息同步

### 原生能力（Android）
- ✅ **JSBridge** - Web 与 Android 原生通信
- ✅ **文件选择** - 调用原生文件选择器
- ✅ **权限管理** - 相机、存储、录音权限处理
- ✅ **设备信息** - 获取设备型号等信息

## 项目结构

```
├── src/                    # Node.js 服务器
│   ├── server.js           # 服务器入口
│   ├── WebSocketServer.js  # WebSocket 服务器主类
│   ├── SessionManager.js   # 会话管理器
│   ├── MessageHandler.js   # 消息处理器
│   ├── StorageService.js   # 文件存储服务
│   └── SupabaseStorageService.js  # Supabase 存储服务
├── supabase/               # Supabase 配置
│   └── schema.sql          # 数据库表结构
├── client/                 # React Web 前端
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── utils/          # WebSocket 工具
│   │   └── test/           # 前端测试
│   └── package.json
├── android/                # Android WebView 应用
│   ├── app/
│   │   └── src/main/java/com/hybridchat/app/
│   │       ├── MainActivity.java       # 主 Activity
│   │       ├── AndroidInterface.java   # JSBridge 接口
│   │       ├── PermissionManager.java  # 权限管理
│   │       └── FilePickerHelper.java   # 文件选择
│   └── README.md           # Android 详细文档
├── __tests__/              # 服务器测试
└── .kiro/specs/            # 功能规格文档
```

## 🛠️ 技术栈

### 后端
- Node.js + WebSocket (ws)
- Supabase (可选云存储)
- Jest + fast-check (属性测试)

### 前端
- React 19 + TypeScript
- Vite (构建工具)
- Vitest (测试框架)

### 移动端
- Android WebView
- Java (原生代码)
- JSBridge (Web-Native 通信)

## 📦 安装与运行

### 1. 安装依赖

```bash
# 安装服务端依赖
npm install

# 安装客户端依赖
cd client
npm install
cd ..
```

### 2. 配置存储模式

#### 方式 A: 使用文件存储（默认，无需配置）

直接启动即可，消息将保存在 `./data/messages.json`

#### 方式 B: 使用 Supabase 云存储（推荐生产环境）

1. 阅读配置指南：[SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. 创建 `.env` 文件：

```bash
cp .env.example .env
```

3. 编辑 `.env` 文件：

```env
# 存储模式：file 或 supabase
STORAGE_MODE=supabase

# Supabase 配置
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:8080` 启动（可通过 `PORT` 环境变量修改）。

### 4. 启动 Web 前端

```bash
cd client
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 5. 运行测试

```bash
# 服务端测试
npm test

# 客户端测试
cd client
npm test
```

## 属性测试

项目使用 fast-check 进行属性测试，验证以下正确性属性：

- **属性 4**: 消息广播排除发送者
- **属性 8**: 多用户连接独立维护
- **属性 10**: 用户加入广播通知
- **属性 11**: 用户离开广播通知
- **属性 23**: 连接关闭清理会话

所有属性测试运行 100 次迭代以确保系统正确性。

## WebSocket 消息协议

### LOGIN 消息
```json
{
  "type": "LOGIN",
  "userId": "user_123"
}
```

### TEXT 消息
```json
{
  "type": "TEXT",
  "id": "uuid-timestamp",
  "senderId": "user_123",
  "content": "Hello, World!",
  "timestamp": 1716283992000
}
```

### SYSTEM 消息
```json
{
  "type": "SYSTEM",
  "id": "uuid-timestamp",
  "content": "User_123 joined the chat",
  "timestamp": 1716283992000
}
```

## 📱 Android 应用

### 快速开始

详细步骤请参考 [android/QUICKSTART.md](android/QUICKSTART.md)

简要步骤：
1. 在 Android Studio 中打开 `android/` 目录
2. 同步 Gradle 依赖
3. 配置开发服务器 URL
   - 真机：`http://your-ip:5173`
   - 模拟器：`http://10.0.2.2:5173`
4. 运行应用

### JSBridge API

Web 层可通过 `window.AndroidInterface` 调用原生功能：

```javascript
// 获取设备信息
const deviceInfo = window.AndroidInterface.getDeviceInfo();

// 显示原生 Toast
window.AndroidInterface.showToast("Hello from Web!");

// 选择文件（返回 Base64）
const base64Data = window.AndroidInterface.chooseFile("image"); // image/video/audio
```

详细文档：[android/README.md](android/README.md)

## 🗄️ 数据库表结构（Supabase）

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- TEXT, IMAGE, VIDEO, AUDIO, SYSTEM
  sender_id TEXT,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

完整 SQL 脚本：[supabase/schema.sql](supabase/schema.sql)

## 🧪 测试

项目使用属性测试（Property-Based Testing）验证系统正确性：

### 核心属性
- **属性 4**: 消息广播排除发送者
- **属性 8**: 多用户连接独立维护
- **属性 10**: 用户加入广播通知
- **属性 11**: 用户离开广播通知
- **属性 19**: 消息持久化往返一致性
- **属性 20**: 历史消息按时间顺序返回
- **属性 23**: 连接关闭清理会话

每个属性测试运行 100 次迭代以确保系统正确性。

```bash
# 运行所有测试
npm test

# 运行集成测试
npm test -- integration-e2e

# 运行存储测试
npm test -- storage
```

## 📚 文档

- [Supabase 配置指南](SUPABASE_SETUP.md) - 云存储配置详细步骤
- [Android 快速开始](android/QUICKSTART.md) - Android 应用运行指南
- [Android 详细文档](android/README.md) - JSBridge 和原生功能说明
- [任务计划](.kiro/specs/hybrid-chat-app/tasks.md) - 完整实现计划

## 🎯 使用场景

- 企业内部即时通讯
- 在线客服系统
- 社区聊天室
- 教育培训互动
- 游戏内聊天

## 🔧 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | `8080` |
| `STORAGE_MODE` | 存储模式 | `file` |
| `SUPABASE_URL` | Supabase 项目 URL | - |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | - |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
