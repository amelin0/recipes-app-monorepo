---
title: Expo Module TypeScript Specs
impact: CRITICAL
tags: expo-modules, typescript, type-safety, specs
---

# TypeScript Specs & Type-Safe Bindings

## Quick Pattern

**Incorrect — untyped native module access:**
```typescript
import { NativeModules } from 'react-native';
const result = NativeModules.MyModule.doSomething('test'); // No type safety
```

**Correct — typed Expo module:**
```typescript
import { requireNativeModule } from 'expo-modules-core';

interface MyModuleType {
  doSomething(input: string): Promise<Result>;
}

const MyModule = requireNativeModule<MyModuleType>('MyModule');
```

## When to Use

- Defining the JavaScript/TypeScript interface for any Expo native module
- Ensuring type safety between native and JS layers
- Creating a publishable module with proper TypeScript definitions

## Step-by-Step

### 1. Define the Module Interface

```typescript
// src/MyModule.types.ts

export interface FileInfo {
  name: string;
  size: number;
  mimeType: string;
  createdAt: number; // Unix timestamp
}

export interface MyModuleEvents {
  onProgress: (event: { progress: number; total: number }) => void;
  onComplete: (event: { result: string }) => void;
}
```

### 2. Create the Module Binding

```typescript
// src/MyModule.ts
import { requireNativeModule } from 'expo-modules-core';
import type { FileInfo } from './MyModule.types';

interface MyModuleSpec {
  // Constants
  readonly MAX_SIZE: number;
  readonly VERSION: string;

  // Sync functions
  isSupported(): boolean;
  getConfig(): Record<string, string>;

  // Async functions
  processFile(path: string): Promise<FileInfo>;
  uploadFile(path: string, url: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

export default requireNativeModule<MyModuleSpec>('MyModule');
```

### 3. Create the Event Emitter Binding

```typescript
// src/MyModuleEvents.ts
import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import type { MyModuleEvents } from './MyModule.types';

const MyModule = requireNativeModule('MyModule');
const emitter = new EventEmitter(MyModule);

export function addProgressListener(
  listener: MyModuleEvents['onProgress']
) {
  return emitter.addListener('onProgress', listener);
}

export function addCompleteListener(
  listener: MyModuleEvents['onComplete']
) {
  return emitter.addListener('onComplete', listener);
}
```

### 4. Create the Public API (Barrel Export)

```typescript
// src/index.ts
export { default } from './MyModule';
export { addProgressListener, addCompleteListener } from './MyModuleEvents';
export type { FileInfo, MyModuleEvents } from './MyModule.types';
```

### 5. Native View TypeScript Binding

```typescript
// src/MyModuleView.tsx
import { requireNativeView } from 'expo-modules-core';
import { ViewProps } from 'react-native';

interface MyNativeViewProps extends ViewProps {
  source: string;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  onLoad?: (event: { width: number; height: number }) => void;
  onError?: (event: { message: string }) => void;
}

const NativeView = requireNativeView<MyNativeViewProps>('MyModuleView');

export default NativeView;
```

## Type Mapping: Native ↔ TypeScript

| TypeScript | Swift | Kotlin |
|-----------|-------|--------|
| `number` | `Int`, `Double`, `Float` | `Int`, `Double`, `Float` |
| `string` | `String` | `String` |
| `boolean` | `Bool` | `Boolean` |
| `number[]` | `[Int]`, `[Double]` | `List<Int>`, `List<Double>` |
| `string[]` | `[String]` | `List<String>` |
| `Record<string, any>` | `[String: Any]` | `Map<String, Any>` |
| `Promise<T>` | `Promise` parameter | `Promise` parameter |
| `null` | `nil` | `null` |
| `Uint8Array` | `Data` | `ByteArray` |

## Custom Type Conversion

### Swift — Convertible Protocol

```swift
import ExpoModulesCore

struct FileInfo: Record {
  @Field var name: String = ""
  @Field var size: Int = 0
  @Field var mimeType: String = ""
  @Field var createdAt: Double = 0
}

// In module definition:
AsyncFunction("processFile") { (path: String) -> FileInfo in
  var info = FileInfo()
  info.name = "file.txt"
  info.size = 1024
  return info
}
```

### Kotlin — Record

```kotlin
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class FileInfo : Record {
  @Field val name: String = ""
  @Field val size: Int = 0
  @Field val mimeType: String = ""
  @Field val createdAt: Double = 0.0
}

// In module definition:
AsyncFunction("processFile") { path: String ->
  FileInfo().apply {
    name = "file.txt"
    size = 1024
  }
}
```

## Common Pitfalls

1. **Type mismatch crashes** — Native `Int` vs TypeScript `number` (always use `Double` on native for safe conversion)
2. **Optional params** — Mark as optional in both TypeScript and native: `(name: String?)` / `name: String?`
3. **Enum bridging** — Use string enums in TypeScript, map to native enums manually
4. **Missing `@Field` annotation** — Record fields without `@Field` won't be serialized

## Related Skills

- [expo-module-definition.md](expo-module-definition.md) — Module definition patterns
- [expo-module-events-callbacks.md](expo-module-events-callbacks.md) — Events & callbacks
