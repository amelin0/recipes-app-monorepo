# Sentry Crash Reporting & Error Tracking

Complete setup for Sentry error tracking and crash reporting across platforms.

---

## React Native: Sentry Setup

### Installation

```bash
npm install @sentry/react-native
# For Expo
expo install @sentry/react-native
```

### Configuration

```typescript
import * as Sentry from '@sentry/react-native'
import { NavigationContainer } from '@react-navigation/native'

// Initialize Sentry before app launch
Sentry.init({
  dsn: 'https://your-sentry-dsn@sentry.io/project-id',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0, // 100% for development, lower for production
  enableAutoPerformanceTracing: true,
  maxBreadcrumbs: 100,
  attachStacktrace: true,
  release: `myapp@${Constants.expoConfig?.version}`
})

// Wrap navigation container for error boundaries
const SentryNavigationContainer = Sentry.wrap(NavigationContainer)

// Wrap App component for error boundaries
export const App = Sentry.wrap(function AppComponent() {
  return (
    <SentryNavigationContainer
      onReady={() => {
        // Optional: Do something when navigation is ready
      }}
    >
      {/* App content */}
    </SentryNavigationContainer>
  )
})

export default Sentry.wrap(App)
```

### Manual Error Reporting

```typescript
import * as Sentry from '@sentry/react-native'

// Capture exception
try {
  await fetchUserData()
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'user_profile'
    },
    extra: {
      userId: user.id
    }
  })
}

// Capture message (non-error)
Sentry.captureMessage('User subscribed to premium', 'info', {
  tags: {
    feature: 'subscription'
  }
})

// Capture with context
Sentry.withScope(scope => {
  scope.setTag('component', 'LoginScreen')
  scope.setContext('user', {
    id: userId,
    email: userEmail
  })
  Sentry.captureException(error)
})
```

### Breadcrumbs (Event Trail)

```typescript
import * as Sentry from '@sentry/react-native'

// Add breadcrumb (automatic for most interactions)
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'Clicked login button',
  level: 'info',
  data: {
    screen: 'LoginScreen',
    timestamp: Date.now()
  }
})

// Track API calls
export async function apiCall(endpoint: string, options: RequestInit) {
  const startTime = Date.now()
  
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${options.method || 'GET'} ${endpoint}`,
    level: 'debug',
    data: {
      url: endpoint,
      method: options.method || 'GET'
    }
  })
  
  try {
    const response = await fetch(endpoint, options)
    const duration = Date.now() - startTime
    
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${response.status} - ${duration}ms`,
      level: response.ok ? 'info' : 'warning',
      data: {
        status: response.status,
        duration
      }
    })
    
    return response
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'http',
      message: 'Request failed',
      level: 'error',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    throw error
  }
}

// Auto-add breadcrumbs for navigation
export function addNavigationBreadcrumb(screenName: string) {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${screenName}`,
    level: 'info'
  })
}
```

### Performance Monitoring

```typescript
import * as Sentry from '@sentry/react-native'

// Measure function execution
export async function measureFunction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    op: 'function',
    name: name,
    description: `Measuring ${name}`
  })
  
  try {
    const result = await fn()
    transaction.finish()
    return result
  } catch (error) {
    transaction.setStatus('error')
    transaction.finish()
    throw error
  }
}

// Measure screen load
export async function measureScreenLoad(screenName: string) {
  const transaction = Sentry.startTransaction({
    op: 'screen_load',
    name: screenName
  })
  
  const span = transaction.startChild({
    op: 'fetch',
    description: 'Fetching data'
  })
  
  try {
    const data = await fetchData()
    span.finish()
    transaction.finish()
    return data
  } catch (error) {
    span.finish()
    transaction.setStatus('error')
    transaction.finish()
    throw error
  }
}

// Custom span
export function usePerformanceSpan(operation: string) {
  const spanRef = useRef<Sentry.Span | null>(null)
  
  useEffect(() => {
    spanRef.current = Sentry.getCurrentHub().getScope()?.getTransaction()?.startChild({
      op: operation
    }) || null
    
    return () => {
      spanRef.current?.finish()
    }
  }, [operation])
  
  return spanRef.current
}
```

### User Context

```typescript
import * as Sentry from '@sentry/react-native'

// Set user information
export async function setUserContext(userId: string, email: string, username: string) {
  Sentry.setUser({
    id: userId,
    email: email,
    username: username,
    ip_address: '{{auto}}' // Auto-capture IP
  })
}

// Set additional context
export function setAppContext(appVersion: string, environment: string) {
  Sentry.setContext('app', {
    version: appVersion,
    environment: environment,
    timezone: new Date().getTimezoneOffset() / 60
  })
}

// Clear user on logout
export function clearUserContext() {
  Sentry.setUser(null)
}
```

### Release Tracking

```typescript
import * as Sentry from '@sentry/react-native'

// Set release version
Sentry.init({
  release: `myapp@1.2.3`,
  dist: '1' // Build number
})

// Track deployments
export async function notifyRelease(version: string) {
  Sentry.addBreadcrumb({
    category: 'release',
    message: `Released version ${version}`,
    level: 'info',
    data: {
      version
    }
  })
}
```

---

## iOS: Sentry Setup

### CocoaPods Installation

```ruby
platform :ios, '11.0'

target 'MyApp' do
  pod 'Sentry', :git => 'https://github.com/getsentry/sentry-cocoa.git', :tag => '8.0.0'
end
```

### Swift Configuration

```swift
import Sentry

class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    SentrySDK.start { options in
      options.dsn = "https://your-sentry-dsn@sentry.io/project-id"
      options.environment = "production"
      options.tracesSampleRate = 1.0
      options.enableAutoPerformanceTracing = true
    }
    
    return true
  }
}

// Capture exception
do {
  try someRiskyFunction()
} catch {
  SentrySDK.capture(error: error)
}

// Capture message
SentrySDK.capture(message: "User opened premium features")

// Set user
SentrySDK.setUser(Sentry.User(userId: "123", email: "user@example.com"))
```

---

## Android: Sentry Setup

### Gradle Configuration

```gradle
// build.gradle (Project)
buildscript {
  dependencies {
    classpath 'io.sentry:sentry-android-gradle-plugin:3.12.0'
  }
}

// build.gradle (App)
plugins {
  id 'io.sentry.android.gradle'
}

dependencies {
  implementation 'io.sentry:sentry-android:6.9.0'
  implementation 'io.sentry:sentry-android-timber:6.9.0'
}

sentry {
  org = "your-sentry-org"
  projectName = "your-project-name"
  authToken = System.getenv("SENTRY_AUTH_TOKEN")
}
```

### Kotlin Configuration

```kotlin
import io.sentry.Sentry
import io.sentry.android.core.SentryAndroid

class MyApplication : Application() {
  override fun onCreate() {
    super.onCreate()
    
    SentryAndroid.init(this) { options ->
      options.dsn = "https://your-sentry-dsn@sentry.io/project-id"
      options.environment = "production"
      options.tracesSampleRate = 1.0
      options.enableAutoPerformanceTracing()
    }
  }
}

// Capture exception
try {
  someRiskyFunction()
} catch (e: Exception) {
  Sentry.captureException(e)
}

// Set user
Sentry.setUser(io.sentry.protocol.User().apply {
  id = "123"
  email = "user@example.com"
})
```

---

## Best Practices

✅ **Do**:
- Initialize Sentry early
- Capture both exceptions and messages
- Add meaningful breadcrumbs
- Set user context
- Track performance metrics
- Use releases for tracking versions
- Test error reporting in staging

❌ **Don't**:
- Capture PII in error context
- Log passwords or tokens
- Capture every log message
- Set very high sample rates in production (causes overhead)
- Ignore Sentry quota warnings
- Mix multiple error reporting tools

---

## Monitoring Issues

### Key Metrics to Track

1. **Crash Rate**
   - Target: < 0.1% of sessions
   - Alert if: > 1%

2. **Error Rate**
   - Target: < 1% of sessions
   - Alert if: > 5%

3. **Performance**
   - P95 transaction time
   - P99 transaction time
   - Slow transaction rate

4. **User Impact**
   - Users affected per issue
   - Frequency of crashes
   - Time to fix

---

## GDPR Compliance

```typescript
// Don't capture PII
❌ Sentry.captureMessage(`User ${email} logged in`)

// Do anonymize
✅ Sentry.captureMessage('User logged in', {
  tags: { source: 'email' }
})

// Set data scrubbing in Sentry dashboard
// Settings → Data Scrubbing → Add rule for sensitive fields
```
