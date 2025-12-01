# Android 原生功能使用示例

本文档提供 Android 原生功能的快速使用示例。

## 🎯 功能概览

| 功能 | 状态 | 说明 |
|------|------|------|
| 📷 原生文件选择器 | ✅ 已实现 | 替代 Web `<input type="file">` |
| 💾 SQLite 本地存储 | ✅ 已实现 | 替代 localStorage |
| 🔗 JSBridge 通信 | ✅ 已实现 | Web ↔ Android 双向通信 |
| 🔐 权限管理 | ✅ 已实现 | 自动处理运行时权限 |

---

## 📷 原生文件选择器

### 基础用法

```javascript
// 1. 设置回调函数
window.onFileSelected = function(result) {
  const data = JSON.parse(result);
  
  if (data.success) {
    // data.data 是 Base64 编码的 data URI
    console.log('文件已选择:', data.data);
    
    // 直接用于图片预览
    document.getElementById('preview').src = data.data;
    
    // 或发送到服务器
    sendToServer(data.data);
  } else {
    console.error('选择失败:', data.error);
  }
};

// 2. 调用文件选择器
window.AndroidInterface.chooseFileAsync('image', 'onFileSelected');
```

### React 组件中使用

```typescript
const handleSelectImage = () => {
  // 检查 Android 环境
  if (!window.AndroidInterface?.chooseFileAsync) {
    console.log('非 Android 环境，使用 Web 文件选择器');
    return;
  }

  // 设置回调
  window.onFileSelected = (result: any) => {
    const data = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (data.success) {
      setImageData(data.data); // 保存到状态
      onSendMediaMessage(data.data, 'IMAGE'); // 发送消息
    } else {
      alert(data.error);
    }
  };

  // 调用选择器
  window.AndroidInterface.chooseFileAsync('image', 'onFileSelected');
};
```

### 支持的文件类型

```javascript
// 选择图片
window.AndroidInterface.chooseFileAsync('image', 'onFileSelected');

// 选择视频
window.AndroidInterface.chooseFileAsync('video', 'onFileSelected');

// 选择音频
window.AndroidInterface.chooseFileAsync('audio', 'onFileSelected');
```

### 特性

- ✅ 自动图片压缩（最大 1920px，质量 85%）
- ✅ 文件大小限制（10MB）
- ✅ Base64 编码，直接可用
- ✅ 原生 UI，体验更好

---

## 💾 SQLite 本地存储

### 使用统一存储接口（推荐）

```typescript
import { storage } from './utils/androidStorage';

// 保存消息（自动选择 SQLite 或 localStorage）
const message = {
  id: "msg-123",
  type: "TEXT",
  senderId: "user1",
  content: "Hello World",
  timestamp: Date.now(),
  status: "sent"
};
storage.saveMessage(message);

// 获取最近 50 条消息
const messages = storage.getMessages(50);

// 获取历史消息（分页）
const history = storage.getMessagesBefore(timestamp, 20);

// 清除所有消息
storage.clearMessages();

// 检查存储类型
console.log(storage.getStorageType()); // "android-sqlite" 或 "localStorage"
```

### 直接调用 Android API

```javascript
// 保存消息
const message = {
  id: "msg-123",
  type: "TEXT",
  senderId: "user1",
  content: "Hello World",
  timestamp: Date.now()
};
const result = window.AndroidInterface.saveMessage(JSON.stringify(message));
console.log(JSON.parse(result)); // { success: true, data: "Message saved" }

// 获取所有消息
const allMessages = JSON.parse(window.AndroidInterface.getMessages(0));

// 获取最近 50 条
const recentMessages = JSON.parse(window.AndroidInterface.getMessages(50));

// 分页加载历史
const olderMessages = JSON.parse(
  window.AndroidInterface.getMessagesBefore(1234567890000, 20)
);

// 清除消息
const clearResult = window.AndroidInterface.clearMessages();
console.log(JSON.parse(clearResult)); // { success: true }

// 获取消息数量
const countResult = window.AndroidInterface.getMessageCount();
console.log(JSON.parse(countResult)); // { success: true, count: 123 }
```

### 数据库优势

| 特性 | localStorage | SQLite |
|------|-------------|--------|
| 存储容量 | ~5MB | 无限制 |
| 查询能力 | 无 | 支持 SQL |
| 索引 | 无 | 支持 |
| 性能 | 一般 | 优秀 |
| 分页 | 手动实现 | 原生支持 |

---

## 🔗 其他 JSBridge API

### 显示 Toast 通知

```javascript
window.AndroidInterface.showToast("操作成功！");
```

### 获取设备信息

```javascript
const deviceInfo = window.AndroidInterface.getDeviceInfo();
console.log(deviceInfo);
// 输出:
// Device: Google Pixel 5
// Android Version: 13
// SDK: 33
// App Version: 1.0
```

### 检查权限

```javascript
const result = window.AndroidInterface.checkPermission('image');
const data = JSON.parse(result);
console.log(data.granted); // true 或 false
```

### 请求权限

```javascript
// 设置权限回调
window.onPermissionGranted = (type) => {
  console.log(`${type} 权限已授予`);
};

window.onPermissionDenied = (type) => {
  console.log(`${type} 权限被拒绝`);
};

// 请求权限
window.AndroidInterface.requestPermission('camera');
```

---

## 🎨 完整示例：发送图片消息

```typescript
// React 组件示例
import { useState } from 'react';
import { storage } from './utils/androidStorage';

function ChatComponent() {
  const [messages, setMessages] = useState([]);

  // 发送图片
  const handleSendImage = () => {
    if (!window.AndroidInterface?.chooseFileAsync) {
      // 降级到 Web 文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          sendImageMessage(reader.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // 使用 Android 原生选择器
    window.onFileSelected = (result) => {
      const data = typeof result === 'string' ? JSON.parse(result) : result;
      if (data.success) {
        sendImageMessage(data.data);
      } else {
        window.AndroidInterface?.showToast(data.error || '选择失败');
      }
    };

    window.AndroidInterface.chooseFileAsync('image', 'onFileSelected');
  };

  // 发送图片消息
  const sendImageMessage = (base64Data) => {
    const message = {
      id: `msg-${Date.now()}`,
      type: 'IMAGE',
      senderId: 'user1',
      content: base64Data,
      timestamp: Date.now(),
      status: 'sent'
    };

    // 保存到本地（自动选择 SQLite 或 localStorage）
    storage.saveMessage(message);

    // 更新 UI
    setMessages(prev => [...prev, message]);

    // 发送到服务器
    websocket.send(message);

    // 显示成功提示
    if (window.AndroidInterface?.showToast) {
      window.AndroidInterface.showToast('图片已发送');
    }
  };

  return (
    <div>
      <button onClick={handleSendImage}>发送图片</button>
      {/* 消息列表 */}
    </div>
  );
}
```

---

## 🔍 环境检测

### 检查是否在 Android 环境

```javascript
function isAndroid() {
  return typeof window !== 'undefined' && !!window.AndroidInterface;
}

if (isAndroid()) {
  console.log('运行在 Android WebView 中');
  console.log('存储类型:', storage.getStorageType()); // "android-sqlite"
} else {
  console.log('运行在浏览器中');
  console.log('存储类型:', storage.getStorageType()); // "localStorage"
}
```

### 功能降级示例

```javascript
function selectFile(type) {
  if (window.AndroidInterface?.chooseFileAsync) {
    // 优先使用 Android 原生
    window.AndroidInterface.chooseFileAsync(type, 'onFileSelected');
  } else {
    // 降级到 Web API
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    input.click();
  }
}
```

---

## 📱 调试技巧

### Chrome DevTools 调试

1. 手机连接电脑，启用 USB 调试
2. Chrome 访问 `chrome://inspect`
3. 找到你的 WebView，点击 "inspect"
4. 在控制台测试：

```javascript
// 测试设备信息
window.AndroidInterface.getDeviceInfo();

// 测试 Toast
window.AndroidInterface.showToast("测试");

// 测试存储
window.AndroidInterface.saveMessage(JSON.stringify({
  id: "test-1",
  type: "TEXT",
  senderId: "user1",
  content: "测试消息",
  timestamp: Date.now()
}));

// 查看消息
window.AndroidInterface.getMessages(10);
```

### Logcat 日志

```bash
# 查看应用日志
adb logcat | grep HybridChat

# 查看 WebView 日志
adb logcat | grep chromium
```

---

## ⚠️ 注意事项

1. **回调函数必须挂载到 window**
   ```javascript
   // ✅ 正确
   window.onFileSelected = function(result) { ... };
   
   // ❌ 错误
   const onFileSelected = function(result) { ... };
   ```

2. **JSON 解析**
   ```javascript
   // Android 返回的是 JSON 字符串，需要解析
   const result = window.AndroidInterface.getMessages(10);
   const messages = JSON.parse(result); // 必须解析
   ```

3. **错误处理**
   ```javascript
   try {
     const result = window.AndroidInterface.saveMessage(json);
     const data = JSON.parse(result);
     if (!data.success) {
       console.error('操作失败:', data.error);
     }
   } catch (error) {
     console.error('异常:', error);
   }
   ```

4. **环境检测**
   ```javascript
   // 始终检查 Android 环境
   if (window.AndroidInterface?.methodName) {
     // 调用 Android 方法
   } else {
     // 使用降级方案
   }
   ```

---

## 📚 相关文档

- [Android 功能详解](./ANDROID_FEATURES.md) - 完整 API 文档
- [Android 部署指南](./DEPLOYMENT_GUIDE.md) - 部署步骤
- [项目 README](../README.md) - 项目概览
