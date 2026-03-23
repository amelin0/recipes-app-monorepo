---
title: Wrapping Native SDKs
impact: HIGH
tags: sdk-wrapping, third-party, integration, expo-modules
---

# Wrapping Third-Party Native SDKs

## Quick Reference

| Step | Action |
|------|--------|
| 1 | Evaluate: does an RN wrapper already exist? |
| 2 | Create module scaffold (`create-expo-module --local`) |
| 3 | Add SDK dependency (CocoaPods / Gradle) |
| 4 | Write native wrapper (Swift / Kotlin) |
| 5 | Define TypeScript interface |
| 6 | Create Expo config plugin for permissions/settings |
| 7 | Test on both platforms |

## When to Use

- Integrating a proprietary analytics/payments/auth SDK
- Using platform-specific SDKs (HealthKit, Google ML Kit, ARKit)
- No existing React Native wrapper exists or is unmaintained
- Need full control over SDK initialization and lifecycle

## Step-by-Step: Wrapping a Payment SDK

### 1. Create Local Module

```bash
npx create-expo-module@latest --local modules/payments
```

### 2. Add SDK Dependencies

**iOS (podspec):**
```ruby
# modules/payments/ios/Payments.podspec
s.dependency "StripePayments", "~> 23.0"
```

**Android (build.gradle):**
```groovy
dependencies {
  implementation "com.stripe:stripe-android:20.0.0"
}
```

### 3. iOS Wrapper (Swift)

```swift
import ExpoModulesCore
import StripePayments

public class PaymentsModule: Module {
  private var stripe: STPAPIClient?

  public func definition() -> ModuleDefinition {
    Name("Payments")

    Events("onPaymentResult", "onError")

    // Initialize SDK with publishable key
    Function("initialize") { (publishableKey: String) in
      STPAPIClient.shared.publishableKey = publishableKey
      self.stripe = STPAPIClient.shared
    }

    // Create payment intent
    AsyncFunction("createPaymentMethod") {
      (cardNumber: String, expMonth: Int, expYear: Int, cvc: String,
       promise: Promise) in

      let params = STPCardParams()
      params.number = cardNumber
      params.expMonth = UInt(expMonth)
      params.expYear = UInt(expYear)
      params.cvc = cvc

      STPAPIClient.shared.createToken(withCard: params) { token, error in
        if let error = error {
          promise.reject("PAYMENT_ERROR", error.localizedDescription)
        } else if let token = token {
          promise.resolve([
            "tokenId": token.tokenId,
            "last4": token.card?.last4 ?? ""
          ])
        }
      }
    }

    // Cleanup
    OnDestroy {
      self.stripe = nil
    }
  }
}
```

### 4. Android Wrapper (Kotlin)

```kotlin
package expo.modules.payments

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.stripe.android.Stripe
import com.stripe.android.model.CardParams
import com.stripe.android.model.Token

class PaymentsModule : Module() {
  private var stripe: Stripe? = null

  override fun definition() = ModuleDefinition {
    Name("Payments")

    Events("onPaymentResult", "onError")

    Function("initialize") { publishableKey: String ->
      val context = appContext.reactContext ?: return@Function
      stripe = Stripe(context, publishableKey)
    }

    AsyncFunction("createPaymentMethod") {
        cardNumber: String, expMonth: Int, expYear: Int, cvc: String,
        promise: Promise ->

      val stripe = this@PaymentsModule.stripe
        ?: return@AsyncFunction promise.reject(
          "NOT_INITIALIZED", "Call initialize() first", null
        )

      val card = CardParams(cardNumber, expMonth, expYear, cvc)

      stripe.createCardToken(card, callback = object : ApiResultCallback<Token> {
        override fun onSuccess(result: Token) {
          promise.resolve(mapOf(
            "tokenId" to result.id,
            "last4" to (result.card?.last4 ?: "")
          ))
        }

        override fun onError(e: Exception) {
          promise.reject("PAYMENT_ERROR", e.message, e)
        }
      })
    }

    OnDestroy {
      stripe = null
    }
  }
}
```

### 5. TypeScript Interface

```typescript
// modules/payments/src/index.ts
import { requireNativeModule, EventEmitter } from 'expo-modules-core';

interface PaymentsModuleType {
  initialize(publishableKey: string): void;
  createPaymentMethod(
    cardNumber: string,
    expMonth: number,
    expYear: number,
    cvc: string
  ): Promise<{ tokenId: string; last4: string }>;
}

const PaymentsModule = requireNativeModule<PaymentsModuleType>('Payments');
const emitter = new EventEmitter(PaymentsModule);

export function initialize(publishableKey: string) {
  PaymentsModule.initialize(publishableKey);
}

export function createPaymentMethod(card: {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}) {
  return PaymentsModule.createPaymentMethod(
    card.number, card.expMonth, card.expYear, card.cvc
  );
}

export function onPaymentResult(listener: (event: { status: string }) => void) {
  return emitter.addListener('onPaymentResult', listener);
}
```

### 6. Config Plugin for Permissions

```javascript
// modules/payments/plugin/withPayments.js
const { withInfoPlist, withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withPayments(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    manifest["uses-permission"].push({
      $: { "android:name": "android.permission.INTERNET" },
    });
    return config;
  });

  return config;
};
```

## SDK Wrapper Checklist

- [ ] Module scaffold created
- [ ] SDK dependency added to podspec and build.gradle
- [ ] Native wrapper initializes SDK properly
- [ ] All needed SDK methods exposed
- [ ] Events wired for callbacks/delegates
- [ ] TypeScript types match native signatures
- [ ] Config plugin handles permissions
- [ ] Error handling covers all SDK error paths
- [ ] Cleanup in `OnDestroy`
- [ ] Tested on iOS simulator and Android emulator
- [ ] Tested on physical devices

## Common Pitfalls

1. **Missing SDK initialization** — Many SDKs require `initialize()` before use; enforce order
2. **Delegate/callback patterns** — SDKs use delegates (iOS) or listeners (Android); map to Events
3. **Main thread requirements** — Some SDK methods must run on main thread
4. **Version conflicts** — SDK may conflict with other dependencies; check compatibility
5. **Binary size** — Large SDKs increase app size; consider dynamic frameworks
6. **ProGuard rules** — Android SDKs often need ProGuard keep rules

## Related Skills

- [expo-module-definition.md](expo-module-definition.md) — Module definition
- [gradle-cocoapods-config.md](gradle-cocoapods-config.md) — Build config
- [ios-swift-objc.md](ios-swift-objc.md) — iOS bridging
- [android-kotlin-jni.md](android-kotlin-jni.md) — Android patterns
