# OWASP Mobile Top 10 2024 & Prevention

Understand and prevent the 10 most critical security risks in mobile applications.

---

## M1: Improper Platform Usage

### What Is It?

Misuse of platform features or security controls. Examples:
- Using platform APIs incorrectly
- Mishandling platform-specific permissions
- Incorrect handling of TouchID/FaceID
- Webview vulnerabilities

### Example: Vulnerable WebView (iOS)

```swift
// ❌ BAD: Insecure WebView
let webView = UIWebView()
webView.load(URLRequest(url: url))

// Allows JavaScript injection
// No HTTPS enforcement
// No content filtering
```

### Prevention: Secure WebView (iOS)

```swift
// ✅ GOOD: Secure WebView
import WebKit

let webView = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
webView.load(URLRequest(url: url))

// WKWebView is more secure by default:
// - Runs in separate process
// - No UIWebView vulnerabilities
// - Better performance

// Additional hardening
webView.configuration.websiteDataStore.httpShouldUseCookies = false
webView.configuration.websiteDataStore.httpShouldSetCookies = false
webView.configuration.suppressesIncrementalRendering = true
```

### Prevention: Secure WebView (Android)

```kotlin
// ✅ GOOD: Secure WebView
val webView = WebView(context)

// Disable file access
webView.settings.allowFileAccess = false
webView.settings.allowContentAccess = false

// Disable mixed content
webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

// Disable JavaScript by default
webView.settings.javaScriptEnabled = false // Only enable if needed

// Disable form data storage
webView.settings.saveFormData = false

// Set user agent
webView.settings.userAgentString = "Custom User Agent"
```

### Prevention: React Native WebView

```typescript
import { WebView } from 'react-native-webview'

export function SecureWebView() {
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      // Only allow HTTPS
      onError={(error) => {
        if (error.url?.startsWith('http://')) {
          console.error('Blocked insecure content')
        }
      }}
      // Disable file access
      allowFileAccess={false}
      // Set minimum TLS version
      minimumFontSize={1}
      // Restrict JavaScript if possible
      injectedJavaScript="javascript:void 0"
      javaScriptEnabled={true} // Only if needed
    />
  )
}
```

---

## M2: Insecure Data Storage

### What Is It?

Storing sensitive data in plaintext or using weak encryption.

### Vulnerable: Plaintext Storage

```typescript
// ❌ BAD: Stored in plaintext
AsyncStorage.setItem('auth_token', token)

// ❌ BAD: Stored in unencrypted SharedPreferences (Android)
SharedPreferences.getInstance().edit().putString('auth_token', token).commit()

// ❌ BAD: Stored in UserDefaults (iOS)
UserDefaults.standard.set(token, forKey: 'auth_token')
```

### Secure: Keychain/Keystore Storage

```typescript
// ✅ GOOD: React Native with Keychain
import * as Keychain from 'react-native-keychain'

await Keychain.setGenericPassword('auth_token', token, {
  service: 'com.myapp.auth',
  accessibleWhenUnlockedThisDeviceOnly: true
})
```

```swift
// ✅ GOOD: iOS Keychain
let query: [String: Any] = [
  kSecClass: kSecClassGenericPassword,
  kSecAttrAccount: "auth_token",
  kSecValueData: token.data(using: .utf8)!,
  kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
]
SecItemAdd(query as CFDictionary, nil)
```

```kotlin
// ✅ GOOD: Android EncryptedSharedPreferences
val masterKey = MasterKey.Builder(context)
  .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
  .build()

val encryptedPrefs = EncryptedSharedPreferences.create(
  context,
  "secret_prefs",
  masterKey,
  EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
  EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)

encryptedPrefs.edit().putString("auth_token", token).apply()
```

---

## M3: Insecure Communication

### What Is It?

Data transmitted without encryption or using weak encryption.

### Vulnerable: Unencrypted HTTP

```typescript
// ❌ BAD: Unencrypted HTTP
await fetch('http://api.example.com/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

// ❌ BAD: Allowing cleartext traffic
// AndroidManifest.xml with cleartextTrafficPermitted="true"
```

### Secure: HTTPS + SSL Pinning

```typescript
// ✅ GOOD: HTTPS with pinning
import { ReactNativeCertificatePin } from 'react-native-certificate-pinning'

const apiCall = async (url: string, options: RequestInit) => {
  // Verify certificate before request
  const trustChain = await ReactNativeCertificatePin.fetchPublicKeyFromServer(url)
  
  if (!trustChain.includes('sha256/expected_pin')) {
    throw new Error('Certificate validation failed')
  }
  
  return fetch(url, options)
}
```

### Best Practices

- ✅ Always use HTTPS (TLS 1.2+)
- ✅ Implement certificate pinning
- ✅ Validate all certificates
- ✅ Use mutual TLS for sensitive APIs
- ✅ Enforce minimum TLS version

---

## M4: Insecure Authentication

### What Is It?

Weak authentication mechanisms or improper credential handling.

### Vulnerable: Basic Auth in Plaintext

```typescript
// ❌ BAD: Basic auth (credentials in header)
const auth = btoa(`${email}:${password}`)
fetch(url, {
  headers: { 'Authorization': `Basic ${auth}` }
})

// ❌ BAD: Storing password
const password = await secureStorage.getPassword()
```

### Secure: OAuth 2.0 + PKCE

```typescript
// ✅ GOOD: OAuth 2.0 with PKCE (no password in app)
export async function initiateLogin() {
  const { codeVerifier, codeChallenge } = await generatePKCEChallenge()
  
  // Store verifier securely
  await Keychain.setGenericPassword('pkce_verifier', codeVerifier)
  
  // Open browser for user authentication
  const result = await WebBrowser.openAuthSessionAsync(
    `https://provider.com/oauth?challenge=${codeChallenge}`,
    'myapp://'
  )
  
  // Exchange code for token
  const accessToken = await exchangeCodeForToken(result.url, codeVerifier)
  
  // Store token securely
  await Keychain.setGenericPassword('access_token', accessToken)
}
```

### Secure: Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication'

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const available = await LocalAuthentication.hasHardwareAsync()
    
    if (!available) {
      return false
    }
    
    const compatible = await LocalAuthentication.isCompatibleAsync()
    
    if (!compatible) {
      return false
    }
    
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode'
    })
    
    return result.success
  } catch (error) {
    return false
  }
}
```

---

## M5: Insufficient Cryptography

### What Is It?

Using weak encryption algorithms or improper key management.

### Vulnerable: Weak Encryption

```typescript
// ❌ BAD: Using MD5 or SHA1
import crypto from 'crypto'
const hash = crypto.createHash('md5').update(data).digest()

// ❌ BAD: Using DES or RC4
// ❌ BAD: Hardcoded encryption keys
const KEY = "fixed_key_123456"
```

### Secure: Strong Encryption

```typescript
// ✅ GOOD: Using SHA-256 and AES-256
import crypto from 'crypto'

// For hashing
const hash = crypto.createHash('sha256').update(data).digest()

// For encryption (use crypto.randomBytes for key)
const key = crypto.randomBytes(32) // 256-bit key
const iv = crypto.randomBytes(16)  // 128-bit IV
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
const encrypted = cipher.update(data)
```

### Secure: Platform Encryption

```swift
// ✅ GOOD: iOS CryptoKit
import CryptoKit

let data = "sensitive".data(using: .utf8)!
let sealed = try AES.GCM.seal(data)
// sealed contains nonce + ciphertext + tag
```

```kotlin
// ✅ GOOD: Android encrypted database
val db = Room.databaseBuilder(
  context,
  AppDatabase::class.java,
  "app.db"
)
  .openHelperFactory(FrameworkSQLCipherOpenHelperFactory())
  .build()
```

---

## M6: Reverse Engineering

### What Is It?

Attackers decompile/unpack app to extract sensitive logic and data.

### Prevention: Code Obfuscation

```typescript
// React Native: Use metro bundler obfuscation
// android/app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
    }
  }
}
```

```swift
// iOS: Use Swift with name mangling
// Build settings: Enable "Require Only App-Extension-Safe API"
// Use bitcode for additional obfuscation
```

### Prevention: Remove Debug Info

```bash
# iOS: Strip debug symbols
strip app

# Android: ProGuard removes debug info
# React Native: Use production builds only
npm run build:prod
```

### Prevention: Detect Debugging

```typescript
// Detect if app is being debugged
import { Platform } from 'react-native'

if (__DEV__) {
  throw new Error('App cannot run in debug mode')
}

// Check for debug bridge
if (NativeModules.DebugBridge) {
  throw new Error('Debugger detected')
}
```

---

## M7: Extraneous Functionality

### What Is It?

Debug code, test endpoints, or backdoors left in production app.

### Vulnerable: Debug Code

```typescript
// ❌ BAD: Debug endpoints in production
if (isDebugMode) {
  apiClient.post('/admin/bypass-auth', {})
}

// ❌ BAD: Logging sensitive data
console.log('User credentials:', email, password)

// ❌ BAD: Test user hardcoded
const TEST_USER = 'test@example.com'
const TEST_PASSWORD = 'password123'
```

### Secure: Remove All Debug Code

```typescript
// ✅ GOOD: No debug code in production
if (__DEV__) {
  // Development-only code
  console.log('Debug info')
} else {
  // Production build, no debug code
}

// ✅ GOOD: Environment-based configuration
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://api.production.com'
const DEBUG_ENABLED = process.env.NODE_ENV === 'development'

// Never in production builds:
// - console.log() for sensitive data
// - Test accounts
// - Admin endpoints
// - Mock APIs
```

### Secure: Build Verification

```bash
# Verify debug symbols removed
strings app | grep -i "DEBUG"  # Should be empty

# Verify no test code
grep -r "TEST_USER\|TEST_PASSWORD" src/ || echo "No test credentials found"

# Verify no console logs of sensitive data
grep -r "console.log.*password\|email" src/ || echo "Clean"
```

---

## M8: Security Misconfiguration

### What Is It?

Improper security settings or missing security headers.

### Vulnerable: Missing Security Headers

```typescript
// ❌ BAD: No security headers
fetch('https://api.example.com/data')

// ❌ BAD: Cookies without HttpOnly flag
Set-Cookie: sessionId=abc123; Path=/
```

### Secure: Configure Security Headers

```typescript
// ✅ GOOD: CORS and security headers configured
apiClient.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

// Ensure backend sends:
// Strict-Transport-Security: max-age=31536000; includeSubDomains
// Content-Security-Policy: default-src 'self'
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// Set-Cookie: HttpOnly; Secure; SameSite=Strict
```

### Secure: iOS App Configuration

```swift
// ✅ GOOD: Info.plist security settings
{
  "NSAllowsArbitraryLoads": false,  // Require HTTPS
  "NSAllowsArbitraryLoadsInMedia": false,
  "NSAllowsArbitraryLoadsInWebContent": false,
  "NSBonjourServiceTypes": [],  // No mDNS
  "NSLocalNetworkUsageDescription": "Not used"
}
```

---

## M9: Insecure Data Transfer

### What Is It?

Interception of data in transit through vulnerable APIs.

### Prevention: Require Strong TLS

```typescript
// ✅ GOOD: Enforce minimum TLS version
import https from 'https'

const agent = new https.Agent({
  minVersion: 'TLSv1.2',
  ciphers: 'HIGH:!aNULL:!MD5',
  honorCipherOrder: true
})
```

---

## M10: Insufficient Binary Protections

### What Is It?

Apps are debuggable or allow easy modification.

### Vulnerable: Debuggable Build

```xml
<!-- ❌ BAD: AndroidManifest.xml -->
<application android:debuggable="true">
  ...
</application>
```

```swift
// ❌ BAD: Xcode build settings
Build Settings → Code Signing → Allow Provisioning Profile Changes
```

### Secure: Disable Debugging

```gradle
// ✅ GOOD: Android release configuration
android {
  buildTypes {
    release {
      debuggable false
      minifyEnabled true
      shrinkResources true
      
      signingConfig signingConfigs.release
    }
  }
}
```

### Prevention: Code Signing

```bash
# ✅ GOOD: Sign all releases with keys
# iOS: Automatic code signing with development team
xcodebuild -scheme MyApp -configuration Release archive

# Android: Sign with release keystore
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore release.keystore app.apk alias_name
```

---

## Security Checklist

Before Launch:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All data in secure storage (Keychain/Keystore)
- [ ] HTTPS enforced, SSL pinning implemented
- [ ] OAuth 2.0 or similar for authentication
- [ ] Biometric authentication available
- [ ] No debug code in release builds
- [ ] No console logging of sensitive data
- [ ] App not debuggable
- [ ] Code obfuscated/minified
- [ ] Security headers configured
- [ ] Input validation on all fields
- [ ] Output encoding for web views
- [ ] Rate limiting configured
- [ ] Error messages don't leak information
- [ ] Tested with Burp Suite / Charles Proxy

---

## Vulnerability Testing Tools

- **MobSF (Mobile Security Framework)** - APK/IPA analysis
- **Burp Suite Community** - API testing, certificate inspection
- **Charles Proxy** - Inspect/modify network traffic
- **Frida** - Runtime instrumentation and injection
- **Drozer** - Android security assessment
- **Xcode Debugger** - iOS debugging (verify it's disabled)

---

## Resources

- [OWASP Mobile Security Top 10 2024](https://owasp.org/www-project-mobile-top-10/)
- [OWASP Mobile Application Security Testing Guide (MASTG)](https://mas.owasp.org/)
- [Mobile Security Testing Guide (MSTG)](https://github.com/OWASP/owasp-mstg)
