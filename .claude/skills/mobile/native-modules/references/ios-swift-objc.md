---
title: iOS Swift & Objective-C Interop
impact: HIGH
tags: ios, swift, objective-c, bridging, interop
---

# iOS: Swift Interop & Objective-C Bridging

## Quick Reference

| Approach | When to Use |
|----------|------------|
| Pure Swift (Expo Modules) | New modules, modern APIs |
| Objective-C++ (.mm) | TurboModules, JSI bindings |
| Swift + ObjC bridging | Wrapping legacy ObjC SDKs from Swift |
| Bridging Header | Importing ObjC code into Swift |

## Swift Module (Expo Modules API)

```swift
import ExpoModulesCore
import UIKit

public class DeviceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeviceModule")

    Function("getBatteryLevel") { () -> Double in
      UIDevice.current.isBatteryMonitoringEnabled = true
      return Double(UIDevice.current.batteryLevel)
    }

    Function("getDeviceModel") { () -> String in
      return UIDevice.current.model
    }

    AsyncFunction("getStorageInfo") { (promise: Promise) in
      let fileManager = FileManager.default
      if let attrs = try? fileManager.attributesOfFileSystem(
        forPath: NSHomeDirectory()
      ) {
        let total = attrs[.systemSize] as? Int64 ?? 0
        let free = attrs[.systemFreeSize] as? Int64 ?? 0
        promise.resolve([
          "totalBytes": total,
          "freeBytes": free
        ])
      } else {
        promise.reject("STORAGE_ERROR", "Could not read storage info")
      }
    }
  }
}
```

## Swift ↔ Objective-C Bridging

### Bridging Header (ObjC → Swift)

When wrapping an Objective-C SDK, create a bridging header:

```
// MyModule-Bridging-Header.h
#import "LegacySDK.h"
#import "LegacyAnalytics.h"
```

Then use ObjC classes directly in Swift:

```swift
import ExpoModulesCore

public class AnalyticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AnalyticsModule")

    Function("track") { (event: String, properties: [String: Any]) in
      // LegacyAnalytics is an ObjC class from bridging header
      LegacyAnalytics.shared().track(event, properties: properties)
    }
  }
}
```

### Exposing Swift to ObjC (`@objc`)

```swift
@objc public class MySwiftHelper: NSObject {
  @objc public static func processData(_ input: String) -> String {
    return input.uppercased()
  }
}
```

Then in Objective-C++:
```objc
#import "MyModule-Swift.h"  // Auto-generated header

NSString *result = [MySwiftHelper processData:@"hello"];
```

## Framework Integration

### Adding a Swift Package (SPM)

In your module's `Package.swift` or via Xcode:

```swift
// Package.swift
dependencies: [
  .package(url: "https://github.com/example/SomeSDK.git", from: "2.0.0")
]
```

### Adding via CocoaPods

```ruby
# MyModule.podspec
Pod::Spec.new do |s|
  s.name         = "MyModule"
  s.version      = "1.0.0"
  s.source_files = "ios/**/*.{swift,h,m,mm}"
  s.dependency "SomeSDK", "~> 2.0"
  s.swift_version = "5.9"
end
```

## Concurrency Patterns

### Swift async/await with Expo

```swift
AsyncFunction("fetchUser") { (userId: String, promise: Promise) in
  Task {
    do {
      let user = try await UserService.fetch(id: userId)
      promise.resolve([
        "id": user.id,
        "name": user.name,
        "email": user.email
      ])
    } catch {
      promise.reject(error)
    }
  }
}
```

### Dispatch Queues

```swift
AsyncFunction("processImage") { (path: String, promise: Promise) in
  DispatchQueue.global(qos: .userInitiated).async {
    let result = ImageProcessor.process(path: path)

    DispatchQueue.main.async {
      // UI updates must be on main thread
      promise.resolve(result)
    }
  }
}
```

## Common Pitfalls

1. **Missing `@objc` / `public`** — Swift classes/methods not visible to ObjC without annotations
2. **Swift naming conventions** — ObjC sees `func doSomething(with value:)` as `doSomethingWithValue:`
3. **Bridging header path** — Must be configured in Build Settings → "Objective-C Bridging Header"
4. **Null safety** — Swift optionals map to nullable ObjC pointers; unwrap carefully
5. **Main thread violations** — UIKit calls must happen on main thread
6. **Module stability** — Set "Build Libraries for Distribution" for binary frameworks

## Related Skills

- [expo-module-definition.md](expo-module-definition.md) — Expo Module patterns
- [gradle-cocoapods-config.md](gradle-cocoapods-config.md) — CocoaPods setup
- [wrapping-native-sdks.md](wrapping-native-sdks.md) — SDK wrapping patterns
