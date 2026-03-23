---
title: Background Tasks & Services
impact: MEDIUM
tags: background-tasks, services, background-fetch, workmanager
---

# Background Tasks & Services

## Quick Reference

| Task Type | iOS | Android | Duration |
|-----------|-----|---------|----------|
| Background Fetch | BGAppRefreshTask | WorkManager | ~30s |
| Background Processing | BGProcessingTask | WorkManager | Minutes |
| Location Updates | CLLocationManager (always) | ForegroundService | Continuous |
| Audio Playback | AVAudioSession | ForegroundService | Continuous |
| Push Notification Processing | UNNotificationServiceExtension | FirebaseMessagingService | ~30s |
| File Upload/Download | URLSession (background) | WorkManager + DownloadManager | Minutes-Hours |

## Expo Background Module

### iOS (Swift) — Background Fetch

```swift
import ExpoModulesCore
import BackgroundTasks

public class BackgroundModule: Module {
  static let taskIdentifier = "com.myapp.refresh"

  public func definition() -> ModuleDefinition {
    Name("BackgroundModule")

    Events("onBackgroundFetch")

    Function("registerBackgroundFetch") { (intervalMinutes: Int) in
      self.registerTask(interval: TimeInterval(intervalMinutes * 60))
    }

    Function("unregisterBackgroundFetch") {
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: Self.taskIdentifier)
    }
  }

  private func registerTask(interval: TimeInterval) {
    BGTaskScheduler.shared.register(
      forTaskWithIdentifier: Self.taskIdentifier,
      using: nil
    ) { task in
      self.handleBackgroundFetch(task: task as! BGAppRefreshTask)
    }

    let request = BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)
    request.earliestBeginDate = Date(timeIntervalSinceNow: interval)
    try? BGTaskScheduler.shared.submit(request)
  }

  private func handleBackgroundFetch(task: BGAppRefreshTask) {
    // Schedule next fetch
    let request = BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)
    request.earliestBeginDate = Date(timeIntervalSinceNow: 900) // 15 min
    try? BGTaskScheduler.shared.submit(request)

    // Do work
    sendEvent("onBackgroundFetch", ["timestamp": Date().timeIntervalSince1970])

    // Must call setTaskCompleted
    task.setTaskCompleted(success: true)

    task.expirationHandler = {
      task.setTaskCompleted(success: false)
    }
  }
}
```

### Android (Kotlin) — WorkManager

```kotlin
package expo.modules.background

import android.content.Context
import androidx.work.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

class BackgroundModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BackgroundModule")

    Function("registerBackgroundFetch") { intervalMinutes: Int ->
      val context = appContext.reactContext ?: return@Function

      val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .build()

      val request = PeriodicWorkRequestBuilder<BackgroundFetchWorker>(
        intervalMinutes.toLong(), TimeUnit.MINUTES
      )
        .setConstraints(constraints)
        .addTag("background-fetch")
        .build()

      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "background-fetch",
        ExistingPeriodicWorkPolicy.UPDATE,
        request
      )
    }

    Function("unregisterBackgroundFetch") {
      val context = appContext.reactContext ?: return@Function
      WorkManager.getInstance(context).cancelUniqueWork("background-fetch")
    }
  }
}

// Worker class
class BackgroundFetchWorker(
  context: Context,
  params: WorkerParameters
) : CoroutineWorker(context, params) {

  override suspend fun doWork(): Result {
    return try {
      // Perform background work
      syncData()
      Result.success()
    } catch (e: Exception) {
      if (runAttemptCount < 3) Result.retry() else Result.failure()
    }
  }

  private suspend fun syncData() {
    // Your sync logic here
  }
}
```

### Config Plugin for Background Modes

```javascript
// plugin/withBackgroundModes.js
const { withInfoPlist, withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withBackgroundModes(config, { modes = [] }) {
  // iOS Background Modes
  config = withInfoPlist(config, (config) => {
    config.modResults.UIBackgroundModes = modes;
    // Register task identifier
    config.modResults.BGTaskSchedulerPermittedIdentifiers = [
      "com.myapp.refresh",
    ];
    return config;
  });

  // Android foreground service permission
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    manifest["uses-permission"].push(
      { $: { "android:name": "android.permission.FOREGROUND_SERVICE" } },
      { $: { "android:name": "android.permission.WAKE_LOCK" } }
    );
    return config;
  });

  return config;
};
```

### TypeScript Interface

```typescript
import { requireNativeModule, EventEmitter } from 'expo-modules-core';

const BackgroundModule = requireNativeModule('BackgroundModule');
const emitter = new EventEmitter(BackgroundModule);

export function registerBackgroundFetch(intervalMinutes: number = 15) {
  BackgroundModule.registerBackgroundFetch(intervalMinutes);
}

export function unregisterBackgroundFetch() {
  BackgroundModule.unregisterBackgroundFetch();
}

export function onBackgroundFetch(
  listener: (event: { timestamp: number }) => void
) {
  return emitter.addListener('onBackgroundFetch', listener);
}
```

## iOS Background Modes

| Mode | UIBackgroundModes value | Use Case |
|------|------------------------|----------|
| Audio | `audio` | Music playback |
| Location | `location` | GPS tracking |
| VoIP | `voip` | Voice calls |
| Fetch | `fetch` | Periodic data sync |
| Remote Notifications | `remote-notification` | Silent push |
| Processing | `processing` | Heavy background work |

## Common Pitfalls

1. **iOS 30-second limit** — Background fetch tasks must complete within ~30 seconds
2. **Missing BGTaskSchedulerPermittedIdentifiers** — iOS won't run tasks without Info.plist entry
3. **WorkManager minimum interval** — Android PeriodicWork minimum is 15 minutes
4. **Battery optimization** — Android may defer/skip tasks in Doze mode
5. **App Store rejection** — Apple rejects apps that misuse background modes
6. **Testing** — Background tasks are hard to test; use Xcode debug commands:
   ```bash
   # Simulate background fetch in Xcode
   e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.myapp.refresh"]
   ```

## Related Skills

- [expo-module-events-callbacks.md](expo-module-events-callbacks.md) — Event patterns
- [camera-sensors.md](camera-sensors.md) — Background sensor access
