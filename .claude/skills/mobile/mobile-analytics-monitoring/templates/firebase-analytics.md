# Firebase Analytics Implementation

Complete setup for Firebase Analytics across iOS, Android, and React Native.

---

## React Native: Firebase Analytics Setup

### Installation

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
# For Expo
expo install @react-native-firebase/app @react-native-firebase/analytics
```

### Autolinking (RN 0.60+)

```bash
# No additional setup needed - autolinking handles native setup
```

### Implementation

```typescript
import analytics from '@react-native-firebase/analytics'

// Track screen view (automatic with React Navigation)
export async function trackScreenView(screenName: string, screenClass?: string) {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Failed to log screen view:', error)
  }
}

// Track custom event
export async function trackEvent(eventName: string, params?: Record<string, any>) {
  try {
    await analytics().logEvent(eventName, {
      ...params,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Failed to log event:', error)
  }
}

// Set user properties
export async function setUserProperty(name: string, value: string) {
  try {
    await analytics().setUserProperty(name, value)
  } catch (error) {
    console.error('Failed to set user property:', error)
  }
}

// Set user ID
export async function setUserId(userId: string) {
  try {
    await analytics().setUserId(userId)
  } catch (error) {
    console.error('Failed to set user ID:', error)
  }
}

// Reset analytics (logout)
export async function resetAnalytics() {
  try {
    await analytics().resetAnalyticsData()
  } catch (error) {
    console.error('Failed to reset analytics:', error)
  }
}
```

### Integration with React Navigation

```typescript
import { NavigationContainer } from '@react-navigation/native'
import analytics from '@react-native-firebase/analytics'

const navigationRef = useNavigationContainerRef()

function App() {
  const routeNameRef = useRef<string>()

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current
        const currentRouteName = navigationRef.getCurrentRoute()?.name

        if (previousRouteName !== currentRouteName) {
          // Log screen view to Firebase
          await analytics().logScreenView({
            screen_name: currentRouteName,
            screen_class: currentRouteName
          })
        }

        routeNameRef.current = currentRouteName
      }}
    >
      {/* Navigation structure */}
    </NavigationContainer>
  )
}
```

### Tracking User Events

```typescript
// Sign-up
export async function trackSignup(method: 'email' | 'google' | 'apple') {
  await analytics().logEvent('sign_up', {
    method: method
  })
}

// Purchase
export async function trackPurchase(
  transactionId: string,
  value: number,
  currency: string
) {
  await analytics().logEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency
  })
}

// Add to cart
export async function trackAddToCart(
  itemId: string,
  itemName: string,
  value: number
) {
  await analytics().logEvent('add_to_cart', {
    item_id: itemId,
    item_name: itemName,
    value: value
  })
}

// Initiate checkout
export async function trackInitiateCheckout(
  itemIds: string[],
  totalValue: number
) {
  await analytics().logEvent('begin_checkout', {
    items: itemIds,
    value: totalValue
  })
}

// Feature usage
export async function trackFeatureUsage(featureName: string) {
  await analytics().logEvent('feature_view', {
    feature_name: featureName
  })
}

// Custom event
export async function trackCustomEvent(
  eventName: string,
  properties: Record<string, any>
) {
  await analytics().logEvent(eventName, properties)
}
```

### GDPR Compliance

```typescript
import analytics from '@react-native-firebase/analytics'

// Disable analytics for GDPR
export async function disableAnalytics() {
  await analytics().setAnalyticsCollectionEnabled(false)
}

// Enable analytics (after consent)
export async function enableAnalytics() {
  await analytics().setAnalyticsCollectionEnabled(true)
}

// Check if analytics is enabled
export async function isAnalyticsEnabled(): Promise<boolean> {
  // Firebase doesn't provide direct API, track manually
  return true // Default to enabled after init
}
```

---

## iOS: Firebase Analytics Setup

### CocoaPods Configuration

```ruby
# Podfile
platform :ios, '11.0'

target 'MyApp' do
  pod 'Firebase/Core'
  pod 'Firebase/Analytics'
  
  # For Crashlytics
  pod 'Firebase/Crashlytics'
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
  end
end
```

### Swift Implementation

```swift
import FirebaseCore
import FirebaseAnalytics

class FirebaseAnalyticsManager {
  static let shared = FirebaseAnalyticsManager()
  
  func configure() {
    FirebaseApp.configure()
  }
  
  // Track screen view
  func logScreenView(screenName: String, screenClass: String? = nil) {
    Analytics.logEvent(AnalyticsEventScreenView,
      parameters: [
        AnalyticsParameterScreenName: screenName,
        AnalyticsParameterScreenClass: screenClass ?? screenName
      ])
  }
  
  // Track custom event
  func logEvent(_ name: String, parameters: [String: Any]? = nil) {
    Analytics.logEvent(name, parameters: parameters)
  }
  
  // Set user ID
  func setUserId(_ userId: String) {
    Analytics.setUserID(userId)
  }
  
  // Set user property
  func setUserProperty(_ value: String, forName name: String) {
    Analytics.setUserProperty(value, forName: name)
  }
  
  // Track sign-up
  func logSignUp(method: String) {
    Analytics.logEvent(AnalyticsEventSignUp,
      parameters: [
        AnalyticsParameterMethod: method
      ])
  }
  
  // Track purchase
  func logPurchase(transactionId: String, value: Double, currency: String) {
    Analytics.logEvent(AnalyticsEventPurchase,
      parameters: [
        AnalyticsParameterTransactionID: transactionId,
        AnalyticsParameterValue: value,
        AnalyticsParameterCurrency: currency
      ])
  }
}

// Usage
@main
struct MyApp: App {
  init() {
    FirebaseAnalyticsManager.shared.configure()
  }
  
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
  }
}
```

---

## Android: Firebase Analytics Setup

### Gradle Configuration

```gradle
// build.gradle (Project)
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
  }
}

// build.gradle (App)
plugins {
  id 'com.android.application'
  id 'com.google.gms.google-services'
}

dependencies {
  implementation 'com.google.firebase:firebase-analytics:21.2.2'
  implementation 'com.google.firebase:firebase-crashlytics:18.3.6'
}
```

### Kotlin Implementation

```kotlin
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.analytics.ktx.analytics
import com.google.firebase.ktx.Firebase

class AnalyticsManager(private val context: Context) {
  private val firebaseAnalytics = Firebase.analytics
  
  // Log screen view
  fun logScreenView(screenName: String, screenClass: String? = null) {
    val bundle = Bundle().apply {
      putString(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
      putString(FirebaseAnalytics.Param.SCREEN_CLASS, screenClass ?: screenName)
    }
    firebaseAnalytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW, bundle)
  }
  
  // Log custom event
  fun logEvent(eventName: String, params: Map<String, Any>? = null) {
    val bundle = Bundle().apply {
      params?.forEach { (key, value) ->
        when (value) {
          is String -> putString(key, value)
          is Int -> putInt(key, value)
          is Double -> putDouble(key, value)
          is Boolean -> putBoolean(key, value)
          is Long -> putLong(key, value)
        }
      }
    }
    firebaseAnalytics.logEvent(eventName, bundle)
  }
  
  // Set user ID
  fun setUserId(userId: String) {
    firebaseAnalytics.setUserId(userId)
  }
  
  // Set user property
  fun setUserProperty(name: String, value: String) {
    firebaseAnalytics.setUserProperty(name, value)
  }
  
  // Log sign-up
  fun logSignUp(method: String) {
    val bundle = Bundle().apply {
      putString(FirebaseAnalytics.Param.METHOD, method)
    }
    firebaseAnalytics.logEvent(FirebaseAnalytics.Event.SIGN_UP, bundle)
  }
  
  // Log purchase
  fun logPurchase(transactionId: String, value: Double, currency: String) {
    val bundle = Bundle().apply {
      putString(FirebaseAnalytics.Param.TRANSACTION_ID, transactionId)
      putDouble(FirebaseAnalytics.Param.VALUE, value)
      putString(FirebaseAnalytics.Param.CURRENCY, currency)
    }
    firebaseAnalytics.logEvent(FirebaseAnalytics.Event.PURCHASE, bundle)
  }
}

// Usage in Activity
class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    val analyticsManager = AnalyticsManager(this)
    analyticsManager.logScreenView("MainScreen")
  }
}
```

---

## Event Best Practices

### Standard Events

Use Firebase's predefined events for better insights:

```typescript
// Predefined events
'purchase'                // Product purchase
'view_item'               // Product viewed
'add_to_cart'             // Item added to cart
'view_cart'               // Shopping cart viewed
'begin_checkout'          // Checkout initiated
'add_payment_info'        // Payment added
'sign_up'                 // User signed up
'login'                   // User logged in
'search'                  // Search performed
'share'                   // Content shared
'app_open'                // App opened (auto)
'screen_view'             // Screen viewed (auto)
```

### Event Parameters

```typescript
// Standard parameters
'value'                   // Numeric value
'currency'                // Currency code (USD, EUR)
'items'                   // Item list
'item_id'                 // Item identifier
'item_name'               // Item name
'item_category'           // Item category
'method'                  // Method (login, signup)
'transaction_id'          // Transaction ID
```

---

## Dashboard & Reporting

### Key Reports to Create

1. **User Engagement**
   - Daily Active Users (DAU)
   - Monthly Active Users (MAU)
   - Session duration
   - Screens per session

2. **Conversion Funnel**
   - Sign-ups
   - Purchases
   - Premium conversions
   - Retention

3. **Performance**
   - App startup time
   - Crash rate
   - Error rate
   - Slow transactions

4. **Feature Adoption**
   - Feature usage
   - Feature frequency
   - Time to first use
   - Power users

---

## Privacy & Best Practices

✅ **Do**:
- Collect data after user consent
- Use meaningful event names
- Include relevant context
- Monitor data size
- Delete data on logout

❌ **Don't**:
- Track PII (email, phone, SSN)
- Collect excessive data
- Send unencrypted data
- Store sensitive information
- Log passwords or tokens
