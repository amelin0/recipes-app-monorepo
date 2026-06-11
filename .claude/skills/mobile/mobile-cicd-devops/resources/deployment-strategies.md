# Mobile App Deployment Strategies

Comprehensive guide for deploying updates to production safely.

---

## Strategy 1: Immediate Release

### Pros
- Simple, direct to users
- No staged complexity
- All users get fix quickly

### Cons
- High risk if bugs
- No testing with real users first
- Can't easily roll back

### When to Use
- Critical bug fixes
- Security patches
- Non-breaking changes

### Implementation

```bash
# Tag release
git tag -a v1.2.0 -m "Release 1.2.0"

# Build and submit directly
fastlane ios release
fastlane android release
```

---

## Strategy 2: Canary Release

### Concept
Roll out to small percentage first, expand based on metrics.

### Timeline
- Day 1: 1% of users
- Day 2: 5% of users
- Day 3: 25% of users
- Day 4: 50% of users
- Day 5: 100% of users

### Pros
- Low risk initial rollout
- Catch issues with small user base
- Easy to stop if problems detected
- Good metrics gathering

### Cons
- Takes longer to reach all users
- Need monitoring setup
- Complex to manage

### Implementation (App Store)

```yaml
# App Store Connect configuration
In-App Events:
- Current Version: 1.0.0 (100% of users)
- New Version: 1.1.0 (1% of users)
- Monitor crash rate and errors

After 24 hours (if metrics healthy):
- Increase to 5% of users

Check daily:
- Crash rate < 0.1%
- No major issues reported
- Performance acceptable
```

### Implementation (Play Store)

```gradle
// Android build configuration
versionCode 15      // Must increment
versionName "1.1.0"

// In Play Store Console:
// - Set to Internal Testing initially
// - After validation, move to Closed Testing
// - After week, move to Production with phased rollout
```

---

## Strategy 3: Feature Flags

### Concept
Deploy code but control user access via flags.

### Pros
- Instant rollback (no app update needed)
- Can A/B test features
- Disable problematic features without update
- Decouple deploy from release

### Cons
- Code complexity (flag checks)
- Need feature flag service
- Database of flag states

### Implementation

```typescript
// React Native example
const useFeatureFlag = (featureName: string): boolean => {
  const [enabled, setEnabled] = useState(false)
  
  useEffect(() => {
    // Fetch from feature flag service
    firebaseRemoteConfig.fetchAndActivate().then(() => {
      const flag = firebaseRemoteConfig.getBoolean(featureName)
      setEnabled(flag)
    })
  }, [featureName])
  
  return enabled
}

// In component
function NewFeatureScreen() {
  const isNewCheckoutEnabled = useFeatureFlag('new_checkout_v2')
  
  if (isNewCheckoutEnabled) {
    return <NewCheckout />
  } else {
    return <OldCheckout />
  }
}
```

### Feature Flag Platforms

- Firebase Remote Config
- LaunchDarkly
- Optimizely
- Flagsmith
- Split.io

---

## Strategy 4: A/B Testing

### Concept
Split users between two versions and compare metrics.

### Scenario
Testing new checkout flow:

```
Control Group (50% of users):
  - Old checkout flow
  - Measure: Conversion rate, average order value, time to purchase

Treatment Group (50% of users):
  - New checkout flow
  - Measure: Same metrics

After 1 week:
  - Compare metrics
  - If treatment wins: Roll out to 100%
  - If control wins: Keep old flow
  - If similar: Choose based on other criteria
```

### Implementation (Firebase)

```yaml
# Firebase A/B Testing configuration
1. Create experiment
2. Select app version and audience
3. Define variants (Control: v1.0, Treatment: v1.0 with feature)
4. Set metrics to track (conversion_rate, order_value)
5. Set duration (7-14 days)
6. Analyze results
```

---

## Strategy 5: Blue-Green Deployment

### Concept
Maintain two identical production environments.

```
Current (Blue):    v1.0.0 (100% traffic)
Staging (Green):   v1.1.0 (0% traffic)

After validation:
Blue:              v1.0.0 (0% traffic)
Green (now Blue):  v1.1.0 (100% traffic)

If issues:
  Immediate rollback to old blue
```

### Pros
- Instant rollback
- Zero downtime
- Can test in production environment

### Cons
- Requires duplicate infrastructure
- Database state management tricky
- More complex setup

### For Mobile Apps
Less applicable (can't maintain two app versions running).

But can use for:
- Backend API versions
- Content/data service versions
- Feature flag configurations

---

## Strategy 6: Rolling Update

### Concept
Gradually replace old version with new across servers/devices.

```
Initial:   100% on v1.0.0

Update 1:  20% on v1.1.0, 80% on v1.0.0
Update 2:  40% on v1.1.0, 60% on v1.0.0
Update 3:  60% on v1.1.0, 40% on v1.0.0
Update 4:  80% on v1.1.0, 20% on v1.0.0
Final:     100% on v1.1.0
```

### For Mobile Apps

```
Day 1: App Store/Play Store release
Day 2: 10% of users update (auto or manual)
Day 3: 25% of users updated
Day 4: 50% of users updated
Day 5: 75% of users updated
Day 6: 90% of users updated
Day 7: 100% of users updated
```

---

## Rollback Scenarios

### Scenario 1: Critical Bug

**Symptom**: Crash rate spiked to 5%

**Response**:
1. Pause canary rollout
2. Investigate crash
3. Pull version from store
4. Fix and re-release
5. Or revert to previous version

### Scenario 2: Performance Regression

**Symptom**: Startup time increased from 1s to 3s

**Response**:
1. Identify performance bottleneck
2. Disable feature via flag
3. Or pull and re-release
4. Profile and fix before re-deploying

### Scenario 3: Data Migration Issue

**Symptom**: Users reporting missing data after update

**Response**:
1. Pause rollout
2. Investigate migration script
3. Provide user migration tool
4. Re-release with fix
5. Manual migration if needed

---

## Monitoring During Release

### Key Metrics to Watch

1. **Crash Rate**
   - Target: < 0.1%
   - Alert if: > 0.5%
   - Critical if: > 1%

2. **Error Rate**
   - Target: < 1%
   - Alert if: > 5%

3. **App Startup Time**
   - Target: < 2s
   - Alert if: > 3s

4. **User-Reported Issues**
   - Monitor support channels
   - Check app reviews
   - Track negative feedback

5. **Feature Usage**
   - Track adoption of new features
   - Monitor feature crash rate specifically
   - Compare to previous version

### Alerting

```yaml
# Example alert configuration
Alert: High Crash Rate
  Threshold: crash_rate > 0.5%
  Duration: 5 minutes
  Action: Pause rollout, notify team

Alert: Slow Startup
  Threshold: startup_time_p95 > 3s
  Duration: 10 minutes
  Action: Investigate, pause if needed

Alert: Negative Reviews Spike
  Threshold: 1-star reviews +500%
  Duration: 1 hour
  Action: Investigate, pause rollout
```

---

## Release Checklist

Before Release:
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed
- [ ] Security scan passed
- [ ] No known bugs
- [ ] Performance benchmarks met
- [ ] Release notes prepared
- [ ] Version bumped
- [ ] Signed and built

During Release:
- [ ] Monitor crash rate
- [ ] Monitor error rate
- [ ] Monitor startup time
- [ ] Check support channels
- [ ] Check app reviews
- [ ] Verify features working

After Release:
- [ ] Monitoring stable
- [ ] No critical issues
- [ ] Team notified
- [ ] Release notes published
- [ ] Stakeholders updated

---

## Release Timeline Example

### Week 1: Beta/Staging
```
Monday:   Code freeze, final testing
Tuesday:  Deploy to TestFlight/Internal Testing
Wed-Fri:  Beta testing, gather feedback
```

### Week 2: Production Canary
```
Monday:   Release to 1% of users
Tuesday:  Expand to 5% if metrics healthy
Wednesday: Expand to 25%
Thursday:  Expand to 50%
Friday:    Expand to 100%
```

### Post-Release: Monitoring
```
Week 3-4: Monitor metrics
         : Gather user feedback
         : Plan improvements for next release
```

---

## Best Practices

✅ **Do**:
- Have rollback plan
- Monitor key metrics
- Gradual rollout
- Have release checklist
- Test in staging first
- Document release process
- Communicate with team

❌ **Don't**:
- Deploy Friday evening
- Skip testing
- Deploy without monitoring
- Deploy without communication
- Ignore negative feedback
- Forget about rollback option
