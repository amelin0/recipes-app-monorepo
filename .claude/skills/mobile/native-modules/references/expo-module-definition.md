---
title: Expo Module Definition
impact: CRITICAL
tags: expo-modules, swift, kotlin, module-definition, native
---

# Expo Module Definition (Swift & Kotlin)

## Quick Pattern

**Incorrect — using old Bridge API:**
```swift
@objc(MyModule)
class MyModule: NSObject {
  @objc func hello(_ name: String, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    resolver("Hello, \(name)!")
  }
}
```

**Correct — using Expo Modules API:**
```swift
import ExpoModulesCore

public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MyModule")

    Function("hello") { (name: String) -> String in
      return "Hello, \(name)!"
    }
  }
}
```

## When to Use

- Building a new native module for an Expo/React Native app
- Wrapping platform-specific APIs (HealthKit, ML Kit, etc.)
- Need async or sync functions callable from JavaScript
- Need to manage native lifecycle (onCreate, onDestroy)

## Prerequisites

- Expo SDK 47+ (Expo Modules API stable)
- Xcode 14+ for iOS
- Android Studio with Kotlin support
- `expo-modules-core` dependency

## Quick Command

```bash
# Create standalone module (publishable to npm)
npx create-expo-module@latest my-module

# Create local module inside existing app
npx create-expo-module@latest --local modules/my-module
```

## Step-by-Step

### 1. Module Scaffolding

After running `create-expo-module`, you get:

```
my-module/
├── android/
│   └── src/main/java/expo/modules/mymodule/
│       └── MyModule.kt
├── ios/
│   └── MyModule.swift
├── src/
│   └── index.ts          # JS/TS interface
├── expo-module.config.json
└── package.json
```

### 2. iOS Module Definition (Swift)

```swift
import ExpoModulesCore

public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    // Module name exposed to JS
    Name("MyModule")

    // Constants available as MyModule.PI
    Constants([
      "PI": Double.pi
    ])

    // Synchronous function (runs on JS thread)
    Function("add") { (a: Double, b: Double) -> Double in
      return a + b
    }

    // Async function (runs on module's own queue)
    AsyncFunction("fetchData") { (url: String, promise: Promise) in
      // Perform async work
      URLSession.shared.dataTask(with: URL(string: url)!) { data, _, error in
        if let error = error {
          promise.reject(error)
        } else if let data = data {
          promise.resolve(String(data: data, encoding: .utf8))
        }
      }.resume()
    }

    // Lifecycle
    OnCreate {
      // Called when module is initialized
    }

    OnDestroy {
      // Cleanup resources
    }
  }
}
```

### 3. Android Module Definition (Kotlin)

```kotlin
package expo.modules.mymodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyModule")

    Constants(
      "PI" to Math.PI
    )

    Function("add") { a: Double, b: Double ->
      a + b
    }

    AsyncFunction("fetchData") { url: String, promise: Promise ->
      try {
        val data = withContext(Dispatchers.IO) {
          URL(url).readText()
        }
        promise.resolve(data)
      } catch (e: Exception) {
        promise.reject("FETCH_ERROR", e.message, e)
      }
    }

    OnCreate {
      // Module initialized
    }

    OnDestroy {
      // Cleanup
    }
  }
}
```

### 4. expo-module.config.json

```json
{
  "platforms": ["ios", "android"],
  "ios": {
    "modules": ["MyModule"]
  },
  "android": {
    "modules": ["expo.modules.mymodule.MyModule"]
  }
}
```

### 5. TypeScript Interface

```typescript
import { requireNativeModule } from 'expo-modules-core';

interface MyModuleInterface {
  PI: number;
  add(a: number, b: number): number;
  fetchData(url: string): Promise<string>;
}

const MyModule = requireNativeModule<MyModuleInterface>('MyModule');

export const { PI } = MyModule;
export const add = MyModule.add;
export const fetchData = MyModule.fetchData;
```

## Module Definition DSL Reference

| DSL Component | Purpose | Thread |
|---------------|---------|--------|
| `Name()` | Module name for JS | — |
| `Constants()` | Static values | — |
| `Function()` | Sync function | JS thread |
| `AsyncFunction()` | Async function | Module queue |
| `Property()` | Getter/setter | JS thread |
| `Events()` | Declare event names | — |
| `OnCreate` | Module init | Main thread |
| `OnDestroy` | Module cleanup | Main thread |
| `OnStartObserving` | First event listener added | Main thread |
| `OnStopObserving` | Last event listener removed | Main thread |
| `OnAppEntersForeground` | App foreground | Main thread |
| `OnAppBecomesActive` | App active | Main thread |
| `OnAppEntersBackground` | App background | Main thread |

## Common Pitfalls

1. **Forgetting `expo-module.config.json`** — Module won't be discovered without it
2. **Thread safety** — `Function` runs on JS thread; use `AsyncFunction` for heavy work
3. **Type mismatches** — Expo auto-converts types but complex objects need `Record` or `Convertible` protocols
4. **Missing `public` modifier** on Swift classes — Module class and `definition()` must be `public`
5. **Wrong package name** in Kotlin — Must match directory structure exactly
6. **Not running `npx expo prebuild --clean`** after adding a local module

## Related Skills

- [expo-module-typescript.md](expo-module-typescript.md) — Type-safe bindings
- [expo-module-events-callbacks.md](expo-module-events-callbacks.md) — Events & callbacks
- [wrapping-native-sdks.md](wrapping-native-sdks.md) — Wrapping SDKs with Expo Modules
