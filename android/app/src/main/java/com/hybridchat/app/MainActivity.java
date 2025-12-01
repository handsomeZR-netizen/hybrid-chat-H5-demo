package com.hybridchat.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

/**
 * MainActivity - Main activity that hosts the WebView container
 * 
 * This activity loads the web application and injects the JSBridge
 * to enable communication between web layer and native Android capabilities.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    private AndroidInterface androidInterface;
    private ActivityResultLauncher<Intent> filePickerLauncher;
    private String pendingFileCallback;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Enable WebView debugging for Chrome DevTools
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        
        webView = findViewById(R.id.webview);
        setupFilePickerLauncher();
        setupWebView();
        injectJSBridge();
        loadWebApp();
    }
    
    /**
     * Setup ActivityResultLauncher for file picking
     * This handles the asynchronous file selection result
     */
    private void setupFilePickerLauncher() {
        filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null && androidInterface != null) {
                        // Handle the selected file
                        androidInterface.handleFileSelected(uri, pendingFileCallback);
                    }
                } else {
                    // User cancelled or error occurred
                    if (androidInterface != null && pendingFileCallback != null) {
                        androidInterface.notifyFileCancelled(pendingFileCallback);
                    }
                }
                pendingFileCallback = null;
            }
        );
    }
    
    /**
     * Launch file picker with intent
     * Called from AndroidInterface
     * 
     * @param intent The file picker intent
     * @param callback JavaScript callback function name
     */
    public void launchFilePicker(Intent intent, String callback) {
        pendingFileCallback = callback;
        filePickerLauncher.launch(intent);
    }
    
    /**
     * Configure WebView settings
     * - Enable JavaScript
     * - Set custom UserAgent
     * - Enable DOM storage
     * - Configure other security and performance settings
     * 
     * Requirement 7.1: Configure WebView with JavaScript enabled
     */
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // Enable JavaScript (required for React app)
        webSettings.setJavaScriptEnabled(true);
        
        // Set custom UserAgent to identify as hybrid app
        String userAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(userAgent + " HybridChatApp/1.0");
        
        // Enable DOM storage (required for localStorage)
        webSettings.setDomStorageEnabled(true);
        
        // Enable database storage
        webSettings.setDatabaseEnabled(true);
        
        // Note: setAppCacheEnabled() was deprecated in API 33 and removed
        // Modern apps should use Service Workers or Cache API instead
        
        // Allow file access from file URLs (needed for local resources)
        webSettings.setAllowFileAccess(true);
        
        // Allow file access from file URLs (required for loading CSS/JS from assets)
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        
        // Enable mixed content mode for development
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Set WebViewClient to handle page navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Load URLs within the WebView instead of external browser
                view.loadUrl(url);
                return true;
            }
        });
        
        // Enable debugging in debug builds
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
    }
    
    /**
     * Inject JSBridge into WebView
     * Creates AndroidInterface instance and adds it to JavaScript global scope
     * 
     * Requirement 7.1: Inject AndroidInterface object into JavaScript global scope
     */
    private void injectJSBridge() {
        androidInterface = new AndroidInterface(this, webView);
        
        // Add JavaScript interface with name "AndroidInterface"
        // This makes it accessible in JavaScript as window.AndroidInterface
        webView.addJavascriptInterface(androidInterface, "AndroidInterface");
    }
    
    /**
     * Load the web application
     * Can load from local HTML file or remote URL
     * 
     * For development: Load from local development server
     * For production: Load from bundled assets or remote server
     * 
     * Requirement 7.1: Load Web application
     */
    private void loadWebApp() {
        // Option 1: Load from local development server (for development)
        // Change this URL to match your development server
        // String devServerUrl = "http://10.0.2.2:5173"; // 10.0.2.2 is localhost for Android emulator
        
        // Option 2: Load from local assets (for production)
        String localUrl = "file:///android_asset/www/index.html";
        
        // Option 3: Load from remote server (for production)
        // String remoteUrl = "https://your-server.com/chat";
        
        // Load the URL
        webView.loadUrl(localUrl);
    }
    
    @Override
    public void onBackPressed() {
        // Handle back button - go back in WebView history if possible
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // Clean up WebView
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidInterface");
            webView.destroy();
        }
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        // Forward permission results to AndroidInterface's PermissionManager
        if (androidInterface != null) {
            androidInterface.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }
}
