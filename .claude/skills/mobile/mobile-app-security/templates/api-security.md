# API Security: SSL Pinning & Request Signing

Secure communication between mobile app and backend is critical. This template covers certificate pinning, request signing, and API security best practices.

---

## SSL/TLS Certificate Pinning

### Why Pinning?

Even if a device's certificate store is compromised, pinning ensures your app only communicates with YOUR server's certificate.

```
Without Pinning:
Attacker → MITM Proxy (with device cert) → Your App
Result: Attacker can intercept all HTTPS traffic

With Pinning:
Attacker → MITM Proxy (doesn't match pinned cert) → Your App
Result: App rejects connection, attacker blocked
```

---

## React Native: SSL Pinning

### Installation

```bash
npm install react-native-network-adapter-interceptor
# or
npm install axios react-native-certificate-pinning
```

### Implementation with Axios

```typescript
import axios from 'axios'
import { ReactNativeCertificatePin } from 'react-native-certificate-pinning'

// Export certificate (convert .cer to base64)
const certificateHash = 'sha256/f3fZpwY9khjE...=='

export const apiClient = axios.create({
  baseURL: 'https://api.myapp.com',
  timeout: 10000
})

// Add interceptor for certificate pinning
apiClient.interceptors.request.use(async (config) => {
  try {
    // Verify certificate before sending request
    const trustChain = await ReactNativeCertificatePin.fetchPublicKeyFromServer(config.url!)
    
    if (!verifyPublicKeyPin(trustChain, certificateHash)) {
      throw new Error('Certificate validation failed')
    }
  } catch (error) {
    return Promise.reject(new Error('Certificate pinning failed'))
  }
  
  return config
})

function verifyPublicKeyPin(trustChain: string[], expectedPin: string): boolean {
  return trustChain.some(pin => pin === expectedPin)
}
```

### Implementation with React Query

```typescript
import { QueryClient, useQuery } from '@tanstack/react-query'
import { ReactNativeCertificatePin } from 'react-native-certificate-pinning'

const pinnedFetch = async (url: string, options?: RequestInit) => {
  try {
    // Verify certificate before request
    const trustChain = await ReactNativeCertificatePin.fetchPublicKeyFromServer(url)
    
    if (!trustChain.includes('sha256/f3fZpwY9khjE...==')) {
      throw new Error('Certificate validation failed')
    }
    
    // Proceed with request
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    throw new Error(`Network request failed: ${error}`)
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        return pinnedFetch(queryKey[0] as string)
      }
    }
  }
})

// Usage
function useUserData(userId: string) {
  return useQuery({
    queryKey: [`https://api.myapp.com/users/${userId}`],
    queryFn: ({ queryKey }) => pinnedFetch(queryKey[0])
  })
}
```

---

## iOS: SSL Pinning

### URLSessionDelegate with Certificate Pinning

```swift
import Foundation

class CertificatePinningDelegate: NSObject, URLSessionDelegate {
  let certificateData: [Data]
  
  init(certificates: [Data]) {
    self.certificateData = certificates
    super.init()
  }
  
  func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    // Validate certificate
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
          let serverTrust = challenge.protectionSpace.serverTrust else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }
    
    // Perform default validation
    var secResult = SecTrustResultType.invalid
    let status = SecTrustEvaluate(serverTrust, &secResult)
    
    guard status == errSecSuccess else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }
    
    // Verify pinned certificate
    let certificateCount = SecTrustGetCertificateCount(serverTrust)
    
    for i in 0..<certificateCount {
      guard let certificate = SecTrustGetCertificateAtIndex(serverTrust, i) else {
        continue
      }
      
      let certificateData = SecCertificateCopyData(certificate) as Data
      
      if self.certificateData.contains(certificateData) {
        let credential = URLCredential(trust: serverTrust)
        completionHandler(.useCredential, credential)
        return
      }
    }
    
    // Certificate not in pinned list
    completionHandler(.cancelAuthenticationChallenge, nil)
  }
}

// Usage
class APIManager {
  let session: URLSession
  
  init(pinnedCertificates: [Data]) {
    let delegate = CertificatePinningDelegate(certificates: pinnedCertificates)
    let config = URLSessionConfiguration.default
    self.session = URLSession(configuration: config, delegate: delegate, delegateQueue: nil)
  }
  
  func fetchUser(id: String) async throws -> User {
    let url = URL(string: "https://api.myapp.com/users/\(id)")!
    let (data, _) = try await session.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
  }
}

// Load certificates
let certificates = [
  try Data(contentsOf: Bundle.main.url(forResource: "api", withExtension: "cer")!),
  try Data(contentsOf: Bundle.main.url(forResource: "api-backup", withExtension: "cer")!)
]

let apiManager = APIManager(pinnedCertificates: certificates)
```

---

## Android: SSL Pinning

### Network Security Configuration

Create `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.myapp.com</domain>
        <pin-set expiration="2026-10-18">
            <!-- Primary certificate pin -->
            <pin digest="SHA-256">f3fZpwY9khjEpHR9+XlK9z5...==</pin>
            <!-- Backup certificate pin (for rotation) -->
            <pin digest="SHA-256">khjEpHR9+XlK9z5f3fZpwY9...==</pin>
        </pin-set>
    </domain-config>
    
    <!-- Default configuration for other domains -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">*</domain>
    </domain-config>
</network-security-config>
```

Add to `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
    <!-- ... -->
</application>
```

### Programmatic Pinning

```kotlin
import okhttp3.OkHttpClient
import okhttp3.CertificatePinner
import java.util.concurrent.TimeUnit

class ApiClient {
  companion object {
    fun createHttpClient(): OkHttpClient {
      val certificatePinner = CertificatePinner.Builder()
        .add(
          "api.myapp.com",
          "sha256/f3fZpwY9khjEpHR9+XlK9z5...=="  // Primary
        )
        .add(
          "api.myapp.com",
          "sha256/khjEpHR9+XlK9z5f3fZpwY9...=="  // Backup
        )
        .build()
      
      return OkHttpClient.Builder()
        .certificatePinner(certificatePinner)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    }
  }
}

// With Retrofit
val client = ApiClient.createHttpClient()
val retrofit = Retrofit.Builder()
  .baseUrl("https://api.myapp.com")
  .client(client)
  .addConverterFactory(GsonConverterFactory.create())
  .build()
```

---

## Request Signing & HMAC

### Signing Requests to Verify Authenticity

```typescript
import crypto from 'crypto'

export async function signRequest(
  method: string,
  path: string,
  timestamp: string,
  body?: string
): Promise<string> {
  const secretKey = await getAPISecret() // From secure storage
  
  // Create signature string
  const signatureString = [
    method.toUpperCase(),
    path,
    timestamp,
    body || ''
  ].join('\n')
  
  // Create HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString)
    .digest('base64')
  
  return signature
}

// Middleware to add signature to requests
apiClient.interceptors.request.use(async (config) => {
  const timestamp = Date.now().toString()
  const signature = await signRequest(
    config.method || 'GET',
    config.url || '',
    timestamp,
    config.data ? JSON.stringify(config.data) : undefined
  )
  
  config.headers['X-Request-Timestamp'] = timestamp
  config.headers['X-Request-Signature'] = signature
  
  return config
})
```

### Verify on Backend

```typescript
// Backend verification
export function verifyRequest(
  method: string,
  path: string,
  timestamp: string,
  signature: string,
  body?: string
): boolean {
  // Check timestamp (prevent replay attacks)
  const requestAge = Date.now() - parseInt(timestamp)
  if (requestAge > 5 * 60 * 1000) { // 5 minutes
    return false
  }
  
  // Verify signature
  const expectedSignature = createSignature(method, path, timestamp, body)
  
  // Use timing-safe comparison
  return timingSafeEqual(signature, expectedSignature)
}
```

---

## API Rate Limiting & Retry Logic

### Exponential Backoff with Circuit Breaker

```typescript
interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}

export async function apiCallWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null
  let delay = config.initialDelayMs
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error
      }
      
      // Don't retry on 429 unless it has Retry-After header
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          const waitTime = parseInt(retryAfter) * 1000
          await sleep(waitTime)
          continue
        }
        throw error
      }
      
      if (attempt < config.maxRetries - 1) {
        await sleep(delay)
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs)
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Usage
const user = await apiCallWithRetry(() => 
  apiClient.get('/api/users/123')
)
```

---

## Certificate Pinning Management

### Handling Certificate Rotation

```typescript
// Include backup pins for rotation
const pins = [
  'sha256/current_certificate_pin',
  'sha256/backup_certificate_pin_for_rotation',
  'sha256/future_certificate_pin'
]

// Update app when rotating certificates
// 1. Add new pin to backup pins (release v1)
// 2. Rotate certificate on server (downtime: minimal)
// 3. Remove old pin from pinned list (release v2)
```

### Testing Certificate Pinning

```typescript
// Test that pinning works
test('rejects invalid certificate', async () => {
  // Mock invalid certificate response
  mockHttpClient.useInvalidCertificate()
  
  expect(() => apiClient.get('/api/users')).rejects.toThrow(
    'Certificate validation failed'
  )
})

test('accepts valid certificate', async () => {
  // Mock valid certificate response
  mockHttpClient.useValidCertificate()
  
  const response = await apiClient.get('/api/users')
  expect(response.status).toBe(200)
})
```

---

## Security Checklist

Before Launch:
- [ ] All API endpoints use HTTPS
- [ ] SSL certificate pinning configured
- [ ] Backup certificates configured
- [ ] Request signing implemented
- [ ] Signature validation on backend
- [ ] Rate limiting configured
- [ ] Exponential backoff retry logic
- [ ] Timestamp validation (prevent replay)
- [ ] No sensitive data in logs
- [ ] No debugging code in production
- [ ] Certificate expiration monitored
- [ ] Tested with SSL Stripping tools
- [ ] Tested with Charles/Burp Suite (pinning holds)

Best Practices:
✅ Implement both pinning strategies (public key + certificate)
✅ Monitor certificate expiration dates
✅ Keep backup pins updated
✅ Test pinning in staging environment
✅ Plan certificate rotation strategy
✅ Document pin rotation process
✅ Consider backup CDN with different certificate
✅ Implement pin refresh/update mechanism

Common Mistakes:
❌ Only pinning leaf certificate (should pin intermediate)
❌ Forgetting backup pins (breaks on certificate rotation)
❌ Not testing pinning thoroughly
❌ Hardcoding pins in code (should be configurable)
❌ Setting expiration too far in future (limits flexibility)
