# GitHub Actions CI/CD Pipeline for Mobile

Complete workflow for building and deploying iOS and Android apps.

---

## Project Structure

```
.github/workflows/
├── build-test.yml          # Run on PR
├── build-beta.yml          # Run on push to develop
└── release.yml             # Manual trigger to App Store
```

---

## Workflow 1: Build & Test (PR)

File: `.github/workflows/build-test.yml`

```yaml
name: Build & Test

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build-android:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: android-debug
          path: android/app/build/outputs/apk/debug/

  build-ios:
    runs-on: macos-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install pods
        run: |
          cd ios
          pod install
      
      - name: Build iOS app
        run: |
          cd ios
          xcodebuild \
            -workspace MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Debug \
            -derivedDataPath build
      
      - name: Upload iOS build
        uses: actions/upload-artifact@v3
        with:
          name: ios-debug
          path: ios/build/
```

---

## Workflow 2: Build & Deploy Beta

File: `.github/workflows/build-beta.yml`

```yaml
name: Build & Deploy Beta

on:
  push:
    branches: [develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
  
  deploy-android-beta:
    runs-on: ubuntu-latest
    needs: build-and-test
    if: success()
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Increment version
        run: npm run bump-version:beta
      
      - name: Build AAB
        run: |
          cd android
          ./gradlew bundleRelease
        env:
          SIGNING_KEY_STORE_PATH: ${{ secrets.ANDROID_KEYSTORE_PATH }}
          SIGNING_KEY_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          SIGNING_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          SIGNING_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      
      - name: Deploy to Play Store (Internal Testing)
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
          packageName: com.myapp
          releaseFiles: android/app/build/outputs/bundle/release/
          track: internal
          status: inProgress
      
      - name: Notify Slack
        if: success()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Android Beta Deployed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Android Beta Build Successful\n*Commit:* ${{ github.sha }}\n*Branch:* develop"
                  }
                }
              ]
            }
  
  deploy-ios-beta:
    runs-on: macos-latest
    needs: build-and-test
    if: success()
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install pods
        run: |
          cd ios
          pod install
      
      - name: Increment version
        run: npm run bump-version:beta
      
      - name: Import signing certificate
        run: |
          echo "${{ secrets.IOS_CERTIFICATE }}" | base64 --decode > certificate.p12
          security import certificate.p12 -P "${{ secrets.IOS_CERTIFICATE_PASSWORD }}" -A
      
      - name: Setup provisioning profile
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "${{ secrets.IOS_PROVISIONING_PROFILE }}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision
      
      - name: Build & Archive
        run: |
          cd ios
          xcodebuild \
            -workspace MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Release \
            -archivePath build/MyApp.xcarchive \
            archive
      
      - name: Export IPA
        run: |
          cd ios
          xcodebuild \
            -exportArchive \
            -archivePath build/MyApp.xcarchive \
            -exportOptionsPlist exportOptions.plist \
            -exportPath build/
      
      - name: Upload to TestFlight
        run: |
          xcrun altool \
            --upload-app \
            --file ios/build/MyApp.ipa \
            --username "${{ secrets.APPLE_ID }}" \
            --password "${{ secrets.APPLE_PASSWORD }}"
      
      - name: Notify Slack
        if: success()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ iOS Beta Deployed to TestFlight",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "iOS Beta Build Successful\n*Commit:* ${{ github.sha }}\n*Branch:* develop"
                  }
                }
              ]
            }
```

---

## Workflow 3: Release to App Store

File: `.github/workflows/release.yml`

```yaml
name: Release to App Store

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  release:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: ${{ secrets.GH_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Bump version
        run: npm version ${{ github.event.inputs.release_type }}
      
      - name: Get version
        id: version
        run: echo "VERSION=$(npm pkg get version | tr -d '"')" >> $GITHUB_OUTPUT
      
      - name: Build iOS release
        run: |
          cd ios
          pod install
          xcodebuild \
            -workspace MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Release \
            -archivePath build/MyApp.xcarchive \
            archive
      
      - name: Export iOS IPA
        run: |
          cd ios
          xcodebuild \
            -exportArchive \
            -archivePath build/MyApp.xcarchive \
            -exportOptionsPlist exportOptions.plist \
            -exportPath build/
      
      - name: Build Android release
        run: |
          cd android
          ./gradlew bundleRelease
        env:
          SIGNING_KEY_STORE_PATH: ${{ secrets.ANDROID_KEYSTORE_PATH }}
          SIGNING_KEY_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          SIGNING_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          SIGNING_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      
      - name: Upload to App Store
        run: |
          xcrun altool \
            --upload-app \
            --file ios/build/MyApp.ipa \
            --username "${{ secrets.APPLE_ID }}" \
            --password "${{ secrets.APPLE_PASSWORD }}"
      
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
          packageName: com.myapp
          releaseFiles: android/app/build/outputs/bundle/release/
          track: production
          status: completed
      
      - name: Push version tag
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git push
          git push origin v${{ steps.version.outputs.VERSION }}
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.version.outputs.VERSION }}
          release_name: Release ${{ steps.version.outputs.VERSION }}
          body: |
            Release ${{ steps.version.outputs.VERSION }}
            
            **Changes:**
            - See commit history for changes
            
            **iOS**: Available on App Store
            **Android**: Available on Play Store
          draft: false
          prerelease: false
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚀 Release ${{ steps.version.outputs.VERSION }} Deployed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Version ${{ steps.version.outputs.VERSION }} released to both App Store and Play Store"
                  }
                }
              ]
            }
```

---

## Required Secrets

Create these in GitHub Settings → Secrets:

**iOS**:
- `APPLE_ID` - Apple ID email
- `APPLE_PASSWORD` - App-specific password
- `IOS_CERTIFICATE` - Base64 encoded certificate
- `IOS_CERTIFICATE_PASSWORD` - Certificate password
- `IOS_PROVISIONING_PROFILE` - Base64 encoded profile

**Android**:
- `ANDROID_KEYSTORE_PATH` - Path to keystore
- `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- `ANDROID_KEY_ALIAS` - Key alias
- `ANDROID_KEY_PASSWORD` - Key password
- `PLAY_STORE_SERVICE_ACCOUNT` - JSON credentials

**General**:
- `SLACK_WEBHOOK` - Slack webhook URL
- `GH_TOKEN` - GitHub personal access token

---

## Best Practices

✅ **Do**:
- Run tests before building
- Use secrets for sensitive data
- Sign commits
- Tag releases
- Monitor deployments
- Keep workflows DRY (reusable steps)

❌ **Don't**:
- Commit secrets to repo
- Run E2E tests on every commit
- Deploy directly to production
- Skip versioning
- Ignore build failures
