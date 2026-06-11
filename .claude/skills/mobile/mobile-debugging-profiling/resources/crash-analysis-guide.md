# Crash Analysis & Debugging Guide

How to analyze crashes and use tools to find root causes.

---

## Crash Types

### 1. Unhandled Exception

```
Exception: NullPointerException: Attempt to invoke virtual method on null object
Location: com.myapp.ProfileFragment.onViewCreated
Stack Trace:
  at ProfileFragment.onViewCreated(ProfileFragment.kt:45)
  at FragmentManager.moveToState(FragmentManager.java:1254)
  ...
```

**Common Causes**:
- View not initialized
- Null object passed to function
- Async data not ready

**Fix**: Add null checks
```kotlin
val view = viewBinding.userProfile ?: return
```

### 2. OutOfMemory (OOM)

```
Exception: OutOfMemoryError: Failed to allocate 1048576 bytes
Location: java.lang.String.<init>
```

**Common Causes**:
- Memory leak
- Image too large
- Too much data in memory

**Fix**: Use memory profiler to find leak

### 3. ANR (Application Not Responding)

```
ANR: Application is not responding (ANR)
Duration: 5000ms blocking
Main thread activity:
  NetworkCall.execute (5000ms)
  JSONParse.parse (2000ms)
```

**Common Causes**:
- Main thread blocking I/O
- Expensive computation on main thread
- Deadlock

**Fix**: Move to background thread
```kotlin
lifecycleScope.launch(Dispatchers.Default) {
  val result = expensiveOperation()
  withContext(Dispatchers.Main) {
    updateUI(result)
  }
}
```

### 4. Segmentation Fault (Native Crash)

```
Signal 11 (SIGSEGV), code 1, fault addr 0x1234
Native stack:
  #0  0x00007f... in function (file.cpp:123)
  #1  0x00007e... in another_function (file.cpp:45)
```

**Common Causes**:
- Buffer overflow
- Null pointer dereference
- Memory corruption

**Fix**: Review native code with sanitizers

---

## Using Crash Reports

### Crash Report Structure

```
Device Info:
  - Model: iPhone 14 Pro
  - OS: iOS 17.1
  - Memory: 6GB
  
App Info:
  - Version: 1.2.3
  - Build: 45
  - Environment: Production
  
Crash Details:
  - Type: NSInvalidArgumentException
  - Reason: -[NSArray count]: unrecognized selector
  - Timestamp: 2025-10-18 14:23:45 UTC
  
Stack Trace:
  Frame 0: -[ProfileViewController viewDidLoad]
  Frame 1: -[UIViewController loadViewIfRequired]
  ...
  
Breadcrumbs:
  2025-10-18 14:23:30 - User opened app
  2025-10-18 14:23:35 - Navigated to Profile
  2025-10-18 14:23:40 - Network request started
  2025-10-18 14:23:45 - CRASH
```

### Reading Stack Traces

**From bottom to top**:
1. Root cause usually near top (where crash occurred)
2. Look for YOUR code (not framework code)
3. Check for null pointers, type mismatches, memory issues

**Example Analysis**:
```
Frame 0: ProfileViewController.loadProfile() ← Your code, likely issue here
Frame 1: ProfileViewController.viewDidLoad()
Frame 2: UIViewController._loadViewIfRequired()
Frame 3: UIViewController.view (getter)
...
Frame 50: UIApplicationMain()
```

---

## Crash Patterns

### Pattern 1: Null Reference in Collection

```
Exception: NullPointerException in ArrayList.get()
Stack: ProfileAdapter.getItem(ProfileAdapter.kt:78)
```

**Fix**:
```kotlin
// ❌ Bad: Assumes list always has items
val profile = profiles[0]

// ✅ Good: Check first
if (profiles.isNotEmpty()) {
  val profile = profiles[0]
}
```

### Pattern 2: Memory Leak Leading to OOM

```
OutOfMemoryError
Stack: ImageLoader.cacheImage()
Memory: 512MB (was 50MB) after 100 images loaded
```

**Investigation**:
1. Check what's retained
2. Look for unbounded collections
3. Check for circular references

**Fix**:
```kotlin
// Use LRU cache with size limit
val cache = LruCache<String, Bitmap>(5 * 1024 * 1024)  // 5MB max
```

### Pattern 3: Race Condition

```
Crash A: NullPointerException in updateUI()
Crash B: ConcurrentModificationException in list.clear()
Random timing
```

**Fix**: Synchronize access
```kotlin
private val lock = Object()

fun updateUI() {
  synchronized(lock) {
    // Update
  }
}
```

---

## Debugging Workflow

### Step 1: Understand the Crash

```
Questions:
1. When does it crash? (Specific action, user type)
2. On what devices? (Model, OS version)
3. How frequent? (1 per 1000, 1 per 100000)
4. Is it reproducible? (Can you replicate locally)
5. When was it introduced? (Which version first)
```

### Step 2: Find Similar Crashes

```
In Sentry/Firebase:
1. Search by error type
2. Group similar crashes
3. See affected user count
4. Find pattern (device, OS, user action)
```

### Step 3: Reproduce Locally

```
If reproducible:
1. Use exact device/OS if possible
2. Use exact data if available
3. Step through with debugger
4. Add logging to narrow down

If not reproducible:
1. Use crash logs
2. Analyze code paths
3. Look for potential issues
```

### Step 4: Fix & Verify

```
After fix:
1. Write test to prevent regression
2. Deploy to beta/staging
3. Monitor metrics
4. Verify crash rate decreased
```

---

## Tools for Crash Analysis

### iOS

**Xcode Console**:
- Print stack trace
- Step through code
- Set breakpoints

**Sentry** (iOS):
```swift
SentrySDK.start { options in
  options.dsn = "https://..."
  options.attachStacktrace = true
}

// View crashes in Sentry dashboard
```

**Firebase Crashlytics**:
```swift
Crashlytics.crashlytics().record(error: error)
```

### Android

**Android Studio Logcat**:
- Filter by error
- View stack trace
- Search for patterns

**Firebase Crashlytics**:
```kotlin
Firebase.crashlytics.recordException(e)
```

**LeakCanary** (memory leaks):
```kotlin
dependencies {
  debugImplementation 'com.squareup.leakcanary:leakcanary-android:2.12'
}
```

---

## Common Crash Fixes

### Fix 1: Add Null Checks

```typescript
// ❌ Bad: Can crash if null
const userName = user.profile.name.toUpperCase()

// ✅ Good: Safe access
const userName = user?.profile?.name?.toUpperCase() ?? 'Unknown'
```

### Fix 2: Error Handling

```typescript
// ❌ Bad: Unhandled error
const data = JSON.parse(jsonString)

// ✅ Good: Handle error
try {
  const data = JSON.parse(jsonString)
} catch (error) {
  console.error('Failed to parse:', error)
  return defaultValue
}
```

### Fix 3: Resource Cleanup

```swift
// ❌ Bad: Resource not cleaned
deinit not implemented
listener stays subscribed
file not closed

// ✅ Good: Cleanup in deinit
deinit {
  notificationCenter.removeObserver(self)
  fileHandle?.closeFile()
}
```

---

## Prevention Strategies

### 1. Crash Monitoring

Set alert for:
- Crash rate > 0.5%
- New crash type
- Regression (crash was fixed)

### 2. Beta Testing

Deploy to beta first:
- Catch crashes before production
- Real user scenarios
- Different devices/OS versions

### 3. Code Review

Look for:
- Null pointer potential
- Resource cleanup
- Error handling
- Race conditions

### 4. Testing

Write tests for:
- Edge cases (empty arrays, null values)
- Error scenarios
- Memory usage
- Thread safety

---

## Crash Dashboard

Key metrics to monitor:

```
Daily Crash Rate: 0.08% (target < 0.1%)
Top 5 Crashes:
  1. NullPointerException (45% of crashes)
  2. OutOfMemoryError (20% of crashes)
  3. ANR (15% of crashes)
  4. SegmentationFault (12% of crashes)
  5. RuntimeException (8% of crashes)

Affected Users: 150 (0.5% of active users)
New Crashes This Week: 2
Fixed Crashes: 1
```

---

## SLA for Crashes

Recommended response times:

| Severity | Impact | Response | Resolution |
|----------|--------|----------|-----------|
| Critical | > 1% crash rate | 1 hour | 24 hours |
| High | 0.5-1% crash rate | 4 hours | 48 hours |
| Medium | 0.1-0.5% crash rate | 1 day | 1 week |
| Low | < 0.1% crash rate | 1 week | 2 weeks |
