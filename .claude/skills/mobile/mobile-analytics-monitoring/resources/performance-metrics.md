# Performance Metrics & Monitoring

Track and optimize critical performance metrics for mobile apps.

---

## Key Performance Indicators (KPIs)

### User Experience Metrics

**App Startup Time**
- Time from app launch to first interactive screen
- Target: < 2 seconds
- Components:
  - Cold start: 0 → first screen (4-8s typical)
  - Warm start: from background → app visible (1-2s)
  - Hot start: app visible but needs reflow (< 1s)

```typescript
// Measure cold start
import { measureColdStartTime } from './metrics'

const startTime = Date.now()

// App initialization code...

const coldStartTime = Date.now() - startTime
console.log(`Cold start: ${coldStartTime}ms`)
```

**Screen Load Time**
- Time from navigation to screen fully rendered
- Target: < 1 second
- Components:
  - Network latency (API call)
  - Data parsing
  - Rendering

```typescript
export function useMeasureScreenLoad() {
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const duration = Date.now() - startRef.current
    setLoadTime(duration)
    
    if (duration > 1000) {
      console.warn(`Screen load took ${duration}ms (> 1s target)`)
    }
  }, [])

  return loadTime
}
```

**Frame Rate (FPS)**
- Frames rendered per second
- Target: 60 FPS (iPhone 120 FPS for ProMotion)
- Jank: Any frame taking > 16.67ms (60 FPS)

```typescript
// React Native: Use InteractionManager
import { InteractionManager, useEffect } from 'react-native'

InteractionManager.runAfterInteractions(() => {
  console.log('Heavy animation completed')
})
```

### Resource Metrics

**Memory Usage**
- RAM consumed by app
- Target: < 50% of device RAM
- Monitor over time (detect leaks)

```typescript
import { PerfLog } from 'react-native'

export async function getMemoryUsage(): Promise<{
  jsHeapSize: number
  nativeHeap: number
  totalMemory: number
}> {
  try {
    const memoryInfo = require('react-native/Libraries/Performance/Performance').getEntry('memory')
    return memoryInfo
  } catch (error) {
    console.error('Failed to get memory:', error)
    return { jsHeapSize: 0, nativeHeap: 0, totalMemory: 0 }
  }
}
```

**CPU Usage**
- CPU utilization while app is active
- Target: < 50% average
- Monitor peaks during heavy operations

**Battery Drain**
- Estimated battery percentage decrease per hour
- Target: < 5% per hour during normal use
- Major factors: Location tracking, background processing, CPU

### Network Metrics

**API Response Time**
- Time from request sent to response received
- Target: < 500ms (p95)
- Track by endpoint and network condition

```typescript
export async function measureAPICall(url: string): Promise<number> {
  const startTime = performance.now()
  
  try {
    const response = await fetch(url)
    const duration = performance.now() - startTime
    
    return duration
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}
```

**Network Latency**
- Time for network round trip
- Target: < 200ms on 4G, < 100ms on WiFi
- Affected by: Signal strength, distance to server

**Data Transfer Size**
- Amount of data downloaded
- Target: < 1MB for initial load
- Optimize with: Compression, pagination, lazy loading

---

## Monitoring Dashboard

### Real-Time Metrics

Create dashboards for these real-time metrics:

```yaml
App Performance:
  - Startup Time: Average + P95 + P99
  - Crash Rate: Current + 24h trend
  - Error Rate: By type
  - Active Users: Real-time count

Screen Performance:
  - Screen Load Times: By screen
  - Frame Rate: Average FPS
  - Jank Events: Count + frequency
  - Memory by Screen: Peak + average

Network:
  - API Response Time: By endpoint + overall
  - Success Rate: % of successful requests
  - Data Transfer: Total + by type
  - Network Errors: Count + types

Device:
  - Memory Usage: % of total
  - CPU Usage: %
  - Battery Impact: mAh per hour
  - Temperature: Celsius
```

### Alerts Configuration

Set up alerts for critical thresholds:

```typescript
// Alert if startup time > 3s
if (startupTime > 3000) {
  sendAlert('Slow startup detected', { 
    duration: startupTime,
    severity: 'warning'
  })
}

// Alert if crash rate > 0.5%
if (crashRate > 0.005) {
  sendAlert('High crash rate detected', {
    rate: crashRate,
    severity: 'critical'
  })
}

// Alert if API response > 1s
if (apiResponseTime > 1000) {
  sendAlert('Slow API detected', {
    endpoint: url,
    duration: apiResponseTime,
    severity: 'warning'
  })
}
```

---

## Metric Collection Methods

### Method 1: Native SDKs

Use built-in metrics from Firebase Performance Monitoring:

```typescript
import perf from '@react-native-firebase/perf'

// Automatic screen tracking
perf().setScreenName('ProfileScreen')

// Custom trace
const trace = perf().newTrace('expensive_operation')
trace.start()

// Do work...

trace.stop()

// Custom metric
trace.incrementMetric('button_clicks', 1)
trace.putAttribute('screen_size', 'large')
```

### Method 2: Manual Instrumentation

Manually measure and report metrics:

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  getMetricStats(name: string) {
    const values = this.metrics.get(name) || []
    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    }
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index] || 0
  }

  reportMetrics(analyticsProvider: any): void {
    for (const [name, values] of this.metrics) {
      const stats = this.getMetricStats(name)
      analyticsProvider.logEvent(`perf_${name}`, stats)
    }
  }
}

const monitor = new PerformanceMonitor()

// Collect metrics
monitor.recordMetric('screen_load_time', 850)
monitor.recordMetric('screen_load_time', 920)
monitor.recordMetric('screen_load_time', 780)

// Report
monitor.reportMetrics(analyticsManager)
```

### Method 3: Web Vitals for React Native

Adapt Core Web Vitals for mobile:

```typescript
// Largest Contentful Paint (LCP) equivalent
// Time when main content is visible

// First Input Delay (FID) equivalent
// Time from interaction to response

// Cumulative Layout Shift (CLS) equivalent
// Visual stability while loading

export function measureCoreMetrics(): {
  lcp: number
  fid: number
  cls: number
} {
  // Measure on each screen/component
  // Track to analytics
  // Alert if thresholds exceeded
}
```

---

## Performance Baselines

### iOS Device Performance

| Device | Startup (ms) | RAM (MB) | CPU | Battery |
|--------|-------------|---------|-----|---------|
| iPhone 14 | 800-1200 | 100-150 | 20% | Low |
| iPhone SE (3rd gen) | 1200-1500 | 150-200 | 35% | High |
| iPhone 12 | 900-1300 | 120-170 | 25% | Medium |

### Android Device Performance

| Device | Startup (ms) | RAM (MB) | CPU | Battery |
|--------|-------------|---------|-----|---------|
| Pixel 7 | 1000-1400 | 150-250 | 30% | Medium |
| OnePlus 9 | 900-1200 | 200-300 | 25% | Low |
| Samsung Galaxy S20 | 1100-1500 | 250-350 | 35% | High |

### Network Conditions

| Condition | Latency | Bandwidth | Startup Impact |
|-----------|---------|-----------|----------------|
| WiFi | < 50ms | > 10Mbps | -500ms |
| 5G | 50-100ms | 100Mbps+ | -300ms |
| 4G LTE | 100-200ms | 5-20Mbps | Baseline |
| 3G | 200-500ms | 1-5Mbps | +1000ms |

---

## Optimization Targets

### Startup Time Optimization

| Component | Current | Target | Method |
|-----------|---------|--------|--------|
| App initialization | 800ms | 400ms | Lazy load, async init |
| First screen render | 600ms | 300ms | Optimize layout, memoize |
| Data fetching | 500ms | 300ms | Parallel requests, cache |
| **Total** | **1900ms** | **1000ms** | Combined |

### Memory Optimization

| Component | Current | Target | Method |
|-----------|---------|--------|--------|
| JS Heap | 50MB | 30MB | Remove unused libs |
| Images cache | 30MB | 15MB | Compress, lazy load |
| Native heap | 20MB | 15MB | Reduce allocations |
| **Total** | **100MB** | **60MB** | Combined |

---

## Monitoring in Production

### Crash Rate Calculation

```typescript
const crashRate = (totalCrashes / totalSessions) * 100

// Target: < 0.1%
// Alert: > 0.5%
// Critical: > 1%
```

### Stability Index

```typescript
const stabilityIndex = (errorFreeSessions / totalSessions) * 100

// Target: > 99%
// Good: 99-99.5%
// Acceptable: 98-99%
// Poor: < 98%
```

### User Satisfaction

```typescript
// Based on metric thresholds
if (startupTime < 1000 && crashRate < 0.1) {
  userSatisfaction = 'excellent'
} else if (startupTime < 2000 && crashRate < 0.5) {
  userSatisfaction = 'good'
} else if (startupTime < 4000 && crashRate < 1.0) {
  userSatisfaction = 'acceptable'
} else {
  userSatisfaction = 'poor'
}
```

---

## Reporting Template

### Weekly Performance Report

```
Performance Report - Week of Oct 16-22

🟢 Metrics on Target:
  - Crash rate: 0.08% (target: < 0.1%)
  - API response: 320ms p95 (target: < 500ms)
  - Memory: 45MB average (target: < 50MB)

🟡 Metrics Trending Down:
  - Startup time: 1050ms (was 950ms last week, +10%)
  - Frame rate: 58 FPS (was 59 FPS, -1%)

🔴 Metrics Critical:
  - Screen load: 2.3s (target: < 1s) - ProfileScreen
  - Battery drain: 8% per hour (target: < 5%)

Actions Taken:
  1. Optimized ProfileScreen API query (reduced payload 40%)
  2. Reduced image sizes (batch process)
  3. Profiled battery usage in BackgroundSyncService

Next Steps:
  1. Implement image caching
  2. Profile and optimize ProfileScreen rendering
  3. Review BackgroundSyncService battery impact
```

---

## Best Practices

✅ **Do**:
- Monitor both performance and stability metrics
- Set realistic targets based on device baselines
- Alert on anomalies
- Report weekly
- Correlate metrics with releases
- Test on real devices
- Monitor production data continuously

❌ **Don't**:
- Over-engineer for metrics
- Ignore real-user metrics for lab measurements
- Set targets too aggressively
- Track metrics with no action plan
- Ignore platform differences
- Neglect memory profiling
- Only monitor happy path

---

## Tools for Metrics Collection

- **Firebase Performance Monitoring**: Built-in, easy
- **Xcode Instruments**: iOS profiling
- **Android Profiler**: Android profiling
- **Sentry**: Crash and error metrics
- **Custom Dashboards**: More control
- **Grafana**: Open-source dashboards
