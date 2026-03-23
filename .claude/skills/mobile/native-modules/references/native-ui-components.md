---
title: Native UI Components (Fabric)
impact: HIGH
tags: native-ui, fabric, view-manager, custom-views
---

# Custom Native UI Components

## Quick Reference

| Approach | API | Architecture |
|----------|-----|-------------|
| Expo Modules View | `View()` DSL | Both (recommended) |
| Fabric Component | Codegen + ShadowNode | New Architecture |
| Legacy ViewManager | `RCTViewManager` / `SimpleViewManager` | Old Architecture |

## When to Use

- Embedding platform UI not available in React Native (maps, charts, AR views)
- Wrapping native SDK views (video players, ad banners, signature pads)
- Performance-critical rendering (real-time graphics, canvas)
- Platform-specific UI patterns (iOS share sheets, Android bottom sheets)

## Fabric Component (New Architecture)

### 1. TypeScript Spec

```typescript
// src/NativeMyChartView.ts
import type { ViewProps, HostComponent } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeMyChartViewProps extends ViewProps {
  data: ReadonlyArray<{ x: number; y: number }>;
  lineColor?: string;
  lineWidth?: number;
  showGrid?: boolean;
  onPointSelected?: (event: { index: number; x: number; y: number }) => void;
}

export default codegenNativeComponent<NativeMyChartViewProps>(
  'MyChartView'
) as HostComponent<NativeMyChartViewProps>;
```

### 2. iOS Implementation (Swift/ObjC++)

```swift
// ios/MyChartView.swift
import UIKit

class MyChartView: UIView {
  var data: [[String: Double]] = [] {
    didSet { setNeedsDisplay() }
  }
  var lineColor: UIColor = .blue
  var lineWidth: CGFloat = 2.0
  var showGrid: Bool = true
  var onPointSelected: (([String: Any]) -> Void)?

  override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext() else { return }

    if showGrid { drawGrid(context: context, rect: rect) }
    drawLine(context: context, rect: rect)
  }

  private func drawLine(context: CGContext, rect: CGRect) {
    guard !data.isEmpty else { return }

    context.setStrokeColor(lineColor.cgColor)
    context.setLineWidth(lineWidth)

    let maxX = data.map { $0["x"] ?? 0 }.max() ?? 1
    let maxY = data.map { $0["y"] ?? 0 }.max() ?? 1

    let path = UIBezierPath()
    for (i, point) in data.enumerated() {
      let x = CGFloat(point["x"] ?? 0) / CGFloat(maxX) * rect.width
      let y = rect.height - (CGFloat(point["y"] ?? 0) / CGFloat(maxY) * rect.height)

      if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
      else { path.addLine(to: CGPoint(x: x, y: y)) }
    }
    path.stroke()
  }

  private func drawGrid(context: CGContext, rect: CGRect) {
    context.setStrokeColor(UIColor.systemGray5.cgColor)
    context.setLineWidth(0.5)
    for i in 0...4 {
      let y = rect.height * CGFloat(i) / 4
      context.move(to: CGPoint(x: 0, y: y))
      context.addLine(to: CGPoint(x: rect.width, y: y))
    }
    context.strokePath()
  }

  // Touch handling
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let touch = touches.first else { return }
    let location = touch.location(in: self)
    if let index = findNearestPoint(to: location) {
      onPointSelected?([
        "index": index,
        "x": data[index]["x"] ?? 0,
        "y": data[index]["y"] ?? 0
      ])
    }
  }

  private func findNearestPoint(to location: CGPoint) -> Int? {
    // Find nearest data point to touch location
    return data.indices.min(by: { i, j in
      abs(CGFloat(data[i]["x"] ?? 0) - location.x) <
      abs(CGFloat(data[j]["x"] ?? 0) - location.x)
    })
  }
}
```

**View Manager (ObjC++):**
```objc
// ios/MyChartViewManager.mm
#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "MyModule-Swift.h"

@interface MyChartViewManager : RCTViewManager
@end

@implementation MyChartViewManager

RCT_EXPORT_MODULE(MyChartView)

- (UIView *)view {
  return [[MyChartView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(data, NSArray)
RCT_EXPORT_VIEW_PROPERTY(lineColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(lineWidth, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(showGrid, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onPointSelected, RCTDirectEventBlock)

@end
```

### 3. Android Implementation (Kotlin)

```kotlin
// android/src/main/java/com/mychart/MyChartView.kt
package com.mychart

import android.content.Context
import android.graphics.*
import android.view.MotionEvent
import android.view.View

class MyChartView(context: Context) : View(context) {
  var data: List<Map<String, Double>> = emptyList()
    set(value) { field = value; invalidate() }

  var lineColor: Int = Color.BLUE
  var lineWidth: Float = 4f
  var showGrid: Boolean = true
  var onPointSelected: ((Map<String, Any>) -> Unit)? = null

  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val path = Path()

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    if (showGrid) drawGrid(canvas)
    drawLine(canvas)
  }

  private fun drawLine(canvas: Canvas) {
    if (data.isEmpty()) return

    paint.color = lineColor
    paint.strokeWidth = lineWidth
    paint.style = Paint.Style.STROKE

    val maxX = data.maxOf { it["x"] ?: 0.0 }
    val maxY = data.maxOf { it["y"] ?: 0.0 }

    path.reset()
    data.forEachIndexed { i, point ->
      val x = ((point["x"] ?: 0.0) / maxX * width).toFloat()
      val y = (height - (point["y"] ?: 0.0) / maxY * height).toFloat()

      if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    canvas.drawPath(path, paint)
  }

  private fun drawGrid(canvas: Canvas) {
    paint.color = Color.LTGRAY
    paint.strokeWidth = 1f
    for (i in 0..4) {
      val y = height * i / 4f
      canvas.drawLine(0f, y, width.toFloat(), y, paint)
    }
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (event.action == MotionEvent.ACTION_DOWN) {
      findNearestPoint(event.x)?.let { index ->
        onPointSelected?.invoke(mapOf(
          "index" to index,
          "x" to (data[index]["x"] ?: 0.0),
          "y" to (data[index]["y"] ?: 0.0)
        ))
      }
    }
    return true
  }

  private fun findNearestPoint(touchX: Float): Int? {
    val maxX = data.maxOfOrNull { it["x"] ?: 0.0 } ?: return null
    return data.indices.minByOrNull { i ->
      kotlin.math.abs(((data[i]["x"] ?: 0.0) / maxX * width).toFloat() - touchX)
    }
  }
}
```

### 4. TypeScript Wrapper Component

```tsx
// src/MyChartView.tsx
import NativeMyChartView from './NativeMyChartView';
import type { NativeMyChartViewProps } from './NativeMyChartView';
import { StyleSheet } from 'react-native';

interface ChartProps extends Omit<NativeMyChartViewProps, 'data'> {
  data: Array<{ x: number; y: number }>;
}

export function ChartView({ data, style, ...props }: ChartProps) {
  return (
    <NativeMyChartView
      data={data}
      style={[styles.default, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    width: '100%',
    height: 200,
  },
});
```

## Native Commands (Imperative Methods)

For methods like `scrollTo()` or `focus()` that don't fit the declarative prop model:

```typescript
// TypeScript
import { UIManager, findNodeHandle } from 'react-native';

export function scrollToIndex(ref: React.RefObject<any>, index: number) {
  const handle = findNodeHandle(ref.current);
  if (handle) {
    UIManager.dispatchViewManagerCommand(handle, 'scrollToIndex', [index]);
  }
}
```

## Common Pitfalls

1. **Missing `setNeedsDisplay()` / `invalidate()`** — View won't redraw after prop changes
2. **Layout issues** — Override `layoutSubviews` (iOS) / `onMeasure` (Android)
3. **Event naming** — Events must start with `on` prefix for Codegen
4. **Memory leaks** — Remove observers and delegates when view is detached
5. **Thread safety** — Native view updates must happen on the main/UI thread

## Related Skills

- [expo-native-views.md](expo-native-views.md) — Simpler Expo approach
- [expo-module-events-callbacks.md](expo-module-events-callbacks.md) — Event patterns
