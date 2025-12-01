package com.hybridchat.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * FilePickerHelper - Helper class for file selection and encoding
 * 
 * Provides utilities for picking images, videos, and audio files,
 * and encoding them to Base64 for transmission to the web layer.
 * 
 * Implements file size handling with compression for images and size limits
 * for videos and audio files.
 * 
 * Requirements: 4.1, 4.5
 */
public class FilePickerHelper {
    
    private Activity activity;
    private static final int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    private static final int MAX_IMAGE_DIMENSION = 1920; // Max width/height for images
    private static final int IMAGE_QUALITY = 85; // JPEG compression quality (0-100)
    
    public FilePickerHelper(Activity activity) {
        this.activity = activity;
    }
    
    /**
     * Create intent for picking an image
     * 
     * @return Intent for image selection
     */
    public Intent createImagePickerIntent() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        return intent;
    }
    
    /**
     * Create intent for picking a video
     * 
     * @return Intent for video selection
     */
    public Intent createVideoPickerIntent() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("video/*");
        return intent;
    }
    
    /**
     * Create intent for picking an audio file
     * 
     * @return Intent for audio selection
     */
    public Intent createAudioPickerIntent() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("audio/*");
        return intent;
    }
    
    /**
     * Encode a file to Base64 string with automatic compression for images
     * 
     * Requirement 4.1: Encode media files to Base64
     * Requirement 4.5: Handle large files with compression and size limits
     * 
     * @param uri The URI of the file to encode
     * @return Base64 encoded string of the file content
     * @throws Exception if file reading or encoding fails
     */
    public String encodeToBase64(Uri uri) throws Exception {
        String mimeType = getMimeType(uri);
        
        // For images, use compression
        if (mimeType != null && mimeType.startsWith("image/")) {
            return encodeImageToBase64(uri);
        }
        
        // For other files, encode directly with size check
        return encodeFileToBase64(uri);
    }
    
    /**
     * Encode an image to Base64 with compression
     * 
     * Requirement 4.5: Compress large images
     * 
     * @param uri The URI of the image to encode
     * @return Base64 encoded string of the compressed image
     * @throws Exception if image processing fails
     */
    private String encodeImageToBase64(Uri uri) throws Exception {
        InputStream inputStream = null;
        ByteArrayOutputStream outputStream = null;
        
        try {
            inputStream = activity.getContentResolver().openInputStream(uri);
            if (inputStream == null) {
                throw new Exception("Failed to open image input stream");
            }
            
            // Decode image
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
            if (bitmap == null) {
                throw new Exception("Failed to decode image");
            }
            
            // Compress if needed
            Bitmap compressedBitmap = compressImage(bitmap);
            
            // Encode to JPEG
            outputStream = new ByteArrayOutputStream();
            compressedBitmap.compress(Bitmap.CompressFormat.JPEG, IMAGE_QUALITY, outputStream);
            
            // Check size after compression
            byte[] imageBytes = outputStream.toByteArray();
            if (imageBytes.length > MAX_FILE_SIZE) {
                throw new Exception("Image size exceeds limit even after compression");
            }
            
            // Clean up bitmaps
            if (compressedBitmap != bitmap) {
                compressedBitmap.recycle();
            }
            bitmap.recycle();
            
            return Base64.encodeToString(imageBytes, Base64.NO_WRAP);
            
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (outputStream != null) {
                try {
                    outputStream.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
    
    /**
     * Compress an image if it exceeds maximum dimensions
     * 
     * Requirement 4.5: Compress large images
     * 
     * @param bitmap The bitmap to compress
     * @return Compressed bitmap or original if no compression needed
     */
    private Bitmap compressImage(Bitmap bitmap) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        
        // Check if compression is needed
        if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
            return bitmap;
        }
        
        // Calculate scale factor
        float scale;
        if (width > height) {
            scale = (float) MAX_IMAGE_DIMENSION / width;
        } else {
            scale = (float) MAX_IMAGE_DIMENSION / height;
        }
        
        int newWidth = Math.round(width * scale);
        int newHeight = Math.round(height * scale);
        
        // Create scaled bitmap
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true);
    }
    
    /**
     * Encode a non-image file to Base64 with size checking
     * 
     * Requirement 4.5: Enforce size limits for large files
     * 
     * @param uri The URI of the file to encode
     * @return Base64 encoded string of the file content
     * @throws Exception if file reading or encoding fails
     */
    private String encodeFileToBase64(Uri uri) throws Exception {
        InputStream inputStream = null;
        ByteArrayOutputStream outputStream = null;
        
        try {
            inputStream = activity.getContentResolver().openInputStream(uri);
            if (inputStream == null) {
                throw new Exception("Failed to open file input stream");
            }
            
            outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int bytesRead;
            long totalBytes = 0;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                totalBytes += bytesRead;
                
                // Check file size limit (Requirement 4.5)
                if (totalBytes > MAX_FILE_SIZE) {
                    throw new Exception("File size exceeds limit of " + (MAX_FILE_SIZE / 1024 / 1024) + "MB");
                }
                
                outputStream.write(buffer, 0, bytesRead);
            }
            
            byte[] fileBytes = outputStream.toByteArray();
            return Base64.encodeToString(fileBytes, Base64.NO_WRAP);
            
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (outputStream != null) {
                try {
                    outputStream.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
    
    /**
     * Get MIME type from URI
     * 
     * @param uri The URI to check
     * @return MIME type string
     */
    public String getMimeType(Uri uri) {
        return activity.getContentResolver().getType(uri);
    }
    
    /**
     * Encode file to Base64 with data URI prefix
     * Returns a data URI that can be used directly in web contexts
     * 
     * Requirement 4.1: Encode media files for web transmission
     * 
     * @param uri The URI of the file to encode
     * @return Data URI string (e.g., "data:image/jpeg;base64,...")
     * @throws Exception if encoding fails
     */
    public String encodeToDataUri(Uri uri) throws Exception {
        String mimeType = getMimeType(uri);
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }
        
        String base64Data = encodeToBase64(uri);
        return "data:" + mimeType + ";base64," + base64Data;
    }
    
    /**
     * Check if file size is within limits
     * 
     * @param uri The URI to check
     * @return true if file is within size limits
     */
    public boolean isFileSizeValid(Uri uri) {
        try {
            InputStream inputStream = activity.getContentResolver().openInputStream(uri);
            if (inputStream == null) return false;
            
            long size = inputStream.available();
            inputStream.close();
            
            return size <= MAX_FILE_SIZE;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
