---
title: Camera & Sensor Access
impact: MEDIUM
tags: camera, sensors, accelerometer, gyroscope, location, permissions
---

# Camera & Sensor Access Patterns

## Quick Reference

| Sensor | iOS API | Android API | Expo Package |
|--------|---------|-------------|-------------|
| Camera | AVCaptureSession | CameraX | expo-camera |
| Location | CLLocationManager | LocationManager | expo-location |
| Accelerometer | CMMotionManager | SensorManager | expo-sensors |
| Gyroscope | CMMotionManager | SensorManager | expo-sensors |
| Barometer | CMAltimeter | SensorManager | expo-sensors |
| Pedometer | CMPedometer | SensorManager | expo-sensors |

**Prefer Expo packages when available.** Build custom modules only when:
- You need access not provided by Expo packages
- You need custom processing pipelines (e.g., real-time frame processing)
- You're wrapping a specialized sensor SDK

## Custom Camera Module Example

### iOS (Swift) — Frame Processing

```swift
import ExpoModulesCore
import AVFoundation

public class CameraProcessorModule: Module {
  private var captureSession: AVCaptureSession?
  private var output: AVCaptureVideoDataOutput?

  public func definition() -> ModuleDefinition {
    Name("CameraProcessor")

    Events("onFrame", "onBarcode")

    AsyncFunction("startCapture") { (promise: Promise) in
      DispatchQueue.main.async {
        self.setupCamera(promise: promise)
      }
    }

    Function("stopCapture") {
      self.captureSession?.stopRunning()
    }

    OnDestroy {
      self.captureSession?.stopRunning()
      self.captureSession = nil
    }
  }

  private func setupCamera(promise: Promise) {
    let session = AVCaptureSession()
    session.sessionPreset = .medium

    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera,
                                                for: .video,
                                                position: .back),
          let input = try? AVCaptureDeviceInput(device: device) else {
      promise.reject("CAMERA_ERROR", "Camera not available")
      return
    }

    session.addInput(input)

    let output = AVCaptureVideoDataOutput()
    output.setSampleBufferDelegate(self, queue: DispatchQueue(label: "camera"))
    session.addOutput(output)

    self.captureSession = session
    self.output = output

    session.startRunning()
    promise.resolve(nil)
  }
}

extension CameraProcessorModule: AVCaptureVideoDataOutputSampleBufferDelegate {
  public func captureOutput(_ output: AVCaptureOutput,
                            didOutput sampleBuffer: CMSampleBuffer,
                            from connection: AVCaptureConnection) {
    // Process frame (e.g., ML inference)
    sendEvent("onFrame", [
      "timestamp": CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds,
      "width": 1920,
      "height": 1080
    ])
  }
}
```

### Android (Kotlin) — Sensor Access

```kotlin
package expo.modules.sensors

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AccelerometerModule : Module(), SensorEventListener {
  private var sensorManager: SensorManager? = null
  private var accelerometer: Sensor? = null
  private var isObserving = false

  override fun definition() = ModuleDefinition {
    Name("Accelerometer")

    Events("onUpdate")

    Function("isAvailable") {
      val manager = getSensorManager()
      manager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null
    }

    OnStartObserving {
      startListening()
    }

    OnStopObserving {
      stopListening()
    }

    OnDestroy {
      stopListening()
    }
  }

  private fun getSensorManager(): SensorManager? {
    if (sensorManager == null) {
      sensorManager = appContext.reactContext?.getSystemService(
        Context.SENSOR_SERVICE
      ) as? SensorManager
    }
    return sensorManager
  }

  private fun startListening() {
    val manager = getSensorManager() ?: return
    accelerometer = manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    accelerometer?.let {
      manager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
      isObserving = true
    }
  }

  private fun stopListening() {
    if (isObserving) {
      sensorManager?.unregisterListener(this)
      isObserving = false
    }
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
      sendEvent("onUpdate", mapOf(
        "x" to event.values[0].toDouble(),
        "y" to event.values[1].toDouble(),
        "z" to event.values[2].toDouble(),
        "timestamp" to (event.timestamp / 1_000_000L) // ns to ms
      ))
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
```

### TypeScript Hook

```typescript
import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import { useEffect, useState } from 'react';

const Accelerometer = requireNativeModule('Accelerometer');
const emitter = new EventEmitter(Accelerometer);

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export function useAccelerometer() {
  const [data, setData] = useState<AccelerometerData>({ x: 0, y: 0, z: 0, timestamp: 0 });

  useEffect(() => {
    const sub = emitter.addListener('onUpdate', setData);
    return () => sub.remove();
  }, []);

  return data;
}

export function isAvailable(): boolean {
  return Accelerometer.isAvailable();
}
```

## Permissions Handling

```javascript
// plugin/withSensorPermissions.js
const { withInfoPlist, withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withSensorPermissions(config) {
  // iOS
  config = withInfoPlist(config, (config) => {
    config.modResults.NSCameraUsageDescription =
      "Camera is used for barcode scanning";
    config.modResults.NSMotionUsageDescription =
      "Motion data is used for fitness tracking";
    return config;
  });

  // Android
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    manifest["uses-permission"].push(
      { $: { "android:name": "android.permission.CAMERA" } },
      { $: { "android:name": "android.permission.HIGH_SAMPLING_RATE_SENSORS" } }
    );
    manifest["uses-feature"] = manifest["uses-feature"] || [];
    manifest["uses-feature"].push(
      { $: { "android:name": "android.hardware.camera", "android:required": "false" } }
    );
    return config;
  });

  return config;
};
```

## Common Pitfalls

1. **Missing permissions** — Camera/location need runtime permission requests
2. **Battery drain** — Unregister sensor listeners when not observing
3. **Background access** — Sensors may not work in background without proper config
4. **Simulator limitations** — Camera and some sensors don't work in simulators
5. **Thread safety** — Sensor callbacks come on sensor thread; marshal to main if updating UI

## Related Skills

- [expo-module-events-callbacks.md](expo-module-events-callbacks.md) — Event patterns
- [background-tasks.md](background-tasks.md) — Background sensor access
