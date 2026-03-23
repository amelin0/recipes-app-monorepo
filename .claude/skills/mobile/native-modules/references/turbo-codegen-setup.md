---
title: Turbo Modules Codegen Setup
impact: HIGH
tags: turbo-modules, codegen, new-architecture, specs
---

# Turbo Modules: Codegen Setup

## Quick Pattern

**Incorrect — old NativeModules bridge:**
```typescript
import { NativeModules } from 'react-native';
const { MyModule } = NativeModules;
MyModule.multiply(2, 3); // No type safety, async bridge
```

**Correct — TurboModule with Codegen:**
```typescript
import NativeMyModule from './NativeMyModule';
const result = NativeMyModule.multiply(2, 3); // Typed, sync JSI
```

## When to Use

- Building modules for React Native New Architecture
- Need synchronous native calls without bridge overhead
- Want auto-generated native interfaces from TypeScript specs
- Building a library that must support both architectures

## Prerequisites

- React Native 0.72+ (stable Codegen)
- New Architecture enabled (`newArchEnabled=true`)
- C++ toolchain (Xcode / NDK)

## Step-by-Step

### 1. Create the TypeScript Spec

Specs must be named `Native<ModuleName>.ts` and placed in the module root or a configured spec directory.

```typescript
// NativeMyMath.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Sync methods (JSI — no bridge)
  multiply(a: number, b: number): number;
  add(a: number, b: number): number;

  // Async methods
  computeHeavy(input: string): Promise<string>;

  // Constants
  getConstants(): {
    PI: number;
    E: number;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('MyMath');
```

### 2. Configure Codegen in package.json

```json
{
  "name": "react-native-my-math",
  "codegenConfig": {
    "name": "MyMathSpec",
    "type": "modules",
    "jsSrcsDir": "src",
    "android": {
      "javaPackageName": "com.mymath"
    }
  }
}
```

### 3. Run Codegen

```bash
# iOS — runs automatically during pod install
cd ios && pod install

# Android — runs automatically during build
cd android && ./gradlew generateCodegenArtifactsFromSchema

# Manual (for debugging)
npx react-native codegen
```

### 4. Generated Output

Codegen produces C++ interfaces that your native code must implement:

```
# iOS generated files (in ios/build/generated/)
MyMathSpec/
├── MyMathSpec.h          # C++ interface
├── MyMathSpec-generated.mm # Objective-C++ bridge

# Android generated files (in android/build/generated/)
java/com/mymath/
├── NativeMyMathSpec.java  # Java interface
```

### 5. Implement on iOS (Objective-C++)

```objc
// ios/MyMath.mm
#import "MyMathSpec.h"
#import <React/RCTLog.h>

@interface MyMath : NSObject <NativeMyMathSpec>
@end

@implementation MyMath

RCT_EXPORT_MODULE()

- (NSNumber *)multiply:(double)a b:(double)b {
  return @(a * b);
}

- (NSNumber *)add:(double)a b:(double)b {
  return @(a + b);
}

- (void)computeHeavy:(NSString *)input
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // Heavy computation
    resolve(@"result");
  });
}

- (NSDictionary *)getConstants {
  return @{ @"PI": @(M_PI), @"E": @(M_E) };
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeMyMathSpecJSI>(params);
}

@end
```

### 6. Implement on Android (Kotlin)

```kotlin
// android/src/main/java/com/mymath/MyMathModule.kt
package com.mymath

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise

class MyMathModule(reactContext: ReactApplicationContext) :
  NativeMyMathSpec(reactContext) {

  override fun getName() = NAME

  override fun multiply(a: Double, b: Double): Double = a * b

  override fun add(a: Double, b: Double): Double = a + b

  override fun computeHeavy(input: String, promise: Promise) {
    Thread {
      promise.resolve("result")
    }.start()
  }

  override fun getTypedExportedConstants(): Map<String, Any> = mapOf(
    "PI" to Math.PI,
    "E" to Math.E
  )

  companion object {
    const val NAME = "MyMath"
  }
}
```

## Supported Spec Types

| TypeScript | Codegen C++ | Notes |
|-----------|-------------|-------|
| `number` | `double` | Always double |
| `string` | `jsi::String` | |
| `boolean` | `bool` | |
| `Object` | `jsi::Object` | Generic object |
| `Array<T>` | `jsi::Array` | |
| `Promise<T>` | `AsyncCallback` | Async only |
| `?` optional | `std::optional<T>` | Nullable |

## Common Pitfalls

1. **Spec file naming** — Must be `Native*.ts` or `Native*.js` for Codegen to find it
2. **Missing `getEnforcing`** — Use `getEnforcing` not `get` for required modules
3. **Pod install needed** — Always run `pod install` after changing specs
4. **Type restrictions** — Codegen supports limited types; no unions, no generics
5. **Backward compatibility** — Guard with `TurboModuleRegistry.get()` for optional modules

## Related Skills

- [turbo-cpp-jsi.md](turbo-cpp-jsi.md) — Direct C++ JSI usage
- [turbo-registry-migration.md](turbo-registry-migration.md) — Migration guide
