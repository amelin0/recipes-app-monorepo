---
title: Gradle & CocoaPods Configuration
impact: MEDIUM
tags: gradle, cocoapods, build-system, configuration
---

# Gradle & CocoaPods Configuration for Native Modules

## Quick Reference

| Platform | Build System | Config File |
|----------|-------------|-------------|
| iOS | CocoaPods | `.podspec` / `Podfile` |
| iOS (SPM) | Swift Package Manager | `Package.swift` |
| Android | Gradle (Groovy/Kotlin DSL) | `build.gradle` / `build.gradle.kts` |
| Both | Expo Config Plugin | `app.plugin.js` |

## iOS — CocoaPods

### Module Podspec

```ruby
# my-module.podspec
require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "MyModule"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.author       = package["author"]
  s.source       = { git: package["repository"]["url"], tag: s.version }

  s.platforms    = { ios: "15.1" }
  s.swift_version = "5.9"

  s.source_files = "ios/**/*.{swift,h,m,mm,cpp}"

  # Expo Modules dependency
  s.dependency "ExpoModulesCore"

  # Third-party SDK dependency
  s.dependency "SomeNativeSDK", "~> 3.0"

  # For C++ (JNI/JSI) support
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" " \
      "\"$(PODS_ROOT)/Headers/Private/React-Core\""
  }
end
```

### Expo Config Plugin (Auto-linking)

```javascript
// app.plugin.js
const { withDangerousMod, withPlugins } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withMyModulePodfile(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfile = fs.readFileSync(podfilePath, "utf8");

      // Add custom pod source
      if (!podfile.includes("source 'https://my-specs.git'")) {
        podfile = `source 'https://my-specs.git'\n${podfile}`;
        fs.writeFileSync(podfilePath, podfile);
      }
      return config;
    },
  ]);
}

module.exports = (config) => withPlugins(config, [withMyModulePodfile]);
```

## Android — Gradle

### Module build.gradle

```groovy
// android/build.gradle
buildscript {
  def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir, "ExpoModulesCorePlugin.gradle")
  if (expoModulesCorePlugin.exists()) {
    apply from: expoModulesCorePlugin
    applyKotlinExpoModulesCorePlugin()
  }
}

apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

android {
  namespace "expo.modules.mymodule"
  compileSdk 34

  defaultConfig {
    minSdk 24
    targetSdk 34
  }

  compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }

  // For C++/JNI
  externalNativeBuild {
    cmake {
      path "CMakeLists.txt"
    }
  }
}

dependencies {
  implementation project(':expo-modules-core')
  implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:${getKotlinVersion()}"

  // Third-party SDK
  implementation "com.example:native-sdk:3.0.0"
}
```

### Module build.gradle.kts (Kotlin DSL)

```kotlin
// android/build.gradle.kts
plugins {
  id("com.android.library")
  id("kotlin-android")
}

android {
  namespace = "expo.modules.mymodule"
  compileSdk = 34

  defaultConfig {
    minSdk = 24
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
}

dependencies {
  implementation(project(":expo-modules-core"))
  implementation("com.example:native-sdk:3.0.0")
}
```

### Adding Maven Repository

```groovy
// In module build.gradle or settings.gradle
repositories {
  google()
  mavenCentral()
  maven { url "https://maven.example.com/releases" }
}
```

## expo-module.config.json

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

## Expo Config Plugin for Build Settings

```javascript
// plugin/withMyModule.js
const {
  withAppBuildGradle,
  withPodfile,
  withInfoPlist,
  withAndroidManifest,
} = require("@expo/config-plugins");

function withMyModule(config, props = {}) {
  // Add Android permissions
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest["uses-permission"]) manifest["uses-permission"] = [];
    manifest["uses-permission"].push({
      $: { "android:name": "android.permission.CAMERA" },
    });
    return config;
  });

  // Add iOS permissions
  config = withInfoPlist(config, (config) => {
    config.modResults.NSCameraUsageDescription =
      props.cameraPermissionText || "This app needs camera access";
    return config;
  });

  return config;
}

module.exports = withMyModule;
```

Usage in `app.json`:
```json
{
  "plugins": [
    ["./modules/my-module/plugin/withMyModule", {
      "cameraPermissionText": "We need camera for scanning"
    }]
  ]
}
```

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Pod not found | Run `pod repo update` then `pod install` |
| Swift version mismatch | Set `s.swift_version` in podspec |
| Duplicate symbols | Check for conflicting pod versions |
| Gradle sync failed | Check `compileSdk` and `minSdk` compatibility |
| C++ build error | Verify CMakeLists.txt path and NDK version |
| Module not found at runtime | Check `expo-module.config.json` class names |

## Common Pitfalls

1. **Missing `pod install`** — Always run after changing podspec or dependencies
2. **Gradle cache** — Run `./gradlew clean` when dependency issues arise
3. **SDK version mismatch** — Ensure `minSdk`/`ios.deploymentTarget` match SDK requirements
4. **ProGuard rules** — Add keep rules for native methods and reflection
5. **Expo prebuild** — Run `npx expo prebuild --clean` after config plugin changes

## Related Skills

- [ios-swift-objc.md](ios-swift-objc.md) — iOS specifics
- [android-kotlin-jni.md](android-kotlin-jni.md) — Android specifics
- [wrapping-native-sdks.md](wrapping-native-sdks.md) — SDK integration
