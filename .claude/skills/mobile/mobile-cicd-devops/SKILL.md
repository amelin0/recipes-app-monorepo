---
name: CI/CD & DevOps for Mobile
description: Master automated build pipelines, app signing, deployment automation, and release management for iOS and Android
tags: [mobile, ci-cd, devops, fastlane, github-actions, app-store, play-store, automation, deployment]
version: 1.0
---

# CI/CD & DevOps for Mobile

## When Claude Should Use This Skill

- Setting up automated build pipelines
- Configuring app signing and provisioning
- Automating app store submissions
- Managing releases and versioning
- Implementing automated testing in CI
- Setting up beta testing (TestFlight, Play Beta)
- Automating screenshot generation
- Managing environment-specific builds
- Implementing notification systems for build events
- Designing mobile DevOps workflows

---

## Mobile CI/CD Pipeline Architecture

```
┌──────────────────────────────────┐
│   Code Push (Git)                │
├──────────────────────────────────┤
│   Trigger (GitHub Actions,       │
│   GitLab CI, CircleCI)           │
├──────────────────────────────────┤
│   Build & Unit Tests             │
│   - Compile                      │
│   - Run tests                    │
│   - Check coverage               │
├──────────────────────────────────┤
│   Code Quality & Security        │
│   - Linting                      │
│   - SAST scan                    │
│   - Dependency check             │
├──────────────────────────────────┤
│   Build App                      │
│   - iOS: .ipa                    │
│   - Android: .apk                │
├──────────────────────────────────┤
│   Sign & Provision               │
│   - iOS: Certificates            │
│   - Android: Keystore            │
├──────────────────────────────────┤
│   Beta Distribution              │
│   - iOS: TestFlight              │
│   - Android: Play Internal       │
├──────────────────────────────────┤
│   E2E Tests (Optional)           │
│   - Detox, XCUITest, Espresso    │
├──────────────────────────────────┤
│   App Store Submission           │
│   - Review process               │
│   - Manual approval              │
├──────────────────────────────────┤
│   Production Release             │
│   - Phased rollout               │
│   - Monitoring                   │
├──────────────────────────────────┤
│   Notifications                  │
│   - Slack, Email, etc.           │
└──────────────────────────────────┘
```

---

## CI/CD Platforms for Mobile

### GitHub Actions

**Best For**: GitHub-hosted projects, tight GitHub integration

**Strengths**:
- ✅ Native GitHub integration
- ✅ Free tier with good limits
- ✅ Excellent documentation
- ✅ MacOS runners for iOS
- ✅ Linux runners for Android
- ✅ Ecosystem of actions

**Pricing**: Free for public repos, $21/month for private (or per-minute)

### GitLab CI/CD

**Best For**: Self-hosted, on-premise requirements

**Strengths**:
- ✅ Self-hosted option
- ✅ Integrated DevOps platform
- ✅ Powerful job scheduling
- ✅ Good for large teams

**Pricing**: Free tier available, Premium starts at €19/user/month

### CircleCI

**Best For**: Professional CI/CD with strong mobile support

**Strengths**:
- ✅ Excellent iOS/Android support
- ✅ Fast builds
- ✅ Good documentation
- ✅ Docker support
- ✅ Pre-installed tools

**Pricing**: Free tier available, Pro starts at $20/month

### Bitrise

**Best For**: Mobile-first CI/CD platform

**Strengths**:
- ✅ Mobile-optimized
- ✅ Easy configuration
- ✅ Strong iOS/Android support
- ✅ Pre-built mobile workflows
- ✅ App Store connect integration

**Pricing**: Startup (free), Pro ($85/month)

---

## Key CI/CD Concepts

### 1. Build Configuration

**iOS**:
```
Project structure
    ↓
Build settings (Debug/Release)
    ↓
Code signing (Certificates, Provisioning Profiles)
    ↓
Archive (.xcarchive)
    ↓
Export (.ipa)
```

**Android**:
```
Project structure
    ↓
Build variants (Debug/Release)
    ↓
Signing configuration (Keystore)
    ↓
Assemble (APK/AAB)
    ↓
Sign (Signing key)
    ↓
Aligned (.apk or .aab)
```

### 2. Code Signing & Provisioning

**iOS**:
- Development Certificate (for testing)
- Distribution Certificate (for App Store)
- Provisioning Profiles (link device, team, app)
- Manual or Automatic signing

**Android**:
- Keystore file (contains signing key)
- Key alias and password
- Separate key for release vs debug

### 3. Version Management

**Semantic Versioning**: MAJOR.MINOR.PATCH
- 1.0.0 (initial release)
- 1.1.0 (minor features added)
- 1.1.1 (bug fixes)

**Build Numbers**:
- iOS: Bundle version and Short version
- Android: versionCode (integer, must increment) and versionName (string, user-facing)

### 4. Artifact Management

Store build artifacts:
- iOS: .ipa files
- Android: .apk and .aab files
- Screenshots and metadata
- Release notes

---

## Build Configuration Management

### Environment Variables

```yaml
Development:
  API_URL: https://dev.api.example.com
  DEBUG: true
  LOG_LEVEL: verbose

Staging:
  API_URL: https://staging.api.example.com
  DEBUG: false
  LOG_LEVEL: info

Production:
  API_URL: https://api.example.com
  DEBUG: false
  LOG_LEVEL: error
```

### Build Schemes (iOS)

```
Debug-Dev → API = dev, signing = debug
Debug-Staging → API = staging, signing = dev
Release-Staging → API = staging, signing = dist
Release-Prod → API = prod, signing = dist
```

### Build Flavors (Android)

```
Debug-dev → API = dev
Debug-staging → API = staging
Release-staging → API = staging
Release → API = prod
```

---

## Popular DevOps Tools

### Fastlane

**Purpose**: Automate iOS and Android app deployment

**Main Commands**:
- `fastlane build` - Build app
- `fastlane beta` - Upload to TestFlight/Internal Testing
- `fastlane release` - Submit to App Store/Play Store
- `fastlane screenshots` - Generate localized screenshots

### Gradle (Android)

**Building**:
```
./gradlew build              # Debug + Release
./gradlew assembleRelease   # Build release APK
./gradlew bundleRelease     # Build AAB
```

### Xcode (iOS)

**Building**:
```
xcodebuild build                    # Debug
xcodebuild archive                  # Create archive
xcodebuild -exportArchive           # Export IPA
```

---

## Testing in CI

### Types of Tests in Pipeline

```
Unit Tests (Fast)
    ↓
Integration Tests (Medium)
    ↓
E2E Tests (Slow, optional)
    ↓
Code Quality (Linting, SAST)
    ↓
Build APK/IPA
```

### Code Coverage Requirements

- Target: > 80% coverage
- Alert if: Coverage drops > 5%
- Track over time

---

## Deployment Strategies

### Blue-Green Deployment

```
Current (Blue):  Version 1.0 (100% traffic)
New (Green):     Version 2.0 (0% traffic)

After validation:
Blue:  Version 1.0 (0% traffic)
Green: Version 2.0 (100% traffic)
```

### Canary Release

```
Week 1: 5% users get v2.0
Week 2: 25% users get v2.0
Week 3: 50% users get v2.0
Week 4: 100% users get v2.0
```

### Feature Flags

```
Deploy to 100% users but:
- Feature behind flag
- Can disable instantly if issue
- No need to roll back
```

---

## Monitoring Releases

### Key Metrics

- **Crash Rate**: < 0.1%
- **Error Rate**: < 1%
- **User-Reported Issues**: Monitor support channels
- **Performance**: Track vs previous version

### Rollback Strategy

If issues detected:
1. Disable feature flag (if applicable)
2. Or rollback to previous version
3. Investigate root cause
4. Fix and re-deploy

---

## Common CI/CD Tools

| Tool | Purpose | Platform |
|------|---------|----------|
| **GitHub Actions** | CI/CD platform | GitHub-native |
| **Fastlane** | Build automation | iOS/Android |
| **CircleCI** | CI/CD platform | Cloud-based |
| **Bitrise** | Mobile CI/CD | Cloud-based |
| **GitLab CI** | CI/CD platform | GitLab-native |

---

## Checklist: Setting Up CI/CD

- [ ] Choose CI/CD platform
- [ ] Set up repository integration
- [ ] Configure build scripts
- [ ] Set up code signing
- [ ] Configure version management
- [ ] Set up testing in pipeline
- [ ] Configure artifact storage
- [ ] Set up beta distribution
- [ ] Configure App Store/Play Store submission
- [ ] Set up monitoring/alerts
- [ ] Configure rollback procedure
- [ ] Document deployment process

---

## Related Skills

This skill complements:
- **Mobile App Security** - Secure signing and distribution
- **Testing & TDD Mastery** - Tests in CI pipeline
- **Mobile Analytics & Monitoring** - Monitor after release
- **System Design & Architecture** - Multi-environment setup

---

**Version**: 1.0 | **Last Updated**: 2025-10-18
