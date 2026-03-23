---
title: C++ JSI Bindings
impact: HIGH
tags: turbo-modules, jsi, c++, host-objects, performance
---

# C++ JSI Bindings & Host Objects

## Quick Pattern

**Incorrect — passing large data through JSON bridge:**
```typescript
// Serializes entire array to JSON, crosses bridge, deserializes
const data = await NativeModules.DataProcessor.process(largeArray);
```

**Correct — shared memory via JSI:**
```cpp
// Direct memory access, no serialization
jsi::ArrayBuffer buffer = runtime.global()
  .getPropertyAsObject(runtime, "ArrayBuffer");
// Process directly in C++, result available in JS immediately
```

## When to Use

- Sharing C++ code between iOS and Android (write once)
- Performance-critical operations (audio/video processing, ML inference)
- Direct memory sharing between native and JS (ArrayBuffer)
- Synchronous native function calls
- Wrapping existing C++ libraries

## Prerequisites

- React Native New Architecture enabled
- C++17 support (Xcode 14+, NDK 25+)
- Understanding of `jsi::Runtime`, `jsi::Value`, `jsi::Object`

## Core JSI Concepts

### jsi::HostObject — Expose C++ Objects to JS

```cpp
// MyProcessor.h
#pragma once
#include <jsi/jsi.h>

using namespace facebook;

class MyProcessor : public jsi::HostObject {
public:
  // Called when JS reads a property: obj.someProperty
  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override {
    auto propName = name.utf8(rt);

    if (propName == "multiply") {
      return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "multiply"),
        2, // argument count
        [](jsi::Runtime& rt, const jsi::Value& thisVal,
           const jsi::Value* args, size_t count) -> jsi::Value {
          double a = args[0].asNumber();
          double b = args[1].asNumber();
          return jsi::Value(a * b);
        }
      );
    }

    if (propName == "version") {
      return jsi::String::createFromUtf8(rt, "1.0.0");
    }

    return jsi::Value::undefined();
  }

  // Called when JS sets a property: obj.someProperty = value
  void set(jsi::Runtime& rt, const jsi::PropNameID& name,
           const jsi::Value& value) override {
    // Handle property assignment
  }

  // List all properties for Object.keys()
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override {
    std::vector<jsi::PropNameID> result;
    result.push_back(jsi::PropNameID::forAscii(rt, "multiply"));
    result.push_back(jsi::PropNameID::forAscii(rt, "version"));
    return result;
  }
};
```

### Installing on the Runtime

```cpp
// MyProcessorBinding.cpp
#include "MyProcessor.h"

void installMyProcessor(jsi::Runtime& runtime) {
  auto processor = std::make_shared<MyProcessor>();
  auto object = jsi::Object::createFromHostObject(runtime, processor);
  runtime.global().setProperty(runtime, "MyProcessor", std::move(object));
}
```

### Usage from JavaScript

```typescript
// After installation, MyProcessor is on global
declare global {
  var MyProcessor: {
    multiply(a: number, b: number): number;
    version: string;
  };
}

const result = globalThis.MyProcessor.multiply(6, 7); // 42, sync!
```

## Integration with TurboModule

```cpp
// MyMathTurboModule.h
#pragma once
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>

namespace facebook::react {

class MyMathTurboModule : public TurboModule {
public:
  MyMathTurboModule(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Value multiply(jsi::Runtime& rt, double a, double b);
  jsi::Value processBuffer(jsi::Runtime& rt, jsi::Object buffer);
};

} // namespace facebook::react
```

```cpp
// MyMathTurboModule.cpp
#include "MyMathTurboModule.h"

namespace facebook::react {

MyMathTurboModule::MyMathTurboModule(
  std::shared_ptr<CallInvoker> jsInvoker
) : TurboModule("MyMath", jsInvoker) {

  methodMap_["multiply"] = MethodMetadata{
    2, // arg count
    [](jsi::Runtime& rt, TurboModule& module,
       const jsi::Value* args, size_t count) {
      auto& self = static_cast<MyMathTurboModule&>(module);
      return self.multiply(rt, args[0].asNumber(), args[1].asNumber());
    }
  };
}

jsi::Value MyMathTurboModule::multiply(jsi::Runtime& rt, double a, double b) {
  return jsi::Value(a * b);
}

} // namespace facebook::react
```

## Platform Integration

### iOS — CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.13)
project(MyModule)

set(CMAKE_CXX_STANDARD 17)

add_library(mymodule SHARED
  cpp/MyProcessor.cpp
  cpp/MyMathTurboModule.cpp
)

target_include_directories(mymodule PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}/cpp
)
```

### Android — CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.13)
project(mymodule)

set(CMAKE_CXX_STANDARD 17)

find_package(fbjni REQUIRED)
find_package(ReactAndroid REQUIRED)

add_library(mymodule SHARED
  cpp/MyProcessor.cpp
  cpp/MyMathTurboModule.cpp
  cpp/OnLoad.cpp
)

target_link_libraries(mymodule
  fbjni::fbjni
  ReactAndroid::jsi
  ReactAndroid::turbomodulejsijni
)
```

## JSI Type Reference

| JSI Type | JS Equivalent | Create | Read |
|----------|--------------|--------|------|
| `jsi::Value` | `any` | Various | `.asNumber()`, `.asString()` |
| `jsi::String` | `string` | `String::createFromUtf8(rt, "...")` | `.utf8(rt)` |
| `jsi::Object` | `object` | `Object(rt)` | `.getProperty(rt, "key")` |
| `jsi::Array` | `Array` | `Array(rt, size)` | `.getValueAtIndex(rt, i)` |
| `jsi::Function` | `Function` | `Function::createFromHostFunction(...)` | `.call(rt, args...)` |
| `jsi::ArrayBuffer` | `ArrayBuffer` | Via JS | `.data(rt)`, `.size(rt)` |

## Common Pitfalls

1. **Runtime lifetime** — Never store `jsi::Runtime&` references; pass as parameter
2. **Thread safety** — JSI calls must happen on the JS thread unless using `CallInvoker`
3. **Memory management** — Use `std::shared_ptr` for HostObjects to avoid dangling pointers
4. **String encoding** — Always use UTF-8; `jsi::String` assumes UTF-8
5. **Exception handling** — Catch C++ exceptions before they cross the JSI boundary
6. **Build complexity** — CMake setup is non-trivial; test on both platforms early

## Related Skills

- [turbo-codegen-setup.md](turbo-codegen-setup.md) — Codegen for auto-generated bindings
- [turbo-registry-migration.md](turbo-registry-migration.md) — Migration from Bridge to JSI
