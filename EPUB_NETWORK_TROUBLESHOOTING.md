# EPUB Network Troubleshooting Guide

## Problem Overview

The EPUB reader was experiencing "Network request failed" errors when trying to load EPUB files from Firebase Storage. This document outlines the root causes and solutions implemented.

## Root Causes Identified

### 1. iOS App Transport Security (ATS)
- **Issue**: iOS `Info.plist` had `NSAllowsArbitraryLoads` set to `false`
- **Impact**: Blocked HTTPS requests to external domains including Firebase Storage
- **Solution**: Added specific exception for `firebasestorage.googleapis.com`

### 2. Android Network Security
- **Issue**: No network security configuration for HTTPS requests
- **Impact**: Potential blocking of secure connections to Firebase Storage
- **Solution**: Created `network_security_config.xml` with proper HTTPS configuration

### 3. EPUB Library Limitations
- **Issue**: `@epubjs-react-native/core` library may have compatibility issues
- **Impact**: Native EPUB reader fails to load content
- **Solution**: Implemented WebView fallback with `epub.js` library

## Solutions Implemented

### 1. iOS Network Security Configuration

**File**: `ios/LifeInTheUK/Info.plist`

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSAllowsLocalNetworking</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>firebasestorage.googleapis.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 2. Android Network Security Configuration

**File**: `android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">firebasestorage.googleapis.com</domain>
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

**File**: `android/app/src/main/AndroidManifest.xml`

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ... >
```

### 3. Enhanced EPUB Reader with Fallback

**Features**:
- **Dual Reader System**: Native `@epubjs-react-native/core` + WebView fallback
- **Automatic Fallback**: Switches to WebView if native reader fails
- **URL Testing**: Pre-tests Firebase Storage URLs before loading
- **Timeout Handling**: 20-second timeout with retry logic
- **Error Recovery**: Comprehensive error handling and retry mechanisms
- **Loading States**: Detailed progress indicators and status messages

**Key Components**:
- Primary: `@epubjs-react-native/core` with `useFileSystem`
- Fallback: WebView with `epub.js` CDN library
- Network: Pre-flight URL testing with `fetch`
- UI: Loading states, error messages, and retry buttons

## Firebase Storage URLs

The EPUB files are stored in Firebase Storage with the following URL pattern:

```
https://firebasestorage.googleapis.com/v0/b/lifeuk-6dff5.appspot.com/o/BookData%2F[FILENAME]?alt=media
```

**Chapter Files**:
- Chapter 1: `Life%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%201.epub`
- Chapter 2: `Life%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%202.epub`
- Chapter 3: `Life%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%203.epub`
- Chapter 4: `Life%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%204.epub`
- Chapter 5: `Life%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%205.epub`

## Testing and Validation

### 1. URL Accessibility Test

```bash
curl -I "https://firebasestorage.googleapis.com/v0/b/lifeuk-6dff5.appspot.com/o/BookData%2FLife%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%201.epub?alt=media"
```

**Expected Response**: HTTP 200 with `content-type: application/epub+zip`

### 2. App Testing Checklist

- [ ] iOS App Transport Security allows Firebase Storage
- [ ] Android Network Security Config permits HTTPS to Firebase
- [ ] Native EPUB reader loads successfully
- [ ] WebView fallback works when native reader fails
- [ ] URL pre-testing detects network issues
- [ ] Loading states and error messages display correctly
- [ ] Retry functionality works properly
- [ ] Chapter navigation functions correctly

## Troubleshooting Steps

### If EPUB Still Won't Load:

1. **Check Network Connectivity**
   ```bash
   # Test URL accessibility
   curl -I "[FIREBASE_STORAGE_URL]"
   ```

2. **Verify Firebase Storage Rules**
   - Ensure public read access is enabled
   - Check for any CORS restrictions

3. **Debug App Network Requests**
   - Enable network debugging in React Native
   - Check console logs for specific error messages
   - Monitor network requests in development tools

4. **Test WebView Fallback**
   - Force WebView mode by setting `useWebViewFallback: true`
   - Check if CDN `epub.js` library loads correctly
   - Verify WebView has internet permissions

### Common Error Messages:

- **"Network request failed"**: Network security configuration issue
- **"Loading timeout"**: Slow network or large file size
- **"Cannot access EPUB file"**: Firebase Storage permissions or URL issue
- **"WebView failed to load"**: WebView configuration or JavaScript error

## Performance Considerations

### File Sizes
- EPUB files range from ~300KB to ~500KB
- Loading time depends on network speed
- Consider implementing progress indicators

### Caching
- Native reader may cache files automatically
- WebView doesn't cache EPUB content by default
- Consider implementing app-level caching for better performance

### Memory Usage
- Multiple EPUB files loaded simultaneously may impact memory
- Implement proper cleanup when switching chapters
- Monitor memory usage in production

## Security Considerations

### Network Security
- Only allows HTTPS connections to Firebase Storage
- Maintains strict TLS requirements (TLSv1.2+)
- Doesn't allow arbitrary HTTP loads

### Content Security
- EPUB content is served from trusted Firebase Storage
- WebView fallback uses CDN-hosted epub.js library
- No user-generated content in EPUB files

## Future Improvements

1. **Offline Support**: Download and cache EPUB files locally
2. **Progress Tracking**: Implement reading progress synchronization
3. **Performance Optimization**: Lazy loading and memory management
4. **Enhanced Error Handling**: More specific error messages and recovery options
5. **Analytics**: Track loading performance and failure rates

## Dependencies

- `@epubjs-react-native/core`: Native EPUB reader
- `@epubjs-react-native/file-system`: File system integration
- `react-native-webview`: WebView fallback
- `epub.js`: CDN library for WebView EPUB rendering

## Build Requirements

After making network security changes:

1. **iOS**: Run `cd ios && pod install` then `yarn ios`
2. **Android**: Clean build with `cd android && ./gradlew clean` then `yarn android`
3. **Both**: May require full rebuild to apply network security configurations 