# Xcode Instruments: Complete Guide

Master Xcode Instruments for iOS performance debugging and profiling.

---

## Launching Instruments

### From Xcode

```
Product → Profile (⌘I)
or
Select Scheme → Profile target
```

### From Command Line

```bash
# Create profiling template
instruments -l

# Run with specific instrument
instruments -t "Allocations" -o output.trace MyApp.app
```

---

## Essential Instruments

### 1. Allocations (Memory Debugging)

**Purpose**: Track memory allocations and identify leaks

**How to Use**:
1. Start Allocations profiler
2. Run app through user flows
3. Look for "Persistent" allocations (objects not freed)
4. Compare snapshots before/after actions

**Key Metrics**:
- **All Allocations**: Total memory allocated
- **Persistent**: Objects still in memory
- **Generation**: Allocation age

**Identifying Leaks**:
```
1. Perform action (e.g., open screen 10x)
2. Close screen 10x
3. Take snapshot
4. If memory stays high = leak
5. Filter by most allocated type
6. Drill down to find retain cycle
```

**Example Issue: Image Memory Leak**

```swift
// ❌ Bad: Image loaded but never released
func loadImage() {
  let image = UIImage(named: "large_image")
  imageCache[UUID()] = image  // Stored forever
}

// ✅ Good: Image cached with size limit
func loadImage() {
  let image = UIImage(named: "large_image")
  cache.setObject(image, forKey: "key", cost: image.size.width * image.size.height)
}
```

### 2. Leaks (Automatic Leak Detection)

**Purpose**: Automatically detect memory leaks

**How to Use**:
1. Run app with Leaks instrument
2. Navigate through app
3. Leaks instrument shows objects with retain cycles
4. Click to see call stack
5. Find and fix the cycle

**Typical Leaks**:
- Circular references (A → B → A)
- Listeners not removed
- Retained closures capturing self

### 3. System Trace (CPU & Threads)

**Purpose**: Understand CPU usage and thread behavior

**How to Use**:
1. Start System Trace
2. Record app activity
3. Examine CPU timeline
4. Identify blocked threads
5. Correlate with code

**Key Indicators**:
- **Red**: CPU-bound (heavy computation)
- **Yellow**: I/O wait
- **Blue**: Idle
- **Orange**: System call

### 4. Core Animation (Frame Rate & Rendering)

**Purpose**: Debug rendering performance and jank

**How to Use**:
1. Enable "Color Blended Layers"
2. Green = optimal, Red = problem
3. Enable "Color Misaligned Images"
4. Check for offscreen rendering
5. Measure FPS in top corner

**Color Legend**:
- **Green**: Normal rendering
- **Red**: Blended (expensive)
- **Yellow**: Misaligned images
- **Pink**: Offscreen rendered

### 5. Time Profiler (CPU Hotspots)

**Purpose**: Find which functions use most CPU

**How to Use**:
1. Start Time Profiler
2. Run app
3. Click "Record" button
4. Perform action
5. View call stack
6. Sort by "Self" to find hotspots

**Reading Call Stack**:
- **Self Time**: Time in this function
- **Total Time**: Time in function + callees
- **Calls**: Number of calls to function

### 6. Network (HTTP Traffic)

**Purpose**: Analyze network requests

**How to Use**:
1. Start Network profiler
2. View all HTTP requests
3. Sort by size, time, type
4. Click to inspect request/response
5. Identify inefficient APIs

---

## Memory Debugging Workflow

### Finding Memory Leaks Step-by-Step

```
1. Open Allocations instrument
2. Filter by object type (e.g., UIImageView)
3. Perform action (load screen)
4. Close screen
5. Trigger garbage collection (if needed)
6. Compare memory before/after

If memory increased:
  - Click "Allocations List"
  - Sort by "Size"
  - Find object with high count
  - Right-click → "Inspect"
  - View retention chain
  - Find where strongly referenced
  - Fix: Weak reference or cleanup
```

### Example: Debugging View Controller Leak

```swift
// ❌ Memory leak scenario
class ParentViewController: UIViewController {
  let child = ChildViewController()
  
  override func viewDidLoad() {
    super.viewDidLoad()
    // child has strong reference to parent (closure)
    // parent has strong reference to child
    // = retain cycle
  }
}

class ChildViewController: UIViewController {
  var parentCallback: (() -> Void)?
  
  override func viewDidLoad() {
    super.viewDidLoad()
    // Closure captures parent strongly
    parentCallback = { [unowned self] in  // FIX: Use unowned
      print("Child callback")
    }
  }
}
```

---

## Performance Optimization Examples

### Example 1: Slow TableView Scrolling

**Symptom**: Jank when scrolling

**Debugging Steps**:
1. Enable "Color Blended Layers" in Core Animation
2. Look for red cells
3. Identify expensive operation
4. Solution: Defer rendering, memoize, simplify

```swift
// ❌ Bad: Complex rendering in cell
override func layoutSubviews() {
  let blur = UIBlurEffect(style: .dark)
  let blurView = UIVisualEffectView(effect: blur)  // Expensive!
  addSubview(blurView)
}

// ✅ Good: Pre-render or simplify
let blur = UIImage(named: "blur_background")
imageView.image = blur
```

### Example 2: High CPU Usage

**Symptom**: CPU at 100%, battery drains fast

**Debugging Steps**:
1. Use Time Profiler
2. Look for functions with high "Self" time
3. Check for infinite loops or repeated calculations
4. Solution: Optimize algorithm, memoize, cache

```swift
// ❌ Bad: O(n²) algorithm
func findDuplicates(_ array: [Int]) -> [Int] {
  var duplicates: [Int] = []
  for i in 0..<array.count {
    for j in i+1..<array.count {
      if array[i] == array[j] {  // Nested loops
        duplicates.append(array[i])
      }
    }
  }
  return duplicates
}

// ✅ Good: O(n) with set
func findDuplicates(_ array: [Int]) -> [Int] {
  var seen = Set<Int>()
  var duplicates = Set<Int>()
  for num in array {
    if seen.contains(num) {
      duplicates.insert(num)
    }
    seen.insert(num)
  }
  return Array(duplicates)
}
```

---

## Common Issues & Solutions

### Issue 1: Memory Leak in Closure

```swift
// ❌ Leak: self captured strongly
timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
  self.update()  // Retain cycle: Timer → Closure → self
}

// ✅ Fix: Use weak self
timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
  self?.update()
}

// ✅ Better: Invalidate timer
deinit {
  timer?.invalidate()
}
```

### Issue 2: Image Memory Not Released

```swift
// ❌ Leak: Images stored in array forever
var cachedImages: [UIImage] = []

func cacheImage(_ image: UIImage) {
  cachedImages.append(image)  // Grows unbounded
}

// ✅ Fix: Use NSCache
let imageCache = NSCache<NSString, UIImage>()

func cacheImage(_ image: UIImage, forKey key: String) {
  imageCache.setObject(image, forKey: key as NSString)
}
```

### Issue 3: Offscreen Rendering

```swift
// ❌ Expensive: Offscreen render
layer.shadowOpacity = 0.5
layer.shadowRadius = 10
layer.cornerRadius = 5  // Combined with shadow = offscreen

// ✅ Optimize: Pre-render or use image
let image = UIImage(named: "shadow_background")
layer.contents = image.cgImage
```

---

## Advanced Profiling Techniques

### Technique 1: Snapshot Comparison

```
1. Open Allocations
2. Take first snapshot (baseline)
3. Perform action
4. Take second snapshot
5. Compare differences
6. Identify new allocations
```

### Technique 2: Repeated Action Test

```
1. Record baseline memory
2. Perform action 10x times
3. Close/cleanup 10x times
4. If memory increased significantly = leak
5. Identify what wasn't cleaned
```

### Technique 3: Flame Graph Analysis

```
1. Use System Trace
2. Zoom into interesting region
3. Look for tall call stacks
4. Click to see function names
5. Identify expensive functions
```

---

## Performance Targets

| Metric | Good | Acceptable | Poor |
|--------|------|-----------|------|
| Memory (avg) | < 30MB | 30-50MB | > 50MB |
| Memory peak | < 50MB | 50-75MB | > 75MB |
| Frame rate | 60 FPS | 45-60 FPS | < 45 FPS |
| Startup | < 1s | 1-2s | > 2s |
| CPU (avg) | < 20% | 20-50% | > 50% |

---

## Tips & Tricks

✅ **Do**:
- Profile on real device (not simulator)
- Test with location services enabled
- Simulate low memory using Edit Scheme
- Use different device models
- Profile with realistic data volumes
- Check before and after each optimization

❌ **Don't**:
- Profile in Debug configuration (use Release)
- Trust simulator results for performance
- Over-optimize without profiling first
- Ignore background memory usage
- Forget to clean up resources
- Profile while Xcode debugger is attached

---

## Workflow Checklist

Debugging a performance issue:
- [ ] Reproduce issue consistently
- [ ] Identify which instrument to use
- [ ] Collect baseline metrics
- [ ] Identify hotspot/leak
- [ ] Understand root cause
- [ ] Implement fix
- [ ] Verify improvement
- [ ] Check for regressions
- [ ] Document findings
