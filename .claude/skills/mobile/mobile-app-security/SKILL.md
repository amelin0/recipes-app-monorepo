---
name: Mobile App Security
description: Master secure mobile development across iOS, Android, and React Native with authentication, data protection, API security, and compliance frameworks
tags: [mobile, security, authentication, data-protection, api-security, privacy, compliance, encryption]
version: 1.0
---

# Mobile App Security

## When Claude Should Use This Skill

- Implementing authentication and authorization
- Building secure credential storage
- Securing API communication (SSL pinning, certificate validation)
- Handling sensitive user data
- Protecting against common mobile vulnerabilities (OWASP Mobile Top 10)
- Implementing biometric authentication
- Managing app permissions
- Building secure deeplinks
- Compliance requirements (GDPR, CCPA, HIPAA)
- Vulnerability assessment and remediation
- Code obfuscation and anti-tampering

---

## Mobile Security Architecture

```
┌─────────────────────────────────────────────────────┐
│        User-Facing Security (UI/UX)                 │
│  - Biometric prompts, security dialogs              │
├─────────────────────────────────────────────────────┤
│        App-Level Security                            │
│  - Input validation, output encoding, sanitization  │
├─────────────────────────────────────────────────────┤
│        Data Protection Layer                         │
│  - Encryption, secure storage, key management       │
├─────────────────────────────────────────────────────┤
│        Network Security                              │
│  - HTTPS, SSL pinning, certificate validation       │
├─────────────────────────────────────────────────────┤
│        Platform Security (OS-Level)                  │
│  - Keychain (iOS), Keystore (Android), Secure*      │
└─────────────────────────────────────────────────────┘
```

---

## Security Pillars

### 1. Authentication & Authorization

**OAuth 2.0** - Industry standard for delegated access
- Authorization Code Flow (recommended for mobile)
- Proof Key for Public Clients (PKCE)
- Refresh token rotation

**JWT (JSON Web Tokens)** - Stateless authentication
- Signed tokens (RS256, HS256)
- Token expiration and refresh
- Payload validation

**Biometric Authentication** - Platform-native security
- Face ID (iOS)
- Touch ID (iOS)
- Biometric (Android)
- Fallback to PIN/password

**MFA (Multi-Factor Authentication)**
- TOTP (Time-based One-Time Password)
- SMS verification (less secure)
- Push notifications

### 2. Data Protection

**Encryption at Rest**:
- Keychain (iOS) - automatic encryption
- Keystore (Android) - hardware-backed encryption
- Room Database encryption (Android)
- Realm encryption (cross-platform)

**Encryption in Transit**:
- TLS 1.2+ enforced
- Certificate pinning
- Perfect Forward Secrecy

**Key Management**:
- Never hardcode keys
- Use platform-provided key storage
- Rotate keys periodically
- Separate keys for different purposes

### 3. API Security

**Certificate Pinning** - Prevent MITM attacks
- Public key pinning
- Certificate pinning
- Backup pins

**Request Signing** - Verify request authenticity
- HMAC-SHA256 signature
- Request timestamp validation
- Nonce to prevent replay attacks

**API Rate Limiting** - Prevent abuse
- Rate limiting headers
- Exponential backoff retry
- Circuit breaker pattern

### 4. Input Validation & Output Encoding

**Input Validation**:
- Whitelist allowed characters
- Validate data types
- Check length constraints
- Validate email/URL formats

**Output Encoding**:
- HTML encode for web views
- SQL escape for database queries
- JSON encoding for APIs
- URL encoding for parameters

### 5. Vulnerability Prevention

**Common Mobile Vulnerabilities** (OWASP Top 10):
1. **M1: Improper Platform Usage** - Misuse of iOS/Android APIs
2. **M2: Insecure Data Storage** - Unencrypted sensitive data
3. **M3: Insecure Communication** - Unencrypted network traffic
4. **M4: Insecure Authentication** - Weak credential management
5. **M5: Insufficient Cryptography** - Weak encryption algorithms
6. **M6: Reverse Engineering** - Easily decompiled/unpacked apps
7. **M7: Extraneous Functionality** - Debug code in production
8. **M8: Security Misconfiguration** - Insecure platform settings
9. **M9: Insecure Data Transfer** - Interception vulnerable APIs
10. **M10: Insufficient Binary Protections** - Debuggable apps

---

## Authentication Strategies

### OAuth 2.0 with PKCE (Recommended)

```
1. App generates code_challenge and code_verifier
2. Opens browser to authorization endpoint
3. User authenticates with provider
4. Provider redirects with authorization code
5. App exchanges code + code_verifier for token
6. App uses access_token for API calls
```

### JWT Token Lifecycle

```
1. Login: Receive access_token (short-lived: 15 min)
2. Refresh: Receive refresh_token (long-lived: 7 days)
3. When access_token expires: Use refresh_token to get new one
4. Store refresh_token in secure storage (Keychain/Keystore)
5. If refresh fails: Force user to re-authenticate
```

---

## Secure Storage Pattern

### iOS (Keychain)

```swift
// Good: Use Keychain
let password = "user_password"
let query: [String: Any] = [
    kSecClass: kSecClassGenericPassword,
    kSecAttrAccount: "user_email",
    kSecValueData: password.data(using: .utf8)!
]
SecItemAdd(query as CFDictionary, nil)
```

### Android (Keystore)

```kotlin
// Good: Use Keystore
val keyStore = KeyStore.getInstance("AndroidKeyStore")
keyStore.load(null)
val key = keyStore.getKey("auth_key", null)
// Use key for encryption
```

### React Native

```typescript
// Good: Use react-native-keychain
import * as Keychain from 'react-native-keychain'

await Keychain.setGenericPassword('username', 'password')
const credentials = await Keychain.getGenericPassword()
```

---

## Network Security

### SSL Certificate Pinning

**Why**: Prevent man-in-the-middle attacks even if device certificate store is compromised

```typescript
// React Native: Pin certificate
const client = axios.create({
  httpAgent: createAdapter({
    certificates: [require('path/to/cert.pem')]
  })
})
```

### Never Do This

❌ Allow insecure connections
```typescript
// BAD: Disables SSL verification
axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false })
```

✅ Always enforce HTTPS
```typescript
// GOOD: Enforce SSL/TLS
const httpsAgent = new https.Agent({ rejectUnauthorized: true })
```

---

## Sensitive Data Handling

❌ **Never**:
- Store passwords in plaintext
- Log sensitive data
- Cache credentials in memory without cleanup
- Include secrets in source code
- Hardcode API keys

✅ **Always**:
- Store tokens in secure storage (Keychain/Keystore)
- Use environment variables for secrets
- Clear sensitive data from memory after use
- Validate all input
- Use HTTPS for all communication

---

## Platform-Specific Hardening

### iOS Hardening

- **Use Keychain** for credentials (not UserDefaults)
- **Enable App Transport Security** (require HTTPS)
- **Code signing** with development team
- **Entitlements** to restrict capabilities
- **NSLocalizedString** for user-facing strings (avoid secrets)

### Android Hardening

- **Use Keystore** for keys (not SharedPreferences)
- **Encrypt SharedPreferences** with EncryptedSharedPreferences
- **Enforce minimum API level**
- **Use Android Security & Privacy Year-Class library**
- **App Signature verification** for inter-app communication

### React Native Hardening

- **react-native-keychain** for credentials
- **react-native-config** for environment-based config
- **react-native-securerandom** for generating cryptographic random numbers
- **react-native-sensitive-info** for encrypted storage
- **Disable remote debugging** in production

---

## Biometric Authentication Flow

```
User taps "Login with Biometric"
  ↓
Check if biometric available
  ↓
Trigger biometric prompt (Face ID / Touch ID / Fingerprint)
  ↓
If successful: Retrieve stored credentials from Keychain
  ↓
Authenticate user with backend API
  ↓
If successful: Grant access, store session token
```

---

## Vulnerability Scanning

### Tools

- **OWASP Mobile Security Testing Guide** - Comprehensive checklist
- **MobSF (Mobile Security Framework)** - APK/IPA analysis
- **Burp Suite Mobile** - Dynamic testing
- **Frida** - Runtime instrumentation
- **Xcode/Android Studio Security Checklist**

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Scan for vulnerabilities
  run: |
    npm audit
    npm run security-scan
    
- name: SAST with Snyk
  run: snyk test
```

---

## Compliance Frameworks

### GDPR (EU Data Protection)

- Obtain explicit consent before collecting data
- Provide data export functionality
- Implement data deletion ("right to be forgotten")
- Document data processing activities
- Encrypt personal data

### CCPA (California Consumer Privacy Act)

- Disclose data collection practices
- Allow consumers to opt-out of sale
- Implement opt-out mechanisms
- Respond to data access requests within 45 days

### HIPAA (Health Information Portability and Accountability Act)

- End-to-end encryption for health data
- Access logs and audit trails
- Business Associate Agreements (BAA)
- Breach notification procedures

### App Store Requirements

- **iOS (App Store)**: Privacy Policy required, permission justification
- **Android (Play Store)**: Declared permissions, data deletion on uninstall
- **Both**: Age rating, content description, privacy labels

---

## Common Mistakes to Avoid

❌ **Storing passwords** in SharedPreferences/UserDefaults
❌ **Using HTTP** instead of HTTPS
❌ **Logging sensitive data** (tokens, passwords)
❌ **Hardcoding API keys** in source code
❌ **Trusting all certificates** (disabled SSL verification)
❌ **Weak encryption** (MD5, SHA1, DES)
❌ **Reusing tokens** across apps
❌ **No token expiration** (tokens valid forever)
❌ **Missing input validation** (SQL injection, XSS)
❌ **Debuggable apps in production**

---

## Security Checklist

Before Launch:
- [ ] Authentication properly implemented (OAuth2 or JWT)
- [ ] All credentials in secure storage (Keychain/Keystore)
- [ ] API communication uses HTTPS + SSL pinning
- [ ] Input validation on all user inputs
- [ ] Output encoding for web views
- [ ] No hardcoded secrets or API keys
- [ ] Sensitive data cleared from memory
- [ ] Biometric authentication tested
- [ ] Permissions follow principle of least privilege
- [ ] No debug logging in production
- [ ] Code obfuscated/minified
- [ ] Vulnerability scan completed
- [ ] Privacy policy updated
- [ ] GDPR/CCPA compliance verified
- [ ] Third-party dependencies audited

---

## Decision Matrix

| Scenario | Solution |
|----------|----------|
| **New user login** | OAuth 2.0 + PKCE |
| **Returning user** | JWT with refresh token |
| **Sensitive credential** | Keychain (iOS) / Keystore (Android) |
| **API protection** | HTTPS + SSL pinning + HMAC signature |
| **User identification** | Biometric + PIN fallback |
| **Health data** | End-to-end encryption + HIPAA compliance |
| **EU users** | GDPR consent + data export |
| **Debug mode** | Disable in production builds |

---

## Related Skills

This skill complements:
- **Cross-Platform Mobile Patterns** - Secure shared architecture
- **Mobile Architecture & Patterns** - Architectural security
- **React Native Architecture** - React Native-specific security
- **Backend API Design** - API security from backend perspective

---

**Version**: 1.0 | **Last Updated**: 2025-10-18
