package com.hybridchat.app;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.util.HashMap;
import java.util.Map;

/**
 * PermissionManager - Manages Android runtime permissions
 * 
 * Handles permission checking, requesting, and caching for the application.
 * Used by AndroidInterface to ensure proper permissions before accessing device features.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
public class PermissionManager {
    
    private Activity activity;
    private Map<String, Boolean> permissionCache;
    private PermissionCallback currentCallback;
    
    public static final int PERMISSION_REQUEST_CODE = 1001;
    
    // Common permissions
    public static final String CAMERA = android.Manifest.permission.CAMERA;
    public static final String RECORD_AUDIO = android.Manifest.permission.RECORD_AUDIO;
    public static final String READ_EXTERNAL_STORAGE = android.Manifest.permission.READ_EXTERNAL_STORAGE;
    
    /**
     * Callback interface for permission request results
     */
    public interface PermissionCallback {
        void onPermissionGranted(String permission);
        void onPermissionDenied(String permission);
    }
    
    public PermissionManager(Activity activity) {
        this.activity = activity;
        this.permissionCache = new HashMap<>();
    }
    
    /**
     * Check if a permission is granted
     * 
     * Requirement 10.1, 10.2, 10.3: Check CAMERA, RECORD_AUDIO, and storage permissions
     * Requirement 10.5: Use cached permission status when available
     * 
     * @param permission The permission to check (e.g., Manifest.permission.CAMERA)
     * @return true if permission is granted, false otherwise
     */
    public boolean checkPermission(String permission) {
        // Check cache first (Requirement 10.5)
        if (permissionCache.containsKey(permission)) {
            Boolean cached = permissionCache.get(permission);
            if (cached != null && cached) {
                return true;
            }
        }
        
        // Check actual permission status
        boolean granted = ContextCompat.checkSelfPermission(activity, permission) 
                         == PackageManager.PERMISSION_GRANTED;
        
        // Cache the result (Requirement 10.5)
        cachePermissionStatus(permission, granted);
        
        return granted;
    }
    
    /**
     * Check multiple permissions at once
     * 
     * @param permissions Array of permissions to check
     * @return true if all permissions are granted, false otherwise
     */
    public boolean checkPermissions(String[] permissions) {
        for (String permission : permissions) {
            if (!checkPermission(permission)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Request a permission from the user with callback
     * 
     * Requirement 10.1, 10.2, 10.3: Request CAMERA, RECORD_AUDIO, and storage permissions
     * Requirement 10.4: Return error when permission is denied
     * 
     * @param permission The permission to request
     * @param callback Callback to handle the result
     */
    public void requestPermission(String permission, PermissionCallback callback) {
        this.currentCallback = callback;
        
        // Check if already granted
        if (checkPermission(permission)) {
            if (callback != null) {
                callback.onPermissionGranted(permission);
            }
            return;
        }
        
        // Request the permission
        ActivityCompat.requestPermissions(
            activity,
            new String[]{permission},
            PERMISSION_REQUEST_CODE
        );
    }
    
    /**
     * Request multiple permissions at once
     * 
     * @param permissions Array of permissions to request
     * @param callback Callback to handle the result
     */
    public void requestPermissions(String[] permissions, PermissionCallback callback) {
        this.currentCallback = callback;
        
        // Check if all are already granted
        boolean allGranted = true;
        for (String permission : permissions) {
            if (!checkPermission(permission)) {
                allGranted = false;
                break;
            }
        }
        
        if (allGranted && callback != null) {
            for (String permission : permissions) {
                callback.onPermissionGranted(permission);
            }
            return;
        }
        
        // Request the permissions
        ActivityCompat.requestPermissions(
            activity,
            permissions,
            PERMISSION_REQUEST_CODE
        );
    }
    
    /**
     * Handle permission request result
     * Should be called from Activity's onRequestPermissionsResult
     * 
     * Requirement 10.4: Return error when permission is denied
     * Requirement 10.5: Cache permission status after grant
     * 
     * @param requestCode The request code
     * @param permissions The requested permissions
     * @param grantResults The grant results
     */
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode != PERMISSION_REQUEST_CODE) {
            return;
        }
        
        if (permissions == null || grantResults == null) {
            return;
        }
        
        for (int i = 0; i < permissions.length; i++) {
            String permission = permissions[i];
            boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
            
            // Cache the result (Requirement 10.5)
            cachePermissionStatus(permission, granted);
            
            // Notify callback
            if (currentCallback != null) {
                if (granted) {
                    currentCallback.onPermissionGranted(permission);
                } else {
                    // Requirement 10.4: Return error when denied
                    currentCallback.onPermissionDenied(permission);
                }
            }
        }
        
        // Clear callback after handling
        currentCallback = null;
    }
    
    /**
     * Cache permission status
     * 
     * Requirement 10.5: Cache permission status after grant
     * 
     * @param permission The permission
     * @param granted Whether it was granted
     */
    public void cachePermissionStatus(String permission, boolean granted) {
        permissionCache.put(permission, granted);
    }
    
    /**
     * Clear permission cache
     * Useful when permissions might have changed outside the app
     */
    public void clearCache() {
        permissionCache.clear();
    }
    
    /**
     * Clear cache for a specific permission
     * 
     * @param permission The permission to clear from cache
     */
    public void clearCacheForPermission(String permission) {
        permissionCache.remove(permission);
    }
    
    /**
     * Check if we should show permission rationale
     * 
     * @param permission The permission to check
     * @return true if we should show rationale
     */
    public boolean shouldShowRationale(String permission) {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission);
    }
    
    /**
     * Get the appropriate storage permission based on Android version
     * 
     * Requirement 10.3: Request appropriate storage permissions
     * 
     * @param mediaType The type of media: "image", "video", or "audio"
     * @return The permission string to request
     */
    public static String getStoragePermissionForMediaType(String mediaType) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ uses granular media permissions
            switch (mediaType.toLowerCase()) {
                case "image":
                    return android.Manifest.permission.READ_MEDIA_IMAGES;
                case "video":
                    return android.Manifest.permission.READ_MEDIA_VIDEO;
                case "audio":
                    return android.Manifest.permission.READ_MEDIA_AUDIO;
                default:
                    return android.Manifest.permission.READ_MEDIA_IMAGES;
            }
        } else {
            // Older Android versions use READ_EXTERNAL_STORAGE
            return READ_EXTERNAL_STORAGE;
        }
    }
    
    /**
     * Check if a permission is permanently denied
     * (user selected "Don't ask again")
     * 
     * @param permission The permission to check
     * @return true if permanently denied
     */
    public boolean isPermanentlyDenied(String permission) {
        return !checkPermission(permission) && !shouldShowRationale(permission);
    }
}
