---
name: native-modules
description: Patterns for building native modules in Expo and React Native. Covers Expo Modules API (Swift/Kotlin), Turbo Modules (C++/JSI), platform-specific bridging, and common use cases like wrapping SDKs, camera/sensors, background tasks, and native UI components.
version: 1.0.0
license: MIT
metadata:
  author: Inspired
  tags: native-modules, expo-modules, turbo-modules, jsi, swift, kotlin, c++, bridging
---

# Native Modules

## Overview

Guide for building native modules in React Native / Expo applications. Covers two primary approaches:

- **Expo Modules API** — Modern, declarative API for building native modules with Swift and Kotlin. Recommended for most use cases.
- **Turbo Modules** — Lower-level approach using C++/JSI for maximum performance and cross-platform code sharing.

## When to Build a Native Module

Before building a native module, check if an existing Expo or community package solves the problem. Build a native module when:

- No existing package provides the needed functionality
- You need to wrap a proprietary or third-party native SDK
- Performance-critical code must run on the native thread
- You need access to platform APIs not exposed by React Native
- You need a custom native UI component

## Priority-Ordered Guidelines

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Expo Modules API | CRITICAL | `expo-*` |
| 2 | Turbo Modules & JSI | HIGH | `turbo-*` |
| 3 | Platform-Specific | HIGH | `ios-*`, `android-*`, `gradle-*` |
| 4 | Common Use Cases | MEDIUM | use case specific |

## Quick Reference

### Expo Modules API (Recommended)

**Create a new module:**
```bash
npx create-expo-module@latest my-module
# or inside an existing app:
npx create-expo-module@latest --local my-module
```

**Module definition (Swift):**
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

**Module definition (Kotlin):**
```kotlin
package expo.modules.mymodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyModule")

    Function("hello") { name: String ->
      "Hello, $name!"
    }
  }
}
```

**TypeScript usage:**
```typescript
import { requireNativeModule } from 'expo-modules-core';

const MyModule = requireNativeModule('MyModule');
const greeting = MyModule.hello('World');
```

### Turbo Modules (Advanced)

**When to use Turbo Modules over Expo Modules API:**
- Need synchronous JSI calls (no async bridge overhead)
- Sharing C++ code between iOS and Android
- Extreme performance requirements (real-time audio/video processing)
- Integrating with existing C++ libraries

**Codegen spec:**
```typescript
// NativeMyModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): number;
  getConstants(): { PI: number };
}

export default TurboModuleRegistry.getEnforcing<Spec>('MyModule');
```

### Decision Matrix

| Criteria | Expo Modules API | Turbo Modules |
|----------|-----------------|---------------|
| Setup complexity | Low | High |
| Swift/Kotlin support | Native | Via bridging |
| C++ shared code | No | Yes |
| Sync JS calls (JSI) | No | Yes |
| Expo Go compatible | With config plugin | No |
| Type generation | Manual | Codegen |
| Community adoption | Growing | Established |
| Recommended for | Most apps | Performance-critical |

## References

Full documentation with code examples in `references/`:

### Expo Modules API (`expo-*`)

| File | Impact | Description |
|------|--------|-------------|
| `expo-module-definition.md` | CRITICAL | Module definition patterns in Swift & Kotlin |
| `expo-module-typescript.md` | CRITICAL | TypeScript specs & type-safe bindings |
| `expo-module-events-callbacks.md` | HIGH | Events, Promises, Callbacks between native ↔ JS |
| `expo-native-views.md` | HIGH | Building native UI views with Expo Modules API |

### Turbo Modules (`turbo-*`)

| File | Impact | Description |
|------|--------|-------------|
| `turbo-codegen-setup.md` | HIGH | React Native Codegen setup & spec writing |
| `turbo-cpp-jsi.md` | HIGH | C++ JSI bindings & host objects |
| `turbo-registry-migration.md` | HIGH | TurboModuleRegistry & New Architecture migration |

### Platform-Specific

| File | Impact | Description |
|------|--------|-------------|
| `ios-swift-objc.md` | HIGH | iOS: Swift interop, Objective-C bridging |
| `android-kotlin-jni.md` | HIGH | Android: Kotlin/Java, JNI basics |
| `gradle-cocoapods-config.md` | MEDIUM | Build system configuration for native modules |

### Common Use Cases

| File | Impact | Description |
|------|--------|-------------|
| `wrapping-native-sdks.md` | HIGH | Wrapping third-party native SDKs |
| `camera-sensors.md` | MEDIUM | Camera & sensor access patterns |
| `background-tasks.md` | MEDIUM | Background tasks & services |
| `native-ui-components.md` | HIGH | Custom native UI components (Fabric) |

## Searching References

```bash
grep -l "expo" references/
grep -l "turbo" references/
grep -l "swift" references/
grep -l "kotlin" references/
grep -l "jsi" references/
grep -l "camera" references/
```

## Problem → Skill Mapping

| Problem | Start With |
|---------|------------|
| Need a new native module (simple) | `expo-module-definition.md` → `expo-module-typescript.md` |
| Need native ↔ JS communication | `expo-module-events-callbacks.md` |
| Need a custom native view | `expo-native-views.md` or `native-ui-components.md` |
| Need sync JS calls / max performance | `turbo-cpp-jsi.md` → `turbo-codegen-setup.md` |
| Migrating to New Architecture | `turbo-registry-migration.md` |
| Wrapping a third-party SDK | `wrapping-native-sdks.md` |
| iOS Swift/ObjC issues | `ios-swift-objc.md` |
| Android Kotlin/JNI issues | `android-kotlin-jni.md` |
| Build system problems | `gradle-cocoapods-config.md` |
| Camera or sensor access | `camera-sensors.md` |
| Background processing | `background-tasks.md` |
| Sharing C++ code cross-platform | `turbo-cpp-jsi.md` |
