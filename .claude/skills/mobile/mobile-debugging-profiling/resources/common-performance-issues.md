# Common Performance Issues & Solutions

Reference guide for diagnosing and fixing typical mobile app performance problems.

---

## Issue 1: Memory Leak - Listener Not Cleaned

### Symptom
Memory increases every time a screen is opened and closed.

### Root Cause
Event listeners or subscriptions not unsubscribed when component destroyed.

### Detection
```
1. Open Memory Profiler
2. Open screen → take snapshot (100MB)
3. Close screen → take snapshot (101MB)
4. Repeat 10x
5. Final snapshot: 110MB (memory not freed)
```

### Solution

**React Native**:
```typescript
useEffect(() => {
  const subscription = eventEmitter.on('update', handleUpdate)
  
  return () => {
    subscription.unsubscribe()  // Clean up
  }
}, [])
```

**iOS**:
```swift
deinit {
  NotificationCenter.default.removeObserver(self)
}
```

**Android**:
```kotlin
override fun onDestroy() {
  super.onDestroy()
  eventBus.unregister(this)
}
```

---

## Issue 2: Jank While Scrolling

### Symptom
UI stutters/freezes when scrolling list or table view.

### Root Cause
Expensive rendering on main thread, excessive re-renders, or unoptimized layout.

### Detection
```
1. Open Core Animation (iOS) or Frame Rate Monitor (Android)
2. Scroll
3. Look for frame drops (< 60 FPS)
4. Enable "Color Blended Layers" to find expensive rendering
```

### Solutions

**Reduce Re-renders**:
```typescript
// ❌ Bad: Re-renders every time
function ListItem({ item }) {
  return <View>{item.name}</View>
}

// ✅ Good: Only re-renders if props change
const ListItem = React.memo(function ListItemComponent({ item }) {
  return <View>{item.name}</View>
})
```

**Use FlatList Instead of ScrollView**:
```typescript
// ❌ Bad: Renders all 1000 items
<ScrollView>
  {items.map(item => <Item key={item.id} item={item} />)}
</ScrollView>

// ✅ Good: Only renders visible items (virtualization)
<FlatList
  data={items}
  renderItem={({ item }) => <Item item={item} />}
  keyExtractor={item => item.id}
/>
```

**Simplify Cell Layout**:
```swift
// ❌ Bad: Complex shadow effect
imageView.layer.shadowOpacity = 0.5
imageView.layer.shadowRadius = 10
imageView.layer.cornerRadius = 5

// ✅ Good: Pre-render shadow
let shadowImage = UIImage(named: "shadow")
imageView.image = shadowImage
```

---

## Issue 3: Slow App Startup

### Symptom
App takes 5+ seconds from tap to first screen visible.

### Root Cause
- Heavy initialization on main thread
- Large data loading
- Complex first screen layout
- Blocking network calls

### Detection
```
1. Use Xcode Time Profiler (iOS)
2. Measure from app launch to first screen
3. Identify bottleneck in call stack
```

### Solutions

**Lazy Initialize**:
```typescript
// ❌ Bad: Load everything on startup
class AppManager {
  constructor() {
    this.analytics = new Analytics()     // Heavy
    this.database = new Database()       // Heavy
    this.cache = new ImageCache(1000)    // Heavy
  }
}

// ✅ Good: Initialize on demand
class AppManager {
  private analytics: Analytics | null = null
  
  getAnalytics() {
    if (!this.analytics) {
      this.analytics = new Analytics()
    }
    return this.analytics
  }
}
```

**Parallelize Initialization**:
```typescript
// ❌ Bad: Sequential initialization
await initializeAnalytics()    // 500ms
await initializeDatabase()     // 1000ms
await initializeCache()        // 500ms
// Total: 2000ms

// ✅ Good: Parallel initialization
await Promise.all([
  initializeAnalytics(),       // 500ms
  initializeDatabase(),        // 1000ms
  initializeCache()            // 500ms
])
// Total: 1000ms (max of all)
```

**Move Work to Background**:
```swift
// ❌ Bad: Block on first screen
override func viewDidLoad() {
  super.viewDidLoad()
  let data = loadLargeDataset()  // Blocks UI
  updateUI(data)
}

// ✅ Good: Load after UI appears
override func viewDidLoad() {
  super.viewDidLoad()
  updateUI(placeholder)
  
  DispatchQueue.global().async {
    let data = self.loadLargeDataset()
    DispatchQueue.main.async {
      self.updateUI(data)
    }
  }
}
```

---

## Issue 4: High CPU Usage

### Symptom
App CPU at 100%, battery drains quickly.

### Root Cause
- Inefficient algorithm (O(n²) instead of O(n))
- Busy loop or polling
- Main thread blocking with computation
- Infinite loop

### Detection
```
1. Open Time Profiler (iOS) or CPU Profiler (Android)
2. Record
3. Look for functions with high "Self Time"
4. Check call frequency
```

### Solutions

**Optimize Algorithm**:
```typescript
// ❌ Bad: O(n²) - nested loops
function findMatches(arr1, arr2) {
  const matches = []
  for (let i = 0; i < arr1.length; i++) {
    for (let j = 0; j < arr2.length; j++) {
      if (arr1[i] === arr2[j]) {
        matches.push(arr1[i])
      }
    }
  }
  return matches
}

// ✅ Good: O(n) - using set
function findMatches(arr1, arr2) {
  const set2 = new Set(arr2)
  return arr1.filter(item => set2.has(item))
}
```

**Use Background Thread**:
```kotlin
// ❌ Bad: Heavy computation on main thread
onClick {
  val result = expensiveComputation()
  updateUI(result)
}

// ✅ Good: Use coroutine
onClick {
  lifecycleScope.launch(Dispatchers.Default) {
    val result = expensiveComputation()
    withContext(Dispatchers.Main) {
      updateUI(result)
    }
  }
}
```

---

## Issue 5: Battery Drain

### Symptom
Battery drops 30% per hour during normal use.

### Root Cause
- Continuous location tracking
- Frequent network requests
- High CPU usage
- Wake-ups from sleep

### Detection
```
1. Open Energy Profiler (Android) or Battery monitoring (iOS)
2. Identify high consumer
3. Check timestamp of drain
```

### Solutions

**Optimize Location Updates**:
```kotlin
// ❌ Bad: Every 1 second
locationRequest.interval = 1000

// ✅ Good: Every 60 seconds (or user-driven)
locationRequest.interval = 60000
locationRequest.priority = LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
```

**Batch Network Requests**:
```typescript
// ❌ Bad: Separate requests every minute
setInterval(() => {
  fetch('/api/messages')      // Request 1
  fetch('/api/notifications') // Request 2
  fetch('/api/updates')       // Request 3
}, 60000)

// ✅ Good: Single batch request
setInterval(() => {
  fetch('/api/batch?types=messages,notifications,updates')
}, 60000)
```

**Reduce Update Frequency**:
```typescript
// ❌ Bad: Update every 5 seconds
const timer = setInterval(updateLocation, 5000)

// ✅ Good: Update every 60 seconds or on user action
const timer = setInterval(updateLocation, 60000)

// Even better: Update on demand
button.onPress(() => updateLocation())
```

---

## Issue 6: Large Image Memory

### Symptom
App crashes with "OutOfMemory" when loading images.

### Root Cause
- Images not scaled down
- Images retained after use
- Multiple copies of image in memory
- No image caching strategy

### Detection
```
1. Take heap dump
2. Filter by "Bitmap" or "UIImage"
3. Check count and total size
4. Look for duplicates or full-resolution images
```

### Solutions

**Scale Images**:
```swift
// ❌ Bad: Load full resolution
let image = UIImage(named: "large.jpg")  // 4000x3000 pixels

// ✅ Good: Scale to view size
let targetSize = CGSize(width: 200, height: 200)
let scaledImage = image.resized(to: targetSize)
```

**Use Image Caching**:
```swift
// ❌ Bad: No cache
func loadImage(url: String) -> UIImage {
  let data = try Data(contentsOf: URL(string: url)!)
  return UIImage(data: data)!
}

// ✅ Good: NSCache
let imageCache = NSCache<NSString, UIImage>()

func loadImage(url: String) -> UIImage {
  if let cached = imageCache.object(forKey: url as NSString) {
    return cached
  }
  
  let image = loadFromURL(url)
  imageCache.setObject(image, forKey: url as NSString)
  return image
}
```

---

## Issue 7: Delayed Network Requests

### Symptom
API calls take 2+ seconds, app feels slow.

### Root Cause
- Slow DNS resolution
- Sequential requests (waterfall)
- Large request/response payloads
- No request caching

### Detection
```
1. Open Network Profiler
2. View request timeline (waterfall)
3. Identify slow component:
   - Red = DNS too slow
   - Long bar = response slow
```

### Solutions

**Use HTTP Connection Pooling**:
```kotlin
// ❌ Bad: New connection per request
val client = OkHttpClient()

// ✅ Good: Reuse connections
val connectionPool = ConnectionPool()
val client = OkHttpClient.Builder()
  .connectionPool(connectionPool)
  .build()
```

**Batch Requests**:
```typescript
// ❌ Bad: 3 sequential requests (3s total)
const user = await fetch('/api/users/123')
const posts = await fetch('/api/users/123/posts')
const comments = await fetch('/api/users/123/comments')

// ✅ Good: 1 batch request (1s total)
const data = await fetch('/api/users/123?include=posts,comments')
```

**Implement Response Caching**:
```typescript
const cache = new Map()

async function cachedFetch(url) {
  if (cache.has(url)) {
    return cache.get(url)
  }
  
  const response = await fetch(url)
  const data = await response.json()
  cache.set(url, data)
  return data
}
```

---

## Issue 8: Excessive Re-renders

### Symptom
Component updates very frequently, causing performance issues.

### Root Cause
- State updates too often
- Parent re-render causes unnecessary child re-renders
- Mutable objects causing updates

### Detection
```
1. Add logging to render function
2. Check console frequency
3. If logging appears > 5x per second = excessive
```

### Solutions

**Use useMemo**:
```typescript
// ❌ Bad: Recalculates every render
function ProductList({ items }) {
  const expensive = items
    .filter(item => item.price > 100)
    .map(item => item.name)
    .sort()
  
  return <View>{expensive}</View>
}

// ✅ Good: Only recalculates if items change
function ProductList({ items }) {
  const expensive = useMemo(
    () => items
      .filter(item => item.price > 100)
      .map(item => item.name)
      .sort(),
    [items]
  )
  
  return <View>{expensive}</View>
}
```

**Use useCallback**:
```typescript
// ❌ Bad: New function every render
function Form() {
  const handleSubmit = (data) => {
    api.submit(data)
  }
  
  return <FormComponent onSubmit={handleSubmit} />
}

// ✅ Good: Same function unless dependencies change
function Form() {
  const handleSubmit = useCallback((data) => {
    api.submit(data)
  }, [api])
  
  return <FormComponent onSubmit={handleSubmit} />
}
```

---

## Debugging Checklist

Common performance issue checklist:

**Memory**:
- [ ] No listeners retained after component unmount
- [ ] Images properly scaled
- [ ] Cache has size limits
- [ ] No circular references

**CPU**:
- [ ] Heavy computation on background thread
- [ ] Rendering optimized (memoization)
- [ ] Algorithms efficient (not O(n²))
- [ ] No polling or busy loops

**Network**:
- [ ] Requests batched
- [ ] Response cached
- [ ] Payloads compressed
- [ ] Connection pooling enabled

**Battery**:
- [ ] Location updates batched
- [ ] Network requests infrequent
- [ ] CPU usage reasonable
- [ ] No continuous wake-ups
