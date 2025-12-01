# Android 原生功能集成指南

本文档介绍如何使用 Android 提供的原生能力，包括文件选择器和 SQLite 数据库存储。

## 功能概览

### 1. 原生文件选择器 ✨

使用 Android 系统的原生文件选择器，替代 Web 的 `<input type="file">`，提供更好的用户体验。

**优势：**
- 🎨 原生 UI，符合 Android 设计规范
- 📱 支持系统相册、文件管理器
- 🖼️ 自动图片压缩（最大 1920px，质量 85%）
- 📏 文件大小限制（10MB）
- ⚡ 更快的文件访问速度

### 2. SQLite 本地存储 💾

使用 SQLite 数据库替代 localStorage，提供更强大的数据管理能力。

**优势：**
- 💪 更大的存储容量（不受 5MB 限制）
- 🔍 支持复杂查询和索引
- 📊 结构化数据存储
- ⚡ 更快的读写性能
- 🔄 支持分页加载

---

## 使用方法

### 文件选择器

#### JavaScript 调用示例

```javascript
// 设置文件选择回调
window.onFileSelected = function(result) {
  const data = JSON.parse(result);
  
  if (data.success) {
    // data.data 是 Base64 编码的 data URI
    // 格式: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    console.log('文件选择成功:', data.data);
    
    // 可以直接用于 <img> 标签
    document.getElementById('preview').src = data.data;
    
    // 或发送到服务器
    sendToServer(data.data);
  } else {
    console.error('文件选择失败:', data.error);
  }
};

// 调用 Android 文件选择器
// 参数1: 文件类型 ("image", "video", "audio")
// 参数2: 回调函数名
window.AndroidInterface.chooseFileAsync("image", "onFileSelected");
```

#### React/TypeScript 示例

```typescript
// 在组件中使用
const handleSelectImage = () => {
  if (!window.AndroidInterface?.chooseFileAsync) {
    console.log('Not in Android environment');
    return;
  }

  // 设置回调
  window.onFileSelected = (result: any) => {
    const data = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (data.success) {
      // 处理选中的文件
      setImageData(data.data);
    } else {
      alert(data.error);
    }
  };

  // 调用选择器
  window.AndroidInterface.chooseFileAsync('image', 'onFileSelected');
};
```

#### 支持的文件类型

| 类型 | 说明 | MIME Type |
|------|------|-----------|
| `image` | 图片文件 | `image/*` |
| `video` | 视频文件 | `video/*` |
| `audio` | 音频文件 | `audio/*` |

---

### SQLite 数据库存储

#### 保存消息

```javascript
// 保存单条消息
const message = {
  id: "msg-123",
  type: "TEXT",
  senderId: "user1",
  content: "Hello World",
  timestamp: Date.now(),
  status: "sent",
  avatarColor: "#8AA29E"
};

const result = window.AndroidInterface.saveMessage(JSON.stringify(message));
const data = JSON.parse(result);

if (data.success) {
  console.log('消息保存成功');
}
```

#### 获取消息

```javascript
// 获取所有消息
const allMessages = JSON.parse(
  window.AndroidInterface.getMessages(0)
);

// 获取最近 50 条消息
const recentMessages = JSON.parse(
  window.AndroidInterface.getMessages(50)
);

// 获取指定时间之前的消息（分页加载）
const olderMessages = JSON.parse(
  window.AndroidInterface.getMessagesBefore(
    1234567890000, // 时间戳
    20             // 数量
  )
);
```

#### 清除消息

```javascript
// 清除所有消息
const result = window.AndroidInterface.clearMessages();
const data = JSON.parse(result);

if (data.success) {
  console.log('消息已清除');
}
```

#### 使用统一存储接口

我们提供了一个统一的存储接口，自动选择 Android SQLite 或 localStorage：

```typescript
import { storage } from './utils/androidStorage';

// 保存消息（自动选择存储方式）
storage.saveMessage(message);

// 获取消息
const messages = storage.getMessages(50);

// 获取历史消息
const history = storage.getMessagesBefore(timestamp, 20);

// 清除消息
storage.clearMessages();

// 检查存储类型
const type = storage.getStorageType(); // "android-sqlite" 或 "localStorage"
```

---

## API 参考

### AndroidInterface.chooseFileAsync()

异步选择文件。

**参数：**
- `type: string` - 文件类型 ("image", "video", "audio")
- `callback: string` - JavaScript 回调函数名

**回调参数：**
```typescript
{
  success: boolean;
  data?: string;    // Base64 data URI (成功时)
  error?: string;   // 错误信息 (失败时)
}
```

**示例：**
```javascript
window.AndroidInterface.chooseFileAsync("image", "onFileSelected");
```

---

### AndroidInterface.saveMessage()

保存消息到数据库。

**参数：**
- `messageJson: string` - 消息的 JSON 字符串

**返回：**
```typescript
{
  success: boolean;
  data?: string;    // 成功消息
  error?: string;   // 错误信息
}
```

**示例：**
```javascript
const result = window.AndroidInterface.saveMessage(JSON.stringify(message));
```

---

### AndroidInterface.getMessages()

获取消息列表。

**参数：**
- `limit: number` - 最大数量（0 表示全部）

**返回：**
```typescript
Message[] // JSON 数组字符串
```

**示例：**
```javascript
const messages = JSON.parse(window.AndroidInterface.getMessages(50));
```

---

### AndroidInterface.getMessagesBefore()

获取指定时间之前的消息（用于分页）。

**参数：**
- `beforeTimestamp: number` - 时间戳（毫秒）
- `limit: number` - 最大数量

**返回：**
```typescript
Message[] // JSON 数组字符串
```

**示例：**
```javascript
const history = JSON.parse(
  window.AndroidInterface.getMessagesBefore(1234567890000, 20)
);
```

---

### AndroidInterface.clearMessages()

清除所有消息。

**返回：**
```typescript
{
  success: boolean;
  data?: string;
  error?: string;
}
```

**示例：**
```javascript
const result = window.AndroidInterface.clearMessages();
```

---

## 数据库结构

### messages 表

| 列名 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 消息 ID（主键）|
| type | TEXT | 消息类型 (TEXT/IMAGE/VIDEO/AUDIO/SYSTEM) |
| sender_id | TEXT | 发送者 ID |
| content | TEXT | 消息内容 |
| timestamp | INTEGER | 时间戳（毫秒）|
| status | TEXT | 状态 (sending/sent/failed) |
| avatar_color | TEXT | 头像颜色 |

**索引：**
- `idx_timestamp` - 时间戳索引（降序）
- `idx_sender` - 发送者索引

---

## 权限要求

### 文件选择器权限

在 `AndroidManifest.xml` 中已配置：

```xml
<!-- Android 12 及以下 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Android 13+ 细粒度权限 -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

应用会在首次使用时自动请求权限。

---

## 最佳实践

### 1. 错误处理

始终检查 Android 环境和错误：

```javascript
if (!window.AndroidInterface) {
  console.log('Not in Android environment, using fallback');
  // 使用 Web 文件选择器或 localStorage
  return;
}

try {
  const result = window.AndroidInterface.saveMessage(json);
  const data = JSON.parse(result);
  
  if (!data.success) {
    console.error('Operation failed:', data.error);
    // 处理错误
  }
} catch (error) {
  console.error('Exception:', error);
}
```

### 2. 降级方案

为非 Android 环境提供降级方案：

```javascript
function selectFile(type) {
  if (window.AndroidInterface?.chooseFileAsync) {
    // 使用 Android 原生选择器
    window.AndroidInterface.chooseFileAsync(type, 'onFileSelected');
  } else {
    // 降级到 Web 文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    input.click();
  }
}
```

### 3. 性能优化

- 使用分页加载历史消息，避免一次加载过多数据
- 定期清理旧消息（如 30 天前的消息）
- 图片自动压缩已内置，无需额外处理

### 4. 数据同步

建议策略：
1. 新消息先保存到本地数据库
2. 通过 WebSocket 发送到服务器
3. 服务器确认后更新消息状态

```javascript
// 保存并发送消息
async function sendMessage(message) {
  // 1. 保存到本地
  storage.saveMessage(message);
  
  // 2. 发送到服务器
  try {
    await websocket.send(message);
    message.status = 'sent';
  } catch (error) {
    message.status = 'failed';
  }
  
  // 3. 更新状态
  storage.saveMessage(message);
}
```

---

## 调试技巧

### 1. Chrome DevTools

在 Chrome 中访问 `chrome://inspect`，可以调试 WebView：

```javascript
// 在控制台测试
window.AndroidInterface.getDeviceInfo();
window.AndroidInterface.showToast("测试");
```

### 2. 日志输出

Android 日志会显示在 Logcat 中：

```bash
# 过滤 WebView 日志
adb logcat | grep chromium

# 过滤应用日志
adb logcat | grep HybridChat
```

### 3. 数据库检查

可以使用 Android Studio 的 Database Inspector 查看 SQLite 数据库：

1. 运行应用
2. View → Tool Windows → App Inspection
3. 选择 Database Inspector
4. 查看 `hybrid_chat.db`

---

## 故障排除

### 文件选择器不工作

**问题：** 点击按钮没有反应

**解决方案：**
1. 检查权限是否授予
2. 查看 Logcat 错误信息
3. 确认 `MainActivity` 正确设置了 `ActivityResultLauncher`

### 数据库保存失败

**问题：** `saveMessage` 返回 `success: false`

**解决方案：**
1. 检查 JSON 格式是否正确
2. 确认所有必需字段都存在
3. 查看 Logcat 中的异常信息

### 回调函数未触发

**问题：** `onFileSelected` 没有被调用

**解决方案：**
1. 确认回调函数名拼写正确
2. 检查函数是否挂载到 `window` 对象
3. 使用 Chrome DevTools 检查 JavaScript 错误

---

## 示例项目

完整的使用示例请参考：
- `client/src/components/InputArea.tsx` - 文件选择器集成
- `client/src/utils/androidStorage.ts` - 存储接口封装
- `android/app/src/main/java/com/hybridchat/app/` - Android 实现

---

## 更新日志

### v1.0.0 (2024-12-01)
- ✨ 新增原生文件选择器支持
- ✨ 新增 SQLite 数据库存储
- ✨ 自动图片压缩
- ✨ 统一存储接口
- 📝 完善文档和示例

---

## 相关文档

- [Android 部署指南](./DEPLOYMENT_GUIDE.md)
- [快速开始](./QUICKSTART.md)
- [项目说明](./README.md)
