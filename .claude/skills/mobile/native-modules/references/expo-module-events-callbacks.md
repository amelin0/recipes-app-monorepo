---
title: Events, Promises & Callbacks
impact: HIGH
tags: expo-modules, events, promises, callbacks, communication
---

# Events, Promises & Callbacks

## Quick Pattern

**Incorrect — polling from JS:**
```typescript
setInterval(async () => {
  const progress = await MyModule.getProgress();
  setProgress(progress);
}, 100);
```

**Correct — event-driven:**
```typescript
const subscription = addProgressListener(({ progress }) => {
  setProgress(progress);
});
// Cleanup
return () => subscription.remove();
```

## When to Use

- **Events**: Native → JS notifications (progress, state changes, sensor data)
- **Promises**: JS → Native async operations (file I/O, network, processing)
- **Callbacks**: One-time native → JS responses (deprecated in favor of Promises)

## Events: Native → JavaScript

### iOS (Swift)

```swift
import ExpoModulesCore

public class DownloadModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DownloadModule")

    // Declare which events this module can send
    Events("onProgress", "onComplete", "onError")

    AsyncFunction("startDownload") { (url: String) in
      self.download(url: url)
    }
  }

  private func download(url: String) {
    // Send progress events
    sendEvent("onProgress", [
      "progress": 0.5,
      "bytesWritten": 512000,
      "totalBytes": 1024000
    ])

    // Send completion event
    sendEvent("onComplete", [
      "path": "/tmp/downloaded-file.zip"
    ])
  }
}
```

### Android (Kotlin)

```kotlin
package expo.modules.download

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DownloadModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DownloadModule")

    Events("onProgress", "onComplete", "onError")

    AsyncFunction("startDownload") { url: String ->
      download(url)
    }
  }

  private fun download(url: String) {
    sendEvent("onProgress", mapOf(
      "progress" to 0.5,
      "bytesWritten" to 512000,
      "totalBytes" to 1024000
    ))

    sendEvent("onComplete", mapOf(
      "path" to "/tmp/downloaded-file.zip"
    ))
  }
}
```

### TypeScript Listener

```typescript
import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import { useEffect, useState } from 'react';

const DownloadModule = requireNativeModule('DownloadModule');
const emitter = new EventEmitter(DownloadModule);

// Hook for consuming events
export function useDownloadProgress(url: string) {
  const [progress, setProgress] = useState(0);
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    DownloadModule.startDownload(url);

    const progressSub = emitter.addListener('onProgress', (event) => {
      setProgress(event.progress);
    });

    const completeSub = emitter.addListener('onComplete', (event) => {
      setPath(event.path);
    });

    return () => {
      progressSub.remove();
      completeSub.remove();
    };
  }, [url]);

  return { progress, path };
}
```

## Observer Lifecycle

Control resource usage with start/stop observing:

```swift
public class SensorModule: Module {
  private var timer: Timer?

  public func definition() -> ModuleDefinition {
    Name("SensorModule")

    Events("onReading")

    // Called when first JS listener is added
    OnStartObserving {
      self.timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
        self.sendEvent("onReading", ["value": self.readSensor()])
      }
    }

    // Called when last JS listener is removed
    OnStopObserving {
      self.timer?.invalidate()
      self.timer = nil
    }
  }
}
```

## Promises: JavaScript → Native

### Async Function (Recommended)

```swift
// Swift
AsyncFunction("compress") { (imagePath: String, quality: Double, promise: Promise) in
  DispatchQueue.global(qos: .userInitiated).async {
    do {
      let result = try ImageCompressor.compress(path: imagePath, quality: quality)
      promise.resolve(["path": result.path, "size": result.size])
    } catch {
      promise.reject(error)
    }
  }
}
```

```kotlin
// Kotlin
AsyncFunction("compress") { imagePath: String, quality: Double, promise: Promise ->
  try {
    val result = ImageCompressor.compress(imagePath, quality)
    promise.resolve(mapOf("path" to result.path, "size" to result.size))
  } catch (e: Exception) {
    promise.reject("COMPRESS_ERROR", e.message, e)
  }
}
```

### Error Handling Pattern

```swift
// Define custom exceptions
class FileNotFoundException: GenericException<String> {
  override var reason: String {
    "File not found: \(param)"
  }
}

// Use in module
AsyncFunction("readFile") { (path: String, promise: Promise) in
  guard FileManager.default.fileExists(atPath: path) else {
    throw FileNotFoundException(path)
  }
  // ...
}
```

## Communication Pattern Summary

| Pattern | Direction | Use Case | Multiplicity |
|---------|-----------|----------|-------------|
| `Function` | JS → Native | Sync computation | One-shot |
| `AsyncFunction` | JS → Native | Async I/O | One-shot |
| `Events` + `sendEvent` | Native → JS | Progress, state | Continuous |
| `Property` (get/set) | Both | Configuration | One-shot |

## Common Pitfalls

1. **Forgetting to declare events** — `Events("onProgress")` is required before `sendEvent`
2. **Memory leaks** — Always remove event subscriptions in cleanup (`useEffect` return)
3. **Thread issues** — `sendEvent` must be called from main thread on iOS
4. **Missing OnStopObserving** — Sensors/timers keep running when no listeners exist
5. **Large payloads** — Events serialize data across the bridge; keep payloads small

## Related Skills

- [expo-module-definition.md](expo-module-definition.md) — Module definition patterns
- [expo-module-typescript.md](expo-module-typescript.md) — TypeScript bindings
- [camera-sensors.md](camera-sensors.md) — Real-world event usage
