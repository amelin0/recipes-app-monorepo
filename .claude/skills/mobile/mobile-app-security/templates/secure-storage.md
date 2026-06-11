# Secure Storage Implementation

Sensitive data (credentials, tokens, API keys) must be stored in platform-provided secure storage, never in SharedPreferences, UserDefaults, or plain files.

---

## React Native: Keychain Storage

### Installation

```bash
npm install react-native-keychain
# For Expo
expo install react-native-keychain

# Autolinking (React Native 0.60+)
# No additional setup needed
```

### Implementation

```typescript
import * as Keychain from 'react-native-keychain'

// Store credentials
export async function saveCredentials(username: string, password: string) {
  try {
    await Keychain.setGenericPassword(username, password, {
      service: 'com.myapp.credentials',
      accessibleWhenUnlocked: true
    })
    console.log('Credentials saved')
  } catch (error) {
    console.error('Failed to save credentials:', error)
  }
}

// Retrieve credentials
export async function getCredentials(): Promise<{ username: string; password: string } | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.myapp.credentials'
    })
    
    if (!credentials) {
      return null
    }
    
    return {
      username: credentials.username,
      password: credentials.password
    }
  } catch (error) {
    console.error('Failed to retrieve credentials:', error)
    return null
  }
}

// Delete credentials
export async function deleteCredentials() {
  try {
    await Keychain.resetGenericPassword({
      service: 'com.myapp.credentials'
    })
    console.log('Credentials deleted')
  } catch (error) {
    console.error('Failed to delete credentials:', error)
  }
}

// Store API token
export async function saveToken(token: string, key: string = 'auth_token') {
  try {
    await Keychain.setGenericPassword(key, token, {
      service: 'com.myapp.tokens',
      accessibleWhenUnlockedThisDeviceOnly: true // Only accessible when device is unlocked
    })
  } catch (error) {
    console.error('Failed to save token:', error)
  }
}

// Retrieve API token
export async function getToken(key: string = 'auth_token'): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.myapp.tokens'
    })
    
    return credentials ? credentials.password : null
  } catch (error) {
    console.error('Failed to retrieve token:', error)
    return null
  }
}

// Check if credentials exist
export async function hasCredentials(): Promise<boolean> {
  try {
    const credentials = await Keychain.getGenericPassword()
    return !!credentials
  } catch (error) {
    return false
  }
}
```

### iOS-Specific Options

```typescript
// Store with biometric access
export async function saveBiometricToken(token: string) {
  await Keychain.setGenericPassword('biometric_token', token, {
    service: 'com.myapp.biometric',
    accessibleWhenUnlockedThisDeviceOnly: true,
    // Requires user authentication (Face ID, Touch ID)
    authenticateOnAccess: true
  })
}

// Retrieve biometric token (user must authenticate)
export async function getBiometricToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.myapp.biometric'
    })
    return credentials ? credentials.password : null
  } catch (error) {
    // User cancelled authentication
    return null
  }
}
```

---

## iOS (Swift): Keychain

### Direct Keychain Access

```swift
import Security

class KeychainManager {
  static let shared = KeychainManager()
  
  // Save to Keychain
  func save(_ value: String, forKey key: String) throws {
    let data = value.data(using: .utf8)
    
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrService as String: Bundle.main.bundleIdentifier ?? "",
      kSecValueData as String: data as Any,
      kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    ]
    
    // Delete existing if present
    SecItemDelete(query as CFDictionary)
    
    let status = SecItemAdd(query as CFDictionary, nil)
    
    guard status == errSecSuccess else {
      throw KeychainError.operationFailed(status)
    }
  }
  
  // Retrieve from Keychain
  func retrieve(forKey key: String) throws -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrService as String: Bundle.main.bundleIdentifier ?? "",
      kSecReturnData as String: true
    ]
    
    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    guard status == errSecSuccess else {
      if status == errSecItemNotFound {
        return nil
      }
      throw KeychainError.operationFailed(status)
    }
    
    guard let data = result as? Data else {
      return nil
    }
    
    return String(data: data, encoding: .utf8)
  }
  
  // Delete from Keychain
  func delete(forKey key: String) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrService as String: Bundle.main.bundleIdentifier ?? ""
    ]
    
    let status = SecItemDelete(query as CFDictionary)
    
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw KeychainError.operationFailed(status)
    }
  }
}

enum KeychainError: Error {
  case operationFailed(OSStatus)
}

// Usage
try KeychainManager.shared.save("auth_token_123", forKey: "authToken")
let token = try KeychainManager.shared.retrieve(forKey: "authToken")
```

### Using CryptoKit for Encryption

```swift
import CryptoKit

class EncryptedKeychainManager {
  func saveEncrypted(_ value: String, forKey key: String) throws {
    // Generate encryption key
    let sealedBox = try AES.GCM.seal(
      value.data(using: .utf8) ?? Data(),
      using: generateEncryptionKey()
    )
    
    // Store in Keychain
    // ...
  }
  
  private func generateEncryptionKey() -> SymmetricKey {
    let keyData = Data(base64Encoded: "your_base64_encoded_key")!
    return SymmetricKey(data: keyData)
  }
}
```

---

## Android (Kotlin): Keystore

### EncryptedSharedPreferences

```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureStorage(context: Context) {
  private val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()
  
  private val prefs = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
  )
  
  // Save value
  fun save(key: String, value: String) {
    prefs.edit().putString(key, value).apply()
  }
  
  // Retrieve value
  fun retrieve(key: String): String? {
    return prefs.getString(key, null)
  }
  
  // Delete value
  fun delete(key: String) {
    prefs.edit().remove(key).apply()
  }
}

// Usage
val storage = SecureStorage(context)
storage.save("authToken", "token_123")
val token = storage.retrieve("authToken")
```

### Using Keystore Directly

```kotlin
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import java.security.KeyStore

class KeystoreManager(context: Context) {
  private val keyStore: KeyStore = KeyStore.getInstance("AndroidKeyStore").apply {
    load(null)
  }
  
  private val cipher: Cipher = Cipher.getInstance(
    KeyProperties.KEY_ALGORITHM_AES + "/" +
    KeyProperties.BLOCK_MODE_CBC + "/" +
    KeyProperties.ENCRYPTION_PADDING_PKCS7
  )
  
  fun generateKey(keyAlias: String) {
    val keyGenerator = KeyGenerator.getInstance(
      KeyProperties.KEY_ALGORITHM_AES,
      "AndroidKeyStore"
    )
    
    val keySpec = KeyGenParameterSpec.Builder(
      keyAlias,
      KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
    )
      .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
      .setUserAuthenticationRequired(true) // Require biometric/PIN
      .setUserAuthenticationValidityDurationSeconds(300) // Valid for 5 minutes
      .build()
    
    keyGenerator.init(keySpec)
    keyGenerator.generateKey()
  }
  
  fun encrypt(plainText: String, keyAlias: String): ByteArray {
    val key = keyStore.getKey(keyAlias, null) as SecretKey
    cipher.init(Cipher.ENCRYPT_MODE, key)
    
    return cipher.doFinal(plainText.toByteArray())
  }
  
  fun decrypt(cipherText: ByteArray, keyAlias: String): String {
    val key = keyStore.getKey(keyAlias, null) as SecretKey
    cipher.init(Cipher.DECRYPT_MODE, key)
    
    return String(cipher.doFinal(cipherText))
  }
}

// Usage
val keystoreManager = KeystoreManager(context)
keystoreManager.generateKey("authKeyAlias")
val encrypted = keystoreManager.encrypt("secret_token", "authKeyAlias")
val decrypted = keystoreManager.decrypt(encrypted, "authKeyAlias")
```

---

## Best Practices Checklist

✅ **Use platform-provided storage**:
- iOS: Keychain
- Android: Keystore or EncryptedSharedPreferences
- React Native: react-native-keychain

✅ **Store securely**:
- [ ] Authentication tokens
- [ ] Refresh tokens
- [ ] User credentials
- [ ] Encryption keys
- [ ] API keys (if needed on client)

✅ **Set accessibility correctly**:
- [ ] Use `WhenUnlockedThisDeviceOnly` (most restrictive)
- [ ] Enable biometric authentication for sensitive data
- [ ] Set appropriate expiration times

✅ **Implement cleanup**:
- [ ] Delete tokens on logout
- [ ] Clear session data on app termination
- [ ] Revoke tokens on server

❌ **Never store in**:
- UserDefaults (iOS)
- SharedPreferences (Android) - unencrypted
- Realm without encryption
- Plain text files
- Application cache
- Logs or debugging output

---

## Migrating Insecure Storage

If your app currently uses insecure storage:

1. **Create migration path**:
```typescript
export async function migrateToSecureStorage() {
  // Read from insecure location
  const insecureToken = await insecureStorage.getToken()
  
  if (insecureToken) {
    // Store securely
    await secureStorage.saveToken(insecureToken)
    
    // Delete from insecure location
    await insecureStorage.deleteToken()
  }
}

// Call on app startup
useEffect(() => {
  migrateToSecureStorage()
}, [])
```

2. **Test thoroughly** on all devices
3. **Monitor for crashes** during rollout
4. **Keep both paths** briefly for backwards compatibility
5. **Gradually phase out** insecure storage

---

## Security Testing

Test your secure storage:

```swift
// iOS: Verify Keychain accessibility
let query = [
  kSecClass: kSecClassGenericPassword,
  kSecAttrAccount: "test_key"
]
var result: AnyObject?
let status = SecItemCopyMatching(query as CFDictionary, &result)
XCTAssertEqual(status, errSecSuccess) // Should succeed
```

```kotlin
// Android: Verify encryption
val original = "secret"
val encrypted = keystoreManager.encrypt(original, "testKey")
val decrypted = keystoreManager.decrypt(encrypted, "testKey")
Assert.assertEquals(original, decrypted)
```
