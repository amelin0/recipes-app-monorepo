---
name: Advanced Debugging & Profiling
description: Master memory profiling, CPU optimization, network debugging, and visual debugging tools for iOS, Android, and React Native
tags: [mobile, debugging, profiling, memory, cpu, performance, instruments, profiler, optimization]
version: 1.0
---

# Advanced Debugging & Profiling

## When Claude Should Use This Skill

- Diagnosing memory leaks and excessive memory usage
- Identifying CPU bottlenecks and hot spots
- Debugging network issues and slow API calls
- Profiling app startup time
- Investigating jank and frame rate drops
- Finding and fixing battery drain issues
- Using platform-specific debugging tools
- Analyzing performance regressions
- Creating flame graphs and call stacks
- Debugging crashes with stack traces

---

## Debugging & Profiling Architecture

```
┌─────────────────────────────────────────────┐
│       Symptom Identification                 │
│  (Slow app, jank, crash, high memory)       │
├─────────────────────────────────────────────┤
│       Data Collection                        │
│  (Capture stack traces, memory snapshots)   │
├─────────────────────────────────────────────┤
│       Tool Analysis                          │
│  (Instruments, Profiler, DevTools)          │
├─────────────────────────────────────────────┤
│       Root Cause Identification              │
│  (Pinpoint function/code causing issue)     │
├─────────────────────────────────────────────┤
│       Performance Optimization               │
│  (Implement fix, measure improvement)       │
├─────────────────────────────────────────────┤
│       Regression Testing                     │
│  (Verify fix doesn't break anything)        │
└─────────────────────────────────────────────┘
```

---

## Profiling Types

### 1. Memory Profiling

**What to Track**:
- Heap size over time
- Object allocations
- Memory leaks (retained objects)
- GC pause times
- Native vs JavaScript memory

**Tools**:
- iOS: Xcode Memory Debugger, Instruments
- Android: Android Profiler, LeakCanary
- React Native: React DevTools Profiler

**Typical Issues**:
- Circular references preventing GC
- Caches growing without limit
- Image memory not being freed
- Native library memory leaks

### 2. CPU Profiling

**What to Track**:
- CPU usage percentage
- Thread utilization
- Hotspots (which functions use most CPU)
- Call stacks
- Context switches

**Tools**:
- iOS: Xcode CPU Profiler, Instruments
- Android: Android Profiler, Simpleperf
- React Native: Chrome DevTools Performance tab

**Typical Issues**:
- Main thread blocking (layout pass)
- Inefficient algorithms (O(n²) instead of O(n))
- Too many re-renders
- Heavy computations on main thread

### 3. Network Profiling

**What to Track**:
- Request/response times
- Payload sizes
- Network errors
- DNS lookup time
- SSL/TLS handshake time

**Tools**:
- Charles Proxy
- Burp Suite
- iOS Network Link Conditioner
- Chrome DevTools Network tab
- Fiddler

**Typical Issues**:
- Slow DNS resolution
- Multiple sequential requests (waterfall)
- Large payloads
- Missing caching headers
- SSL renegotiation

### 4. Battery Profiling

**What to Track**:
- Battery drain rate
- Location/GPS usage
- Background activity
- Network radio usage
- CPU wakeups

**Tools**:
- iOS: Xcode Energy Impact, Instruments
- Android: Battery Historian
- React Native: Sentry monitoring

**Typical Issues**:
- Continuous location tracking
- Frequent network requests
- High CPU usage
- Excessive wakeups

---

## Platform-Specific Tools

### iOS: Xcode Instruments

**Common Instruments**:
- **Allocations**: Memory allocation tracking
- **Leaks**: Detect memory leaks
- **System Trace**: CPU, threads, system calls
- **Core Animation**: Frame rate and rendering
- **Energy Impact**: Battery drain
- **Network**: HTTP traffic

### Android: Android Profiler

**Profiler Tabs**:
- **CPU**: Tracks CPU usage and thread activity
- **Memory**: Heap size, allocations, garbage collection
- **Network**: Network requests and payloads
- **Energy**: Battery and power consumption

### React Native: Chrome DevTools

**Features**:
- **Performance Tab**: Frame rate, scripting, rendering
- **Memory Tab**: Heap snapshots, allocation timeline
- **Network Tab**: API requests
- **Console**: Logging and errors
- **Sources**: Breakpoints and debugging

---

## Common Debugging Scenarios

### Scenario 1: Memory Leak

**Symptoms**:
- App becomes progressively slower
- Memory usage keeps increasing
- Eventually crashes with OOM

**Debugging Steps**:
1. Capture memory snapshot
2. Identify retained objects
3. Trace back to holding reference
4. Fix: Remove circular ref, cleanup listener
5. Verify: Memory stable after fix

### Scenario 2: Jank/Frame Drops

**Symptoms**:
- UI stuttering when scrolling
- Animations drop frames
- Janky navigation transitions

**Debugging Steps**:
1. Use Core Animation tool
2. Enable "Color Blended Layers"
3. Identify expensive operations
4. Fix: Memoize components, optimize layout
5. Verify: 60 FPS sustained

### Scenario 3: Slow Startup

**Symptoms**:
- Long time from tap to first screen
- User sees blank screen

**Debugging Steps**:
1. Measure cold/warm/hot start times
2. Profile app initialization
3. Identify bottleneck (network, compute, layout)
4. Fix: Lazy load, parallelize, optimize
5. Verify: Startup < 2s

### Scenario 4: Excessive Battery Drain

**Symptoms**:
- Battery depletes quickly
- App uses lot of power
- Warm device even at idle

**Debugging Steps**:
1. Monitor background activity
2. Check GPS/Bluetooth/Network usage
3. Identify power consumers
4. Fix: Reduce frequency, batch operations
5. Verify: Battery drain < 5%/hour

---

## Debugging Workflow

### Step 1: Identify the Problem

```
User Report/Alert:
- "App is slow"
- "App crashes sometimes"
- "Battery drains fast"

Metrics:
- Memory usage spiked
- Frame rate dropped
- Crash rate increased
```

### Step 2: Reproduce

```
- Reproduce locally if possible
- Use real device (not simulator)
- Enable profiling tools
- Capture baseline metrics
```

### Step 3: Profile

```
- Attach profiler/debugger
- Run reproduction scenario
- Capture data (stack trace, memory snapshot)
- Export for analysis
```

### Step 4: Analyze

```
- Identify hotspots
- Look for anomalies
- Cross-reference with code
- Form hypothesis
```

### Step 5: Fix

```
- Implement fix
- Test locally
- Run regression tests
- Verify with profiler
```

### Step 6: Verify

```
- Metrics back to baseline
- No new issues introduced
- Fix deployed to production
- Monitor for regressions
```

---

## Performance Baselines

### Healthy App

| Metric | Value | Status |
|--------|-------|--------|
| Startup Time | < 2s | ✅ |
| Memory (avg) | < 50MB | ✅ |
| Frame Rate | 60 FPS | ✅ |
| API Response | < 500ms | ✅ |
| Crash Rate | < 0.1% | ✅ |
| Battery Drain | < 5%/hr | ✅ |

### Warning Levels

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory | > 75MB | > 100MB |
| Frame Rate | < 50 FPS | < 30 FPS |
| API Response | > 1s | > 2s |
| Crash Rate | > 0.5% | > 1% |
| Battery Drain | > 8%/hr | > 10%/hr |

---

## Profiling Tools Comparison

| Tool | Platform | Strength | Learning Curve |
|------|----------|----------|-----------------|
| Xcode Instruments | iOS | Comprehensive | High |
| Android Profiler | Android | Easy to use | Low |
| Chrome DevTools | RN/Web | Visual, intuitive | Low |
| Charles Proxy | All | Network analysis | Medium |
| Sentry | All | Crash analysis | Low |

---

## Common Debugging Patterns

### Pattern 1: Memory Leak from Listener

```typescript
❌ Bad: Listener not removed
useEffect(() => {
  eventEmitter.on('update', handleUpdate)
}, [])

✅ Good: Listener cleaned up
useEffect(() => {
  const unsubscribe = eventEmitter.on('update', handleUpdate)
  return () => unsubscribe()
}, [])
```

### Pattern 2: Unoptimized Render

```typescript
❌ Bad: Re-renders every time
function List() {
  return (
    <View>
      {items.map(item => <Item item={item} />)}
    </View>
  )
}

✅ Good: Memoized
const Item = React.memo(function ItemComponent({ item }) {
  return <View>{item.name}</View>
})
```

### Pattern 3: Main Thread Blocking

```typescript
❌ Bad: Heavy work on main thread
function processData() {
  const result = heavyComputation(largeDataset)  // Blocks UI
  setData(result)
}

✅ Good: Work on background thread
function processData() {
  const worker = new Worker('heavy-computation.js')
  worker.onmessage = (e) => setData(e.data)
  worker.postMessage(largeDataset)
}
```

---

## Tools Overview

### Xcode Instruments
- Time Profiler
- Allocations
- Leaks
- System Trace
- Core Animation
- Network
- Energy Impact

### Android Profiler
- CPU Profiler
- Memory Profiler
- Network Profiler
- Energy Profiler

### React Native DevTools
- Performance Monitor
- React DevTools Profiler
- Chrome DevTools
- Flipper

### Third-Party Tools
- Charles Proxy (network)
- LeakCanary (Android memory)
- Sentry (crash analysis)

---

## Debugging Checklist

### Before Debugging
- [ ] Reproduce issue consistently
- [ ] Note device and OS version
- [ ] Check if issue is on main/dev branch
- [ ] Gather relevant logs
- [ ] Check similar issues reported

### During Debugging
- [ ] Profile on real device
- [ ] Use appropriate profiling tool
- [ ] Capture baseline metrics
- [ ] Identify hotspots
- [ ] Trace to root cause
- [ ] Document findings

### After Fix
- [ ] Verify metrics improved
- [ ] Run regression tests
- [ ] Test on multiple devices
- [ ] Monitor in production
- [ ] Document solution

---

## Related Skills

This skill complements:
- **Mobile App Security** - Security-related debugging
- **React Native Architecture** - Understanding app structure
- **Mobile Analytics & Monitoring** - Metrics to watch
- **System Design & Architecture** - Large-scale optimization
- **Code Review Excellence** - Finding inefficiencies

---

**Version**: 1.0 | **Last Updated**: 2025-10-18
