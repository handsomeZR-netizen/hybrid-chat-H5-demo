# Android 部署完整指南

## 📋 前置准备

### 1. 安装 Android Studio

1. 下载 Android Studio：https://developer.android.com/studio
2. 安装时选择标准安装（Standard Installation）
3. 等待 SDK 和模拟器组件下载完成

### 2. 配置环境

Android Studio 会自动安装：
- Android SDK
- Android SDK Platform
- Android Virtual Device (AVD)
- JDK

## 🚀 快速部署步骤

### 步骤 1：构建前端资源

```bash
# 1. 进入前端目录
cd client

# 2. 安装依赖（如果还没安装）
npm install

# 3. 构建生产版本
npm run build
```

构建完成后，会在 `client/dist` 目录生成静态文件。

### 步骤 2：配置 Android 项目

#### 方案 A：使用开发服务器（推荐用于开发）

1. 启动前端开发服务器：
```bash
cd client
npm run dev
```

2. 修改 `android/app/src/main/java/com/hybridchat/app/MainActivity.java`：

```java
private void loadWebApp() {
    // 模拟器使用 10.0.2.2
    String devServerUrl = "http://10.0.2.2:5173";
    
    // 真机使用电脑 IP（需要在同一网络）
    // String devServerUrl = "http://192.168.1.100:5173";
    
    webView.loadUrl(devServerUrl);
}
```

#### 方案 B：打包静态资源到 APK（推荐用于生产）

1. 将构建好的文件复制到 Android 项目：

```bash
# Windows
xcopy /E /I client\dist android\app\src\main\assets

# Mac/Linux
cp -r client/dist/* android/app/src/main/assets/
```

2. 修改 `MainActivity.java`：

```java
private void loadWebApp() {
    // 加载本地资源
    String localUrl = "file:///android_asset/index.html";
    webView.loadUrl(localUrl);
}
```

### 步骤 3：在 Android Studio 中打开项目

1. 启动 Android Studio
2. 选择 **File → Open**
3. 导航到项目的 `android` 目录
4. 点击 **OK**

### 步骤 4：同步 Gradle

1. Android Studio 会自动提示同步 Gradle
2. 点击 **Sync Now**
3. 等待依赖下载完成（首次可能需要几分钟）

如果没有自动提示，点击：**File → Sync Project with Gradle Files**

### 步骤 5：配置运行设备

#### 选项 A：使用模拟器（推荐新手）

1. 点击工具栏的 **Device Manager** 图标（手机图标）
2. 点击 **Create Device**
3. 选择设备型号（推荐 Pixel 5 或 Pixel 6）
4. 选择系统镜像：
   - 推荐：**API 33 (Android 13)** 或更高
   - 最低：**API 24 (Android 7.0)**
5. 点击 **Next** → **Finish**
6. 等待模拟器启动

#### 选项 B：使用真机

1. **启用开发者选项**：
   - 进入手机 **设置 → 关于手机**
   - 连续点击 **版本号** 7 次
   - 返回设置，找到 **开发者选项**

2. **启用 USB 调试**：
   - 进入 **开发者选项**
   - 打开 **USB 调试**

3. **连接手机**：
   - 用 USB 线连接手机和电脑
   - 手机上会弹出授权提示，点击 **允许**

4. **验证连接**：
   ```bash
   # 在终端运行
   adb devices
   
   # 应该看到你的设备
   # List of devices attached
   # XXXXXXXXXX    device
   ```

### 步骤 6：运行应用

1. 在 Android Studio 顶部工具栏：
   - 确认选择了正确的设备
   - 点击绿色的 **Run** 按钮（▶️）
   - 或按快捷键 **Shift + F10**

2. 等待应用安装和启动

3. 首次运行会请求权限，点击 **允许**

## 🔧 配置 WebSocket 服务器地址

### 开发环境

如果使用开发服务器，需要确保 WebSocket 服务器可访问：

**模拟器访问本地服务器：**
```javascript
// client/src/utils/websocket.ts
const WS_URL = 'ws://10.0.2.2:8080';
```

**真机访问本地服务器：**
```javascript
// 使用电脑的局域网 IP
const WS_URL = 'ws://192.168.1.100:8080';
```

### 生产环境

部署到云服务器后：
```javascript
const WS_URL = 'wss://your-domain.com:8080';
```

## 📱 测试 JSBridge 功能

### 1. 启用 WebView 调试

应用已在 Debug 模式下启用调试，可以通过 Chrome 查看：

1. 在电脑上打开 Chrome 浏览器
2. 访问 `chrome://inspect`
3. 找到 **Remote Target** 下的 "Hybrid Chat"
4. 点击 **inspect**

### 2. 测试 JSBridge 方法

在 Chrome DevTools 控制台中测试：

```javascript
// 获取设备信息
console.log(window.AndroidInterface.getDeviceInfo());

// 显示 Toast
window.AndroidInterface.showToast("测试消息");

// 选择文件（当前返回错误，需要异步实现）
window.AndroidInterface.chooseFile("image");
```

## 🏗️ 构建发布版本 APK

### 1. 生成签名密钥

```bash
# 在 android 目录下运行
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

按提示输入密码和信息。

### 2. 配置签名

创建 `android/keystore.properties`：

```properties
storePassword=你的密钥库密码
keyPassword=你的密钥密码
keyAlias=my-key-alias
storeFile=my-release-key.jks
```

### 3. 修改 `android/app/build.gradle`

在 `android` 块中添加：

```gradle
signingConfigs {
    release {
        def keystorePropertiesFile = rootProject.file("keystore.properties")
        def keystoreProperties = new Properties()
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 4. 构建 APK

```bash
cd android
./gradlew assembleRelease

# APK 位置：
# android/app/build/outputs/apk/release/app-release.apk
```

## 🐛 常见问题解决

### 问题 1：找不到 SDK 路径

**解决方案：**

创建 `android/local.properties`：

```properties
sdk.dir=C\:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
```

### 问题 2：WebView 显示空白

**检查清单：**
- ✅ 前端开发服务器是否运行？
- ✅ URL 配置是否正确？
- ✅ 网络权限是否添加？
- ✅ 查看 Logcat 错误信息

**查看 Logcat：**
1. Android Studio → **View → Tool Windows → Logcat**
2. 过滤 "chromium" 或 "WebView"

### 问题 3：无法连接到 localhost:5173

**模拟器：**
- 使用 `10.0.2.2` 代替 `localhost`

**真机：**
- 使用电脑的局域网 IP
- 确保手机和电脑在同一网络
- 检查防火墙设置

### 问题 4：Gradle 同步失败

**解决方案：**
1. **File → Invalidate Caches / Restart**
2. 删除 `.gradle` 文件夹
3. 重新同步：**File → Sync Project with Gradle Files**

### 问题 5：JSBridge 方法找不到

**检查清单：**
- ✅ JavaScript 是否启用？
- ✅ `addJavascriptInterface` 是否调用？
- ✅ 方法是否有 `@JavascriptInterface` 注解？
- ✅ 尝试重新加载 WebView

## 📊 性能优化建议

### 1. 启用 ProGuard（生产环境）

在 `app/build.gradle` 中：

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 2. 优化 WebView 缓存

```java
// 在 MainActivity.setupWebView() 中添加
webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
webSettings.setAppCacheMaxSize(10 * 1024 * 1024); // 10MB
```

### 3. 压缩前端资源

```bash
# 在 client 目录
npm run build

# 使用 gzip 压缩
# Vite 已自动优化
```

## 📚 相关资源

- [Android Developer Guide](https://developer.android.com/guide)
- [WebView 文档](https://developer.android.com/reference/android/webkit/WebView)
- [JavascriptInterface](https://developer.android.com/reference/android/webkit/JavascriptInterface)
- [Android 权限](https://developer.android.com/guide/topics/permissions/overview)
- [发布应用](https://developer.android.com/studio/publish)

## 🎯 下一步

1. ✅ 完成基础部署
2. 🔄 测试所有功能
3. 📱 在多个设备上测试
4. 🚀 发布到 Google Play Store

需要帮助？查看 [QUICKSTART.md](./QUICKSTART.md) 或 [README.md](./README.md)
