# Android Profiler: Complete Guide

Master Android Studio Profiler for performance debugging.

---

## Launching Android Profiler

### From Android Studio

```
View → Tool Windows → Profiler
or
Run → Profile 'app'
```

### Real Device Setup

```bash
# Enable developer options
Settings → About phone → Tap Build Number 7x

# Enable USB debugging
Developer options → USB debugging → On

# Connect device
adb devices  # Should list your device
```

---

## CPU Profiler

### Recording CPU Activity

**Methods**:

1. **Sample Java Methods** (Low overhead)
   - Samples stack every 1ms
   - Shows approximate time per function
   - Good for finding hot spots

2. **Trace Java Methods** (High overhead)
   - Records every function call
   - More accurate but slower
   - Use for short sessions only

3. **Sample Native (C/C++)** (Medium overhead)
   - Profiles native code
   - Useful for NDK code

**How to Use**:
1. Open Profiler
2. Click CPU tab
3. Press "Record" button
4. Perform action in app
5. Press "Record" to stop
6. View call stack

### Reading CPU Profiler

**Top-Down View**:
- Shows function call hierarchy
- Click to drill down
- See "Total Time" and "Self Time"

**Bottom-Up View**:
- Shows functions sorted by time spent
- Useful for finding hotspots
- Self time = time in function only

**Flame Chart View**:
- Visual timeline of execution
- Height = call depth
- Width = time spent

### Example: Finding CPU Bottleneck

```
1. Open CPU Profiler
2. Record while scrolling list
3. Look for tall bars in flame chart
4. Click to see function name
5. If high "Self Time" = computation heavy
6. If high "Total Time" = I/O or blocking
```

---

## Memory Profiler

### Recording Memory Activity

**How to Use**:
1. Open Profiler
2. Click Memory tab
3. Look at real-time memory graph
4. Perform action in app
5. Look for memory spikes
6. Take heap dump to analyze

### Heap Dump Analysis

**Creating Heap Dump**:
1. In Memory Profiler, click heap dump button
2. Select "Java/Kotlin" heap
3. Wait for collection
4. View in dump explorer

**Finding Memory Leaks**:
```
1. Take heap dump after action
2. Sort by "Size"
3. Look for unexpected large objects
4. Right-click → "Show Retained Set"
5. Check reference chain
6. Find where it's retained
```

### Memory Types

| Type | Description | Example |
|------|-------------|---------|
| **Java Heap** | Java/Kotlin objects | Activities, adapters |
| **Native Heap** | C/C++ allocations | Images, buffers |
| **Graphics** | GPU memory | Textures, surfaces |
| **Stack** | Function call stack | Local variables |

### Example: Detecting Image Memory Leak

```
1. Load 100 images
2. Clear from UI
3. Take heap dump
4. Search for "Drawable" or "Bitmap"
5. If count still ~100 = leak
6. Check cache or retained reference
```

---

## Network Profiler

### Analyzing Network Requests

**How to Use**:
1. Open Profiler
2. Click Network tab
3. View all HTTP/HTTPS requests
4. Click request to inspect
5. View request/response headers and body

**Key Metrics**:
- **Time**: Total request time
- **Size**: Request + response size
- **Type**: GET, POST, etc.
- **Status**: Response code

### Network Waterfall

Shows timeline of network requests:
- **Red**: DNS lookup
- **Orange**: Connection
- **Green**: Request sent
- **Blue**: Response received

**Optimization Opportunities**:
1. DNS lookup too slow → Use persistent connections
2. Many sequential requests → Batch or parallelize
3. Large payloads → Compress or paginate
4. Slow response → Optimize server or cache

---

## Energy Profiler

### Measuring Power Consumption

**How to Use**:
1. Open Profiler
2. Click Energy tab
3. View real-time power drain
4. Identify which components consume power
5. Optimize high consumers

**Power Consumers**:
- **CPU**: Processing
- **Memory**: Keeping RAM powered
- **Location**: GPS usage
- **Network**: WiFi/cellular radio
- **Display**: Screen brightness

### Reducing Battery Drain

```kotlin
// ❌ Bad: Continuous location updates
val locationRequest = LocationRequest.create().apply {
  interval = 1000  // Every 1 second
  priority = LocationRequest.PRIORITY_HIGH_ACCURACY
}

// ✅ Good: Batch location updates
val locationRequest = LocationRequest.create().apply {
  interval = 60000  // Every 60 seconds
  fastestInterval = 30000
  priority = LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
}
```

---

## Common Debugging Scenarios

### Scenario 1: Memory Leak

**Symptoms**: Memory keeps increasing, never decreases

**Steps**:
1. Open Memory Profiler
2. Perform action (open screen) 10 times
3. Close screen 10 times
4. Take heap dump
5. Search by class name
6. If count still high = leak
7. Check retention chain

**Fix Example**:
```kotlin
// ❌ Leak: Activity retained by static reference
companion object {
  var currentActivity: Activity? = null
}

// ✅ Fix: Use WeakReference
companion object {
  var currentActivity: WeakReference<Activity>? = null
}
```

### Scenario 2: High CPU Usage

**Symptoms**: CPU at 100%, app slow

**Steps**:
1. Open CPU Profiler
2. Record while performing action
3. Look for functions with high "Self Time"
4. Optimize algorithm or move to background thread

**Fix Example**:
```kotlin
// ❌ Bad: Expensive work on main thread
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  val result = expensiveComputation()  // Blocks UI
  updateUI(result)
}

// ✅ Good: Work in coroutine
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  lifecycleScope.launch(Dispatchers.Default) {
    val result = expensiveComputation()
    withContext(Dispatchers.Main) {
      updateUI(result)
    }
  }
}
```

### Scenario 3: Slow Network

**Symptoms**: API calls take too long

**Steps**:
1. Open Network Profiler
2. View request waterfall
3. Identify slow component (DNS, connection, response)
4. Optimize (connection pooling, CDN, etc.)

### Scenario 4: Battery Drain

**Symptoms**: Battery drops 20% per hour

**Steps**:
1. Open Energy Profiler
2. Identify high consumer
3. Optimize (reduce frequency, use batching)
4. Verify battery impact reduced

---

## Advanced Techniques

### Technique 1: Detecting ANR (App Not Responding)

```
1. Monitor CPU Profiler
2. If CPU jumps to 100% and stays
3. App is doing heavy work on main thread
4. Check stack trace to find function
5. Move to background thread
```

### Technique 2: Memory Pressure Testing

```
1. Set device to low memory
   Settings → Developer options → Simulate low memory
2. Run app with Memory Profiler
3. Check how app handles low memory
4. Fix memory leaks if detected
```

### Technique 3: Network Throttling

```
1. Enable network throttling
   Android Studio Profiler → Network dropdown
2. Select speed (Slow, Slow 3G, LTE)
3. Test app under poor network
4. Verify UI remains responsive
```

---

## Performance Checklist

**Memory**:
- [ ] No memory leaks detected
- [ ] Memory usage < 50MB average
- [ ] No unnecessary allocations
- [ ] Images and resources properly recycled

**CPU**:
- [ ] No main thread blocking
- [ ] CPU < 50% average
- [ ] No infinite loops
- [ ] Heavy work on background thread

**Network**:
- [ ] API response < 500ms p95
- [ ] Requests batched when possible
- [ ] Responses compressed
- [ ] Caching implemented

**Battery**:
- [ ] Battery drain < 5% per hour
- [ ] No continuous location tracking
- [ ] Network radio optimized
- [ ] CPU not hogging battery

---

## Tools & Links

- Android Studio Profiler documentation
- Android Performance Tuning guide
- LeakCanary library (automatic leak detection)
- Battery Historian (battery analysis tool)
