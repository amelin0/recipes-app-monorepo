---
title: Android Kotlin/Java & JNI
impact: HIGH
tags: android, kotlin, java, jni, native
---

# Android: Kotlin/Java & JNI Basics

## Quick Reference

| Approach | When to Use |
|----------|------------|
| Pure Kotlin (Expo Modules) | New modules, Android-only APIs |
| Kotlin (TurboModule) | New Architecture modules |
| Java + JNI | Wrapping C/C++ libraries |
| Kotlin + fbjni | React Native C++ integration |

## Kotlin Module (Expo Modules API)

```kotlin
package expo.modules.device

import android.os.Build
import android.os.StatFs
import android.os.Environment
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class DeviceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeviceModule")

    Function("getDeviceModel") {
      "${Build.MANUFACTURER} ${Build.MODEL}"
    }

    Function("getApiLevel") {
      Build.VERSION.SDK_INT
    }

    AsyncFunction("getStorageInfo") { promise: Promise ->
      try {
        val stat = StatFs(Environment.getDataDirectory().path)
        val total = stat.blockSizeLong * stat.blockCountLong
        val free = stat.blockSizeLong * stat.availableBlocksLong
        promise.resolve(mapOf(
          "totalBytes" to total,
          "freeBytes" to free
        ))
      } catch (e: Exception) {
        promise.reject("STORAGE_ERROR", e.message, e)
      }
    }
  }

  // Access Android context
  private val context get() = requireNotNull(appContext.reactContext)
}
```

## Accessing Android APIs

### Activity & Context

```kotlin
class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyModule")

    AsyncFunction("showToast") { message: String ->
      val activity = appContext.currentActivity
        ?: throw Exception("No current activity")

      activity.runOnUiThread {
        android.widget.Toast.makeText(
          activity, message, android.widget.Toast.LENGTH_SHORT
        ).show()
      }
    }

    // Access SharedPreferences
    Function("getPreference") { key: String ->
      val prefs = appContext.reactContext?.getSharedPreferences(
        "my_prefs", android.content.Context.MODE_PRIVATE
      )
      prefs?.getString(key, null)
    }
  }
}
```

### Permissions

```kotlin
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

AsyncFunction("checkCameraPermission") { ->
  val context = appContext.reactContext ?: return@AsyncFunction false
  ContextCompat.checkSelfPermission(
    context, Manifest.permission.CAMERA
  ) == PackageManager.PERMISSION_GRANTED
}
```

## JNI — Java/Kotlin ↔ C++ Bridge

### Loading Native Library

```kotlin
class NativeProcessor {
  companion object {
    init {
      System.loadLibrary("myprocessor")
    }
  }

  // Native method declarations
  external fun processData(input: ByteArray): ByteArray
  external fun getVersion(): String
}
```

### C++ JNI Implementation

```cpp
// android/src/main/cpp/myprocessor.cpp
#include <jni.h>
#include <string>

extern "C" {

JNIEXPORT jbyteArray JNICALL
Java_expo_modules_mymodule_NativeProcessor_processData(
    JNIEnv *env,
    jobject thiz,
    jbyteArray input) {

  // Get input bytes
  jsize len = env->GetArrayLength(input);
  jbyte *bytes = env->GetByteArrayElements(input, nullptr);

  // Process data (example: reverse bytes)
  std::vector<jbyte> result(bytes, bytes + len);
  std::reverse(result.begin(), result.end());

  env->ReleaseByteArrayElements(input, bytes, JNI_ABORT);

  // Create output array
  jbyteArray output = env->NewByteArray(len);
  env->SetByteArrayRegion(output, 0, len, result.data());
  return output;
}

JNIEXPORT jstring JNICALL
Java_expo_modules_mymodule_NativeProcessor_getVersion(
    JNIEnv *env,
    jobject thiz) {
  return env->NewStringUTF("1.0.0");
}

} // extern "C"
```

### CMakeLists.txt for JNI

```cmake
cmake_minimum_required(VERSION 3.13)
project(myprocessor)

set(CMAKE_CXX_STANDARD 17)

add_library(myprocessor SHARED
  src/main/cpp/myprocessor.cpp
)

target_include_directories(myprocessor PRIVATE
  src/main/cpp
)

find_library(log-lib log)
target_link_libraries(myprocessor ${log-lib})
```

### build.gradle Integration

```groovy
android {
  defaultConfig {
    externalNativeBuild {
      cmake {
        cppFlags "-std=c++17"
      }
    }
  }

  externalNativeBuild {
    cmake {
      path "CMakeLists.txt"
    }
  }
}
```

## Using JNI from Expo Module

```kotlin
class ProcessorModule : Module() {
  private val nativeProcessor = NativeProcessor()

  override fun definition() = ModuleDefinition {
    Name("ProcessorModule")

    AsyncFunction("processData") { input: ByteArray, promise: Promise ->
      try {
        val result = nativeProcessor.processData(input)
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("PROCESS_ERROR", e.message, e)
      }
    }
  }
}
```

## Coroutines Integration

```kotlin
import kotlinx.coroutines.*

class NetworkModule : Module() {
  private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

  override fun definition() = ModuleDefinition {
    Name("NetworkModule")

    AsyncFunction("fetchData") { url: String, promise: Promise ->
      scope.launch {
        try {
          val result = withContext(Dispatchers.IO) {
            java.net.URL(url).readText()
          }
          promise.resolve(result)
        } catch (e: Exception) {
          promise.reject("FETCH_ERROR", e.message, e)
        }
      }
    }

    OnDestroy {
      scope.cancel()
    }
  }
}
```

## Common Pitfalls

1. **JNI method naming** — Must match exact package path: `Java_package_Class_method`
2. **Thread safety** — JNI `JNIEnv*` is thread-local; don't share across threads
3. **Memory leaks** — Call `ReleaseXxxArrayElements` / `DeleteLocalRef` in JNI
4. **Missing `System.loadLibrary`** — Native lib won't load without explicit init
5. **ProGuard/R8 stripping** — Add keep rules for JNI methods and native calls
6. **Context null** — `appContext.reactContext` can be null during init

## Related Skills

- [expo-module-definition.md](expo-module-definition.md) — Expo Module patterns
- [gradle-cocoapods-config.md](gradle-cocoapods-config.md) — Gradle config
- [turbo-cpp-jsi.md](turbo-cpp-jsi.md) — C++ JSI bindings
