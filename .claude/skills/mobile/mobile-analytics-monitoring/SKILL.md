---
name: Mobile Analytics & Monitoring
description: Master event tracking, crash reporting, performance monitoring, and user analytics for iOS, Android, and React Native with GDPR compliance
tags: [mobile, analytics, monitoring, crash-reporting, performance, tracking, GDPR, Firebase, Sentry]
version: 1.0
---

# Mobile Analytics & Monitoring

## When Claude Should Use This Skill

- Implementing event tracking and analytics
- Setting up crash reporting and error tracking
- Monitoring app performance and stability
- Tracking user behavior and engagement
- Implementing GDPR-compliant analytics
- Measuring app startup time and responsiveness
- Building custom dashboards
- A/B testing implementation
- Memory and CPU monitoring
- Network performance tracking

---

## Analytics Architecture

```
┌──────────────────────────────────────────────────────┐
│           User Actions & Events                      │
│  (Screen views, button taps, form submissions)       │
├──────────────────────────────────────────────────────┤
│           Analytics Layer                             │
│  (Aggregation, batching, filtering)                  │
├──────────────────────────────────────────────────────┤
│           Data Collection                             │
│  (Queue, local storage, de-duplication)              │
├──────────────────────────────────────────────────────┤
│           Transport Layer                             │
│  (HTTPS, batching, retry logic)                      │
├──────────────────────────────────────────────────────┤
│           Backend Services                            │
│  (Firebase, Sentry, Mixpanel, Segment)               │
├──────────────────────────────────────────────────────┤
│           Analytics Dashboard                         │
│  (Visualizations, reports, alerts)                   │
└──────────────────────────────────────────────────────┘
```

---

## Core Analytics Components

### 1. Event Tracking

**Categories**:
- Screen Views (page/screen visited)
- User Actions (button tap, form submitted)
- Conversions (purchase, sign-up, subscription)
- Custom Events (domain-specific)

**Properties**:
- Event name
- Event timestamp
- User ID (anonymized)
- Session ID
- Device info (OS, version, model)
- App version
- Custom properties (product ID, amount, etc.)

### 2. Crash Reporting

**What to Track**:
- Unhandled exceptions
- Stack traces
- Crash breadcrumbs (preceding actions)
- Device state at crash
- OS version and app version
- User session info

**Severity Levels**:
- Critical (app crash)
- Error (handled exception)
- Warning (potential issue)
- Info (diagnostic)

### 3. Performance Monitoring

**Key Metrics**:
- App startup time
- Screen load time
- API response time
- Memory usage
- CPU usage
- Battery drain
- Network latency
- Frame rate (FPS)

### 4. User Engagement

**Metrics**:
- Daily/Monthly Active Users (DAU/MAU)
- Session duration
- Session frequency
- Feature adoption
- Retention rates
- Churn rate

---

## Popular Analytics Platforms

### Firebase Analytics

**Best For**: General analytics, free tier, integration with other Firebase services

**Features**:
- ✅ Built-in event tracking
- ✅ Automatic screen tracking
- ✅ User properties
- ✅ Audience segmentation
- ✅ Real-time reports
- ✅ Firebase Crashlytics integration
- ✅ A/B testing

**Pricing**: Free (up to 500 events/day), Premium ($1-5K/month)

### Sentry

**Best For**: Crash reporting and error tracking

**Features**:
- ✅ Crash reporting
- ✅ Error tracking
- ✅ Stack trace symbolication
- ✅ Breadcrumbs for context
- ✅ Source map support
- ✅ Release tracking
- ✅ Performance monitoring
- ✅ Session replay

**Pricing**: Free (up to 1M events/month), Team ($26-29/month)

### Mixpanel

**Best For**: User behavior analytics and engagement

**Features**:
- ✅ Event tracking
- ✅ User funnels
- ✅ Cohort analysis
- ✅ Retention analysis
- ✅ A/B testing
- ✅ User profiles
- ✅ Real-time dashboards

**Pricing**: Free (up to 1K events/day), Standard ($999/month)

### Segment

**Best For**: Data collection and routing to multiple platforms

**Features**:
- ✅ Unified SDK
- ✅ Route data to 300+ tools
- ✅ Data governance
- ✅ Real-time processing
- ✅ Schema management
- ✅ GDPR compliance tools

**Pricing**: Standard ($120/month), Professional ($2K+/month)

### Amplitude

**Best For**: Product analytics and behavioral insights

**Features**:
- ✅ Event analytics
- ✅ User flows
- ✅ Funnel analysis
- ✅ Retention analysis
- ✅ Cohorts
- ✅ A/B testing
- ✅ Predictive analytics

**Pricing**: Free, Growth ($995/month), Premier ($4.5K+/month)

---

## Privacy & Compliance

### GDPR Requirements

✅ **User Consent**: Collect explicit consent before tracking  
✅ **Transparency**: Disclose what data is collected  
✅ **Data Minimization**: Collect only necessary data  
✅ **Right to Delete**: Allow users to delete their data  
✅ **Data Portability**: Export user data  
✅ **Privacy by Design**: Default to privacy-friendly settings

### Implementation Strategy

```typescript
// 1. Check user location
const isEUUser = await checkUserLocation()

if (isEUUser) {
  // 2. Show consent banner
  showConsentBanner([
    'Analytics: Track your usage to improve app',
    'Crash Reporting: Report crashes to fix bugs',
    'Marketing: Track conversions for ads'
  ])
  
  // 3. Wait for user choice
  const consent = await getUserConsent()
  
  // 4. Initialize only if consented
  if (consent.analytics) {
    initializeAnalytics()
  }
}
```

### Anonymous Mode

```typescript
// Option to disable tracking
if (userPreferences.disableTracking) {
  analyticsClient.disable()
  // or disable specific categories
  analyticsClient.disableCategory('advertising')
}
```

---

## Event Tracking Patterns

### Standard Event Structure

```typescript
interface AnalyticsEvent {
  name: string              // 'SignupCompleted'
  properties?: {
    [key: string]: any      // Custom properties
  }
  timestamp?: number        // Auto-populated
  userId?: string           // User identifier
  sessionId?: string        // Session identifier
}
```

### Event Naming Convention

```typescript
// Use verb + noun format
'UserSignedUp'
'PaymentProcessed'
'FeatureViewed'
'ButtonTapped'

// Namespace complex events
'Onboarding.Step1Completed'
'Checkout.CardAdded'
'Settings.NotificationsToggled'
```

---

## Monitoring Dashboard

### Key Metrics to Monitor

**User Metrics**:
- New users
- Active users (DAU, WAU, MAU)
- Retention rate (D1, D7, D30)
- Churn rate

**Performance Metrics**:
- App launch time (target: <2s)
- Screen load time (target: <1s)
- API response time (target: <500ms)
- Crash rate (target: <0.1%)

**Business Metrics**:
- Conversion rate
- Revenue per user (RPU)
- Customer lifetime value (LTV)
- Feature adoption

---

## Decision Matrix: Platform Selection

| Scenario | Platform | Reason |
|----------|----------|--------|
| **Just starting** | Firebase | Free, easy setup, integrated |
| **Focus on crashes** | Sentry | Best crash reporting |
| **User behavior** | Mixpanel | Superior behavior analytics |
| **Multiple tools** | Segment | Central hub for data routing |
| **Prediction needed** | Amplitude | Best predictive analytics |
| **Privacy focused** | Custom + Segment | GDPR-ready with governance |

---

## Implementation Approaches

### Approach 1: Single Platform (Firebase)

```typescript
// Simple, integrated
initializeFirebase()
analytics.logEvent('signup', { email: 'user@example.com' })
```

**Pros**: Easy, cheap, integrated  
**Cons**: Limited flexibility, vendor lock-in

### Approach 2: Multiple Platforms (Best Practice)

```typescript
// Event tracking
analytics.track('UserSignedUp', { email })  // Mixpanel
crashReporting.captureEvent(event)          // Sentry
firebase.analytics.logEvent('signup')       // Firebase
```

**Pros**: Best-of-breed tools, flexibility  
**Cons**: More complex, higher cost

### Approach 3: Unified SDK (Segment)

```typescript
// Route to multiple platforms through Segment
segment.track('UserSignedUp', { email })
// Automatically routes to: Mixpanel, Firebase, GA4, etc.
```

**Pros**: Single integration point, easy platform switching  
**Cons**: Additional layer, cost of Segment

---

## Common Mistakes

❌ **Tracking too much data** - Performance and privacy issues  
❌ **No user consent** - GDPR violation  
❌ **Personally Identifiable Information (PII)** - Privacy risk  
❌ **Unstructured event names** - Hard to analyze  
❌ **No data retention policy** - Compliance risk  
❌ **Missing error context** - Hard to debug  
❌ **Batch collection without limit** - Memory issues  

---

## Monitoring Checklist

Before Launch:
- [ ] Analytics platform selected and configured
- [ ] Event tracking implemented
- [ ] Crash reporting enabled
- [ ] User consent mechanism working
- [ ] PII filtering in place
- [ ] Data retention policy defined
- [ ] Performance monitoring setup
- [ ] Alerts configured for anomalies
- [ ] Dashboard created
- [ ] Privacy policy updated
- [ ] GDPR compliance verified
- [ ] Data export functionality tested
- [ ] Crash reporting tested
- [ ] Analytics data validated

---

## Related Skills

This skill complements:
- **Mobile App Security** - Privacy and data protection
- **React Native Architecture** - App structure for tracking
- **System Design & Architecture** - Scaling analytics infrastructure
- **Backend API Design** - Analytics API design
- **Testing & TDD Mastery** - Testing analytics implementation

---

**Version**: 1.0 | **Last Updated**: 2025-10-18
