// Custom Analytics Abstraction Layer
// Allows routing to multiple analytics platforms with a single interface

import analytics from '@react-native-firebase/analytics'
import * as Sentry from '@sentry/react-native'

/**
 * Unified analytics interface that abstracts multiple platforms
 * Benefits:
 * - Single point of implementation
 * - Easy to add/remove platforms
 * - Easier testing
 * - Platform-agnostic code
 */

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  severity?: 'info' | 'warning' | 'error'
  timestamp?: number
}

export interface AnalyticsProvider {
  logEvent(event: AnalyticsEvent): Promise<void>
  setUserId(userId: string): Promise<void>
  setUserProperty(name: string, value: string): Promise<void>
  trackError(error: Error, context?: Record<string, any>): Promise<void>
  trackPerformance(name: string, duration: number): Promise<void>
  addBreadcrumb(message: string, metadata?: Record<string, any>): void
  disable(): Promise<void>
  enable(): Promise<void>
}

/**
 * Firebase Analytics Provider
 */
class FirebaseProvider implements AnalyticsProvider {
  async logEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await analytics().logEvent(event.name, {
        ...event.properties,
        timestamp: event.timestamp || Date.now()
      })
    } catch (error) {
      console.error('Firebase analytics error:', error)
    }
  }

  async setUserId(userId: string): Promise<void> {
    try {
      await analytics().setUserId(userId)
    } catch (error) {
      console.error('Firebase set user ID error:', error)
    }
  }

  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await analytics().setUserProperty(name, value)
    } catch (error) {
      console.error('Firebase set user property error:', error)
    }
  }

  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    try {
      await analytics().logEvent('app_error', {
        error_message: error.message,
        error_stack: error.stack,
        ...context
      })
    } catch (err) {
      console.error('Firebase track error:', err)
    }
  }

  async trackPerformance(name: string, duration: number): Promise<void> {
    try {
      await analytics().logEvent('performance_metric', {
        metric_name: name,
        duration_ms: duration
      })
    } catch (error) {
      console.error('Firebase track performance error:', error)
    }
  }

  addBreadcrumb(message: string, metadata?: Record<string, any>): void {
    // Firebase doesn't have breadcrumbs, but we can log event
    this.logEvent({
      name: 'breadcrumb',
      properties: {
        message,
        ...metadata
      },
      severity: 'info'
    }).catch(console.error)
  }

  async disable(): Promise<void> {
    await analytics().setAnalyticsCollectionEnabled(false)
  }

  async enable(): Promise<void> {
    await analytics().setAnalyticsCollectionEnabled(true)
  }
}

/**
 * Sentry Provider
 */
class SentryProvider implements AnalyticsProvider {
  async logEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const level = event.severity === 'error' ? 'error' : event.severity === 'warning' ? 'warning' : 'info'
      
      Sentry.captureMessage(event.name, level, {
        tags: { event_name: event.name },
        extra: event.properties
      })
    } catch (error) {
      console.error('Sentry analytics error:', error)
    }
  }

  async setUserId(userId: string): Promise<void> {
    try {
      Sentry.setUser({ id: userId })
    } catch (error) {
      console.error('Sentry set user ID error:', error)
    }
  }

  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      Sentry.setContext(name, { value })
    } catch (error) {
      console.error('Sentry set user property error:', error)
    }
  }

  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    try {
      Sentry.captureException(error, {
        extra: context
      })
    } catch (err) {
      console.error('Sentry track error:', err)
    }
  }

  async trackPerformance(name: string, duration: number): Promise<void> {
    try {
      Sentry.captureMessage(`Performance: ${name} took ${duration}ms`, 'info', {
        extra: { duration_ms: duration }
      })
    } catch (error) {
      console.error('Sentry track performance error:', error)
    }
  }

  addBreadcrumb(message: string, metadata?: Record<string, any>): void {
    try {
      Sentry.addBreadcrumb({
        category: 'custom',
        message,
        level: 'info',
        data: metadata
      })
    } catch (error) {
      console.error('Sentry add breadcrumb error:', error)
    }
  }

  async disable(): Promise<void> {
    // Sentry doesn't have a disable method, but we can close it
    // Sentry.close()
  }

  async enable(): Promise<void> {
    // Re-initialize if needed
  }
}

/**
 * Unified Analytics Manager
 */
export class AnalyticsManager {
  private providers: Map<string, AnalyticsProvider> = new Map()
  private enabled: boolean = true

  constructor() {
    this.setupProviders()
  }

  private setupProviders(): void {
    // Add Firebase
    this.providers.set('firebase', new FirebaseProvider())

    // Add Sentry
    this.providers.set('sentry', new SentryProvider())

    // Add more providers as needed
  }

  /**
   * Log event to all providers
   */
  async logEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.enabled) return

    const promises = Array.from(this.providers.values()).map(provider =>
      provider.logEvent(event).catch(error =>
        console.error('Provider error logging event:', error)
      )
    )

    await Promise.all(promises)
  }

  /**
   * Convenience method for common events
   */
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    await this.logEvent({
      name: 'screen_view',
      properties: {
        screen_name: screenName,
        screen_class: screenClass
      }
    })
  }

  async trackButtonPress(buttonName: string, screenName?: string): Promise<void> {
    await this.logEvent({
      name: 'button_press',
      properties: {
        button_name: buttonName,
        screen_name: screenName
      }
    })
  }

  async trackPurchase(
    transactionId: string,
    value: number,
    currency: string,
    items?: Array<{ id: string; name: string; price: number }>
  ): Promise<void> {
    await this.logEvent({
      name: 'purchase',
      properties: {
        transaction_id: transactionId,
        value,
        currency,
        items
      }
    })
  }

  async trackSignup(method: 'email' | 'google' | 'apple' | 'other'): Promise<void> {
    await this.logEvent({
      name: 'signup',
      properties: { method }
    })
  }

  async trackLogin(method: 'email' | 'google' | 'apple' | 'biometric' | 'other'): Promise<void> {
    await this.logEvent({
      name: 'login',
      properties: { method }
    })
  }

  /**
   * Set user ID across all providers
   */
  async setUserId(userId: string): Promise<void> {
    const promises = Array.from(this.providers.values()).map(provider =>
      provider.setUserId(userId).catch(error =>
        console.error('Provider error setting user ID:', error)
      )
    )

    await Promise.all(promises)
  }

  /**
   * Set user property across all providers
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    const promises = Array.from(this.providers.values()).map(provider =>
      provider.setUserProperty(name, value).catch(error =>
        console.error('Provider error setting user property:', error)
      )
    )

    await Promise.all(promises)
  }

  /**
   * Track error across all providers
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    const promises = Array.from(this.providers.values()).map(provider =>
      provider.trackError(error, context).catch(err =>
        console.error('Provider error tracking error:', err)
      )
    )

    await Promise.all(promises)
  }

  /**
   * Track performance metric
   */
  async trackPerformance(name: string, duration: number): Promise<void> {
    const promises = Array.from(this.providers.values()).map(provider =>
      provider.trackPerformance(name, duration).catch(error =>
        console.error('Provider error tracking performance:', error)
      )
    )

    await Promise.all(promises)
  }

  /**
   * Add breadcrumb to all providers
   */
  addBreadcrumb(message: string, metadata?: Record<string, any>): void {
    Array.from(this.providers.values()).forEach(provider => {
      try {
        provider.addBreadcrumb(message, metadata)
      } catch (error) {
        console.error('Provider error adding breadcrumb:', error)
      }
    })
  }

  /**
   * Measure function execution time
   */
  async measureFunction<T>(
    functionName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()

    try {
      const result = await fn()
      const duration = performance.now() - startTime
      await this.trackPerformance(functionName, duration)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      await this.trackPerformance(`${functionName}_error`, duration)
      if (error instanceof Error) {
        await this.trackError(error, { function: functionName })
      }
      throw error
    }
  }

  /**
   * Enable/disable analytics (e.g., for GDPR)
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled

    if (enabled) {
      const promises = Array.from(this.providers.values()).map(provider =>
        provider.enable().catch(error =>
          console.error('Provider error enabling:', error)
        )
      )
      await Promise.all(promises)
    } else {
      const promises = Array.from(this.providers.values()).map(provider =>
        provider.disable().catch(error =>
          console.error('Provider error disabling:', error)
        )
      )
      await Promise.all(promises)
    }
  }

  /**
   * Reset user data (logout)
   */
  async resetUser(): Promise<void> {
    // Sentry
    Sentry.setUser(null)

    // Firebase
    await analytics().resetAnalyticsData()
  }
}

// Export singleton instance
export const analyticsManager = new AnalyticsManager()

/**
 * Usage Examples
 */

// Track screen view
export async function handleScreenFocus(screenName: string) {
  await analyticsManager.trackScreenView(screenName)
}

// Track button press
export function handleButtonPress(buttonName: string) {
  analyticsManager.trackButtonPress(buttonName)
}

// Track error with context
export async function handleError(error: Error, context: Record<string, any>) {
  await analyticsManager.trackError(error, context)
}

// Set user after login
export async function handleLogin(userId: string, email: string) {
  await analyticsManager.setUserId(userId)
  await analyticsManager.setUserProperty('email', email)
  await analyticsManager.trackLogin('email')
}

// Measure async operation
export async function fetchUserData(userId: string) {
  return analyticsManager.measureFunction(
    'fetch_user_data',
    () => fetch(`/api/users/${userId}`).then(r => r.json())
  )
}

// Handle GDPR consent
export async function handleGDPRConsent(hasConsent: boolean) {
  await analyticsManager.setEnabled(hasConsent)
}

// Log out user
export async function handleLogout() {
  await analyticsManager.resetUser()
}
