# Quick Start Guide - Hybrid Chat Android App

## Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install with default settings

2. **Install Java Development Kit (JDK)**
   - Android Studio includes JDK, or install separately
   - Minimum: JDK 8

## Setup Steps

### 1. Open Project in Android Studio

```bash
# Navigate to the android directory
cd android

# Open Android Studio and select "Open an Existing Project"
# Navigate to the android/ directory and click OK
```

### 2. Sync Gradle Dependencies

- Android Studio will automatically prompt to sync Gradle
- Click "Sync Now" in the notification bar
- Wait for dependencies to download (first time may take several minutes)

### 3. Configure Development Server

Edit `app/src/main/java/com/hybridchat/app/MainActivity.java`:

**For Android Emulator:**
```java
String devServerUrl = "http://10.0.2.2:5173";
```

**For Physical Device:**
```java
String devServerUrl = "http://YOUR_COMPUTER_IP:5173";
```

To find your computer's IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr` (look for inet address)

### 4. Start the Web Development Server

In a separate terminal:
```bash
cd client
npm install
npm run dev
```

The server should start on `http://localhost:5173`

### 5. Run the Android App

**Option A: Using Emulator**
1. In Android Studio, click "Device Manager" (phone icon)
2. Create a new virtual device if needed
3. Select a device with API 24+ (Android 7.0+)
4. Click "Run" (green play button) or press Shift+F10
5. Select your emulator from the device list

**Option B: Using Physical Device**
1. Enable Developer Options on your device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Go to Settings > Developer Options
   - Enable "USB Debugging"
3. Connect device via USB
4. Click "Run" and select your device

## Testing JSBridge

### 1. Enable WebView Debugging

Already enabled in debug builds. To access:

1. Connect your device/emulator
2. Open Chrome browser on your computer
3. Navigate to `chrome://inspect`
4. Find "Hybrid Chat" under "Remote Target"
5. Click "inspect"

### 2. Test JSBridge Methods

In the Chrome DevTools console:

```javascript
// Test device info
console.log(window.AndroidInterface.getDeviceInfo());

// Test toast
window.AndroidInterface.showToast("Hello from JavaScript!");

// Test file picker (will show error - requires async implementation)
console.log(window.AndroidInterface.chooseFile("image"));
```

## Troubleshooting

### Problem: "SDK location not found"

**Solution:**
Create `local.properties` file in the `android/` directory:
```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```
(Replace with your actual SDK path)

### Problem: WebView shows blank screen

**Solutions:**
1. Check that web dev server is running
2. Verify the URL in MainActivity.java
3. Check Logcat for errors:
   - View > Tool Windows > Logcat
   - Filter by "chromium" or "WebView"

### Problem: "Unable to connect to localhost:5173"

**Solutions:**
- Emulator: Use `10.0.2.2` instead of `localhost`
- Physical device: Use your computer's IP address
- Check firewall settings
- Ensure device and computer are on same network

### Problem: Build fails with "package R does not exist"

**Solution:**
1. Clean project: Build > Clean Project
2. Rebuild: Build > Rebuild Project
3. Invalidate caches: File > Invalidate Caches / Restart

### Problem: JSBridge methods not found

**Solutions:**
1. Check that JavaScript is enabled in WebView
2. Verify `addJavascriptInterface` is called
3. Check method has `@JavascriptInterface` annotation
4. Try reloading the WebView

## Next Steps

After successfully running the app:

1. **Test the chat functionality**
   - Login with a username
   - Send messages
   - Test with multiple devices/emulators

2. **Explore the code**
   - `MainActivity.java` - WebView setup
   - `AndroidInterface.java` - JSBridge methods
   - `PermissionManager.java` - Permission handling
   - `FilePickerHelper.java` - File utilities

3. **Implement remaining tasks**
   - Task 10: Full permission management
   - Task 11: Complete file picker implementation

## Useful Commands

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Run tests
./gradlew test

# Check for dependency updates
./gradlew dependencyUpdates
```

## Resources

- [Android Developer Guide](https://developer.android.com/guide)
- [WebView Documentation](https://developer.android.com/reference/android/webkit/WebView)
- [JavascriptInterface](https://developer.android.com/reference/android/webkit/JavascriptInterface)
- [Android Permissions](https://developer.android.com/guide/topics/permissions/overview)
