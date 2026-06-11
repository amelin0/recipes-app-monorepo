# OAuth 2.0 + PKCE Authentication Implementation

## Overview

OAuth 2.0 with PKCE (Proof Key for Public Clients) is the recommended authentication flow for mobile apps. It allows users to authenticate without the app ever handling their password.

---

## Flow Diagram

```
┌─────────────┐                    ┌──────────────┐
│  Mobile App │                    │   Provider   │
│             │                    │   (Google,   │
│             │                    │  Apple, etc) │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │ 1. Generate code_challenge       │
       │    code_verifier                 │
       │                                  │
       │ 2. Launch browser with          │
       │    code_challenge                │
       ├─────────────────────────────────>│
       │                                  │
       │                         3. User logs in
       │                                  │
       │ 4. Redirect with auth_code      │
       │<─────────────────────────────────┤
       │                                  │
       │ 5. Exchange code + code_verifier │
       ├─────────────────────────────────>│
       │    with code_challenge           │
       │                                  │
       │ 6. Return access_token           │
       │<─────────────────────────────────┤
       │                                  │
       │ 7. Fetch user profile with       │
       │    access_token                  │
       ├─────────────────────────────────>│
       │                                  │
       │ 8. Return user data              │
       │<─────────────────────────────────┤
```

---

## React Native Implementation

### Step 1: Generate PKCE Challenge

```typescript
import * as Crypto from 'expo-crypto'

export async function generatePKCEChallenge(): Promise<{
  codeVerifier: string
  codeChallenge: string
}> {
  // Generate random 43-128 character string
  const codeVerifier = Buffer.from(Crypto.getRandomBytes(32)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Create challenge by hashing verifier
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier)
  const codeChallenge = Buffer.from(digest).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return { codeVerifier, codeChallenge }
}
```

### Step 2: Launch Authorization URL

```typescript
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'

export async function initiateLogin(
  clientId: string,
  redirectUrl: string,
  provider: 'google' | 'apple' | 'custom'
) {
  const { codeVerifier, codeChallenge } = await generatePKCEChallenge()
  
  // Store code_verifier securely (will use for token exchange)
  await Keychain.setGenericPassword('pkce_verifier', codeVerifier)
  
  const authUrl = new URL('https://provider.com/oauth/authorize')
  authUrl.searchParams.append('client_id', clientId)
  authUrl.searchParams.append('redirect_uri', redirectUrl)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', 'profile email')
  authUrl.searchParams.append('code_challenge', codeChallenge)
  authUrl.searchParams.append('code_challenge_method', 'S256')
  authUrl.searchParams.append('state', generateRandomState())
  
  // Launch browser
  const result = await WebBrowser.openAuthSessionAsync(
    authUrl.toString(),
    redirectUrl
  )
  
  if (result.type === 'success' && result.url) {
    const url = new URL(result.url)
    const authCode = url.searchParams.get('code')
    
    if (authCode) {
      await exchangeCodeForToken(authCode, clientId, redirectUrl)
    }
  }
}
```

### Step 3: Exchange Code for Token

```typescript
import * as Keychain from 'react-native-keychain'

export async function exchangeCodeForToken(
  authCode: string,
  clientId: string,
  redirectUri: string
) {
  // Retrieve stored code_verifier
  const credentials = await Keychain.getGenericPassword('pkce_verifier')
  const codeVerifier = credentials ? credentials.password : null
  
  if (!codeVerifier) {
    throw new Error('Code verifier not found')
  }
  
  try {
    const response = await fetch('https://provider.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }).toString()
    })
    
    if (!response.ok) {
      throw new Error('Token exchange failed')
    }
    
    const data = await response.json()
    
    // Store tokens securely
    await storeTokensSecurely(data.access_token, data.refresh_token)
    
    return data.access_token
  } finally {
    // Clear code_verifier from storage
    await Keychain.resetGenericPassword('pkce_verifier')
  }
}
```

### Step 4: Store Tokens Securely

```typescript
export async function storeTokensSecurely(
  accessToken: string,
  refreshToken: string
) {
  // Store access token (short-lived, 15 minutes)
  await Keychain.setGenericPassword(
    'oauth_access_token',
    accessToken
  )
  
  // Store refresh token (long-lived, 7 days)
  await Keychain.setGenericPassword(
    'oauth_refresh_token',
    refreshToken
  )
  
  // Store token expiration time
  const expiresAt = Date.now() + (15 * 60 * 1000) // 15 minutes
  await Keychain.setGenericPassword(
    'oauth_expires_at',
    expiresAt.toString()
  )
}

export async function getAccessToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword('oauth_access_token')
  
  if (!credentials) {
    return null
  }
  
  // Check if token expired
  const expiresAtCreds = await Keychain.getGenericPassword('oauth_expires_at')
  const expiresAt = expiresAtCreds ? parseInt(expiresAtCreds.password) : Date.now()
  
  if (Date.now() > expiresAt - (60 * 1000)) { // 1 minute buffer
    // Token expired, refresh it
    return await refreshAccessToken()
  }
  
  return credentials.password
}
```

### Step 5: Refresh Token When Expired

```typescript
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshTokenCreds = await Keychain.getGenericPassword('oauth_refresh_token')
    
    if (!refreshTokenCreds) {
      // No refresh token, need to re-authenticate
      throw new Error('No refresh token available')
    }
    
    const response = await fetch('https://provider.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshTokenCreds.password,
        client_id: YOUR_CLIENT_ID
      }).toString()
    })
    
    if (!response.ok) {
      // Refresh failed, force re-authentication
      await logout()
      throw new Error('Token refresh failed')
    }
    
    const data = await response.json()
    await storeTokensSecurely(data.access_token, data.refresh_token)
    
    return data.access_token
  } catch (error) {
    // Force logout on any error
    await logout()
    return null
  }
}
```

### Step 6: Use Token in API Requests

```typescript
export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch(`https://api.provider.com${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.status === 401) {
    // Token invalid, try refreshing
    const newToken = await refreshAccessToken()
    
    if (!newToken) {
      throw new Error('Not authenticated')
    }
    
    // Retry request with new token
    return apiCall(endpoint, options)
  }
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}
```

### Step 7: Logout

```typescript
export async function logout() {
  // Clear all stored credentials
  await Keychain.resetGenericPassword('oauth_access_token')
  await Keychain.resetGenericPassword('oauth_refresh_token')
  await Keychain.resetGenericPassword('oauth_expires_at')
  await Keychain.resetGenericPassword('pkce_verifier')
  
  // Optional: Revoke token on server
  try {
    await fetch('https://provider.com/oauth/revoke', {
      method: 'POST',
      body: new URLSearchParams({
        token: 'access_token_to_revoke'
      }).toString()
    })
  } catch (error) {
    // Ignore errors, client-side logout still succeeds
  }
}
```

---

## iOS (Swift) Implementation

### OAuth Flow with ASWebAuthenticationSession

```swift
import AuthenticationServices

class OAuthManager: NSObject, ASWebAuthenticationPresentationContextProviding {
  func startOAuthFlow(completion: @escaping (Result<String, Error>) -> Void) {
    guard let authURL = URL(string: "https://provider.com/oauth/authorize?..." ) else {
      return
    }
    
    let session = ASWebAuthenticationSession(
      url: authURL,
      callbackURLScheme: "myapp",
      completionHandler: { url, error in
        if let error = error {
          completion(.failure(error))
          return
        }
        
        guard let url = url else { return }
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let code = components?.queryItems?.first(where: { $0.name == "code" })?.value
        
        if let code = code {
          self.exchangeCodeForToken(code) { result in
            completion(result)
          }
        }
      }
    )
    
    session.presentationContextProvider = self
    session.start()
  }
  
  // MARK: - ASWebAuthenticationPresentationContextProviding
  
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    return ASPresentationAnchor()
  }
  
  private func exchangeCodeForToken(_ code: String, completion: @escaping (Result<String, Error>) -> Void) {
    // Same token exchange as React Native
  }
}
```

---

## Android (Kotlin) Implementation

### OAuth Flow with Custom Tabs

```kotlin
import androidx.browser.customtabs.CustomTabsIntent
import android.content.Intent
import android.net.Uri

class OAuthManager(private val context: Context) {
  fun startOAuthFlow() {
    val authUrl = Uri.parse("https://provider.com/oauth/authorize?...")
    
    val customTabsIntent = CustomTabsIntent.Builder()
      .setShowTitle(true)
      .build()
    
    customTabsIntent.launchUrl(context, authUrl)
  }
  
  fun handleRedirect(uri: Uri) {
    val code = uri.getQueryParameter("code")
    
    if (code != null) {
      exchangeCodeForToken(code)
    }
  }
  
  private fun exchangeCodeForToken(code: String) {
    // Same token exchange as React Native
  }
}
```

---

## Best Practices

✅ **Always use HTTPS** for all OAuth endpoints
✅ **Generate unique state parameter** to prevent CSRF
✅ **Store refresh tokens** in secure storage
✅ **Set token expiration** (15 minutes for access token)
✅ **Implement token refresh** before expiration
✅ **Clear tokens on logout** from all storage
✅ **Validate token signature** if verifying JWT
✅ **Use PKCE** for mobile apps (mandatory)
✅ **Never log tokens** to console or files

❌ **Don't store passwords** in the app
❌ **Don't hardcode client secret** (use backend exchange)
❌ **Don't use expired tokens** without refreshing
❌ **Don't send tokens in URLs** (use Authorization header)
❌ **Don't trust token without verification**
