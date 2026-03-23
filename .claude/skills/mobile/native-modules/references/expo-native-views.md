---
title: Native Views via Expo Modules API
impact: HIGH
tags: expo-modules, native-views, ui-components, swift, kotlin
---

# Native Views via Expo Modules API

## Quick Pattern

**Incorrect — wrapping native view via old RCTViewManager:**
```objc
@interface RCT_EXTERN_MODULE(MyViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(source, NSString)
@end
```

**Correct — Expo Modules View DSL:**
```swift
View(MyNativeView.self) {
  Prop("source") { (view, source: String) in
    view.loadSource(source)
  }
}
```

## When to Use

- Embedding platform-native UI (maps, charts, video players, camera previews)
- Wrapping third-party native UI SDKs
- Performance-critical UI that can't be built with React Native views
- Platform-specific UI patterns (iOS UIKit / Android View)

## Step-by-Step

### 1. iOS Native View (Swift)

```swift
// ios/MyVideoView.swift
import ExpoModulesCore
import AVKit

class MyVideoView: ExpoView {
  private let playerController = AVPlayerViewController()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    addSubview(playerController.view)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    playerController.view.frame = bounds
  }

  func loadSource(_ url: String) {
    guard let videoURL = URL(string: url) else { return }
    playerController.player = AVPlayer(url: videoURL)
  }

  func setResizeMode(_ mode: String) {
    playerController.videoGravity = mode == "cover"
      ? .resizeAspectFill
      : .resizeAspect
  }
}
```

### 2. iOS Module Definition

```swift
// ios/MyVideoModule.swift
import ExpoModulesCore

public class MyVideoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MyVideoModule")

    View(MyVideoView.self) {
      // Props
      Prop("source") { (view, source: String) in
        view.loadSource(source)
      }

      Prop("resizeMode") { (view, mode: String) in
        view.setResizeMode(mode)
      }

      // Events dispatched from native to JS
      Events("onLoad", "onError", "onEnd")
    }
  }
}
```

### 3. Android Native View (Kotlin)

```kotlin
// android/src/main/java/expo/modules/myvideo/MyVideoView.kt
package expo.modules.myvideo

import android.content.Context
import android.widget.VideoView
import android.net.Uri
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class MyVideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val videoView = VideoView(context)

  init {
    addView(videoView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  fun loadSource(url: String) {
    videoView.setVideoURI(Uri.parse(url))
    videoView.start()
  }
}
```

### 4. Android Module Definition

```kotlin
// android/src/main/java/expo/modules/myvideo/MyVideoModule.kt
package expo.modules.myvideo

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MyVideoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyVideoModule")

    View(MyVideoView::class) {
      Prop("source") { view: MyVideoView, source: String ->
        view.loadSource(source)
      }

      Events("onLoad", "onError", "onEnd")
    }
  }
}
```

### 5. TypeScript Component

```typescript
// src/MyVideoView.tsx
import { requireNativeView } from 'expo-modules-core';
import { ViewProps, StyleSheet } from 'react-native';

interface MyVideoViewProps extends ViewProps {
  source: string;
  resizeMode?: 'cover' | 'contain';
  onLoad?: (event: { width: number; height: number }) => void;
  onError?: (event: { message: string }) => void;
  onEnd?: () => void;
}

const NativeVideoView = requireNativeView<MyVideoViewProps>('MyVideoModule');

export function MyVideoView({ source, resizeMode = 'contain', style, ...props }: MyVideoViewProps) {
  return (
    <NativeVideoView
      source={source}
      resizeMode={resizeMode}
      style={[styles.default, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  default: { width: '100%', aspectRatio: 16 / 9 },
});
```

## Dispatching Events from Native Views

### iOS

```swift
class MyVideoView: ExpoView {
  let onLoad = EventDispatcher()
  let onError = EventDispatcher()

  func videoDidLoad(width: Int, height: Int) {
    onLoad(["width": width, "height": height])
  }

  func videoDidFail(message: String) {
    onError(["message": message])
  }
}
```

### Android

```kotlin
class MyVideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onLoad by EventDispatcher()
  private val onError by EventDispatcher()

  fun videoDidLoad(width: Int, height: Int) {
    onLoad(mapOf("width" to width, "height" to height))
  }
}
```

## View DSL Reference

| DSL Component | Purpose |
|---------------|---------|
| `View(NativeView.self)` | Register a native view |
| `Prop("name")` | Bind a prop to native setter |
| `Events("onX")` | Declare view events |
| `GroupView()` | Container view for children |

## Common Pitfalls

1. **Missing `ExpoView` base class** — Must extend `ExpoView`, not `UIView`/`View` directly
2. **Layout issues** — Override `layoutSubviews()` (iOS) for proper frame updates
3. **Event naming** — Event prop names must start with `on` (e.g., `onLoad`, `onError`)
4. **Memory leaks** — Clean up native resources when view is removed
5. **Thread safety** — UI updates must happen on main thread

## Related Skills

- [expo-module-definition.md](expo-module-definition.md) — Module definition basics
- [native-ui-components.md](native-ui-components.md) — Fabric components (Turbo)
