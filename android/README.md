# Hybrid Chat - Android Application

This is the Android WebView application that hosts the React web frontend and provides native device capabilities through JSBridge.

## Project Structure

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/hybridchat/app/
│   │       │   ├── MainActivity.java          # Main activity hosting WebView
│   │       │   ├── AndroidInterface.java      # JSBridge interface
│   │       │   ├── PermissionManager.java     # Permission handling
│   │       │   └── FilePickerHelper.java      # File selection utilities
│   │       ├── res/
│   │       │   ├── layout/
│   │       │   │   └── activity_main.xml      # Main activity layout
│   │       │   └── values/
│   │       │       ├── strings.xml
│   │       │       ├── colors.xml
│   │       │       └── themes.xml
│   │       └── AndroidManifest.xml
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## Requirements

- Android Studio Arctic Fox or later
- Android SDK 24 (Android 7.0) or higher
- Gradle 8.2.0 or later
- Java 8 or later

## Setup

1. **Open in Android Studio**
   ```bash
   # Open the android/ directory in Android Studio
   ```

2. **Sync Gradle**
   - Android Studio will automatically sync Gradle dependencies
   - If not, click "Sync Project with Gradle Files"

3. **Configure Development Server URL**
   - Open `MainActivity.java`
   - Update the `devServerUrl` to point to your development server
   - For emulator: `http://10.0.2.2:5173` (localhost)
   - For physical device: `http://YOUR_COMPUTER_IP:5173`

4. **Run the Application**
   - Connect an Android device or start an emulator
   - Click "Run" or press Shift+F10
   - Select your device/emulator

## Features Implemented

### Task 9: Android WebView Application

✅ **MainActivity**
- WebView container setup
- JavaScript enabled
- Custom UserAgent configuration
- DOM storage and database enabled
- WebView debugging enabled for development

✅ **AndroidInterface (JSBridge)**
- `getDeviceInfo()` - Returns device model, Android version, SDK info
- `showToast(message)` - Displays native Android toast notifications
- `chooseFile(type)` - File picker interface (simplified implementation)
- Error handling with JSON responses

✅ **PermissionManager**
- Permission checking and caching
- Runtime permission request support
- Handles Android 13+ granular media permissions

✅ **FilePickerHelper**
- Intent creation for image/video/audio selection
- Base64 encoding utilities
- File size validation (10MB limit)

## JSBridge API

The following methods are available in JavaScript as `window.AndroidInterface`:

### getDeviceInfo()
```javascript
const deviceInfo = window.AndroidInterface.getDeviceInfo();
console.log(deviceInfo);
// Output: "Device: Google Pixel 5\nAndroid Version: 13\nSDK: 33\nApp Version: 1.0"
```

### showToast(message)
```javascript
window.AndroidInterface.showToast("Hello from web!");
// Displays a native Android toast
```

### chooseFile(type)
```javascript
// Note: Current implementation returns error - requires async implementation
const result = window.AndroidInterface.chooseFile("image");
// Returns: {"success":false,"error":"File picker requires asynchronous implementation..."}
```

## Permissions

The app requests the following permissions:

- `INTERNET` - For WebSocket communication
- `READ_EXTERNAL_STORAGE` - For accessing media files (Android 12 and below)
- `READ_MEDIA_IMAGES` - For accessing images (Android 13+)
- `READ_MEDIA_VIDEO` - For accessing videos (Android 13+)
- `READ_MEDIA_AUDIO` - For accessing audio files (Android 13+)
- `CAMERA` - For camera access (future use)
- `RECORD_AUDIO` - For audio recording (future use)

## Development Notes

### WebView Configuration
- JavaScript is enabled for React app
- DOM storage enabled for localStorage
- Mixed content allowed for development
- WebView debugging enabled in debug builds

### URL Loading Options
The app supports three loading modes (configured in `MainActivity.loadWebApp()`):

1. **Development Server** (default)
   ```java
   String devServerUrl = "http://10.0.2.2:5173";
   ```

2. **Local Assets**
   ```java
   String localUrl = "file:///android_asset/index.html";
   ```

3. **Remote Server**
   ```java
   String remoteUrl = "https://your-server.com/chat";
   ```

### Known Limitations

1. **File Picker**: The `chooseFile()` method currently returns an error because it requires asynchronous implementation with `ActivityResultLauncher`. This will be fully implemented in Task 11.

2. **Permission Flow**: Permission requests are simplified. Task 10 will implement proper asynchronous permission handling with callbacks.

## Testing

### Testing on Emulator
1. Start the web development server: `cd client && npm run dev`
2. Run the Android app in emulator
3. The app will load `http://10.0.2.2:5173` (emulator's localhost)

### Testing on Physical Device
1. Ensure your device and computer are on the same network
2. Find your computer's IP address
3. Update `devServerUrl` in `MainActivity.java` to `http://YOUR_IP:5173`
4. Run the app on your device

### Testing JSBridge
Open Chrome DevTools for WebView debugging:
1. Enable USB debugging on your device
2. Open Chrome and navigate to `chrome://inspect`
3. Find your WebView and click "inspect"
4. Test JSBridge methods in the console:
   ```javascript
   window.AndroidInterface.getDeviceInfo();
   window.AndroidInterface.showToast("Test");
   ```

## Next Steps

- **Task 10**: Implement full permission management with proper callbacks
- **Task 11**: Implement complete file picker with ActivityResultLauncher
- Add proper error handling and user feedback
- Implement production build configuration
- Add unit tests for native components

## Troubleshooting

### WebView not loading
- Check that the development server is running
- Verify the URL in `MainActivity.java`
- Check network connectivity
- Look for errors in Logcat

### JSBridge methods not working
- Ensure JavaScript is enabled in WebView settings
- Check that `addJavascriptInterface` is called
- Verify method signatures have `@JavascriptInterface` annotation
- Check Chrome DevTools console for JavaScript errors

### Permission errors
- Verify permissions are declared in AndroidManifest.xml
- Check that runtime permissions are requested for Android 6.0+
- Look for permission denial messages in Logcat
