# Fastlane: Complete Mobile Automation Guide

Automate iOS and Android build, test, and deployment with Fastlane.

---

## Installation

```bash
# Install fastlane
sudo gem install fastlane

# Or with npm
npm install fastlane

# Initialize fastlane in project
cd ios
fastlane init

cd ../android
fastlane init
```

---

## Fastlane Structure

```
fastlane/
├── Fastfile              # Main configuration
├── Appfile               # App identifiers
├── .env.default          # Default environment variables
├── .env.production       # Production variables
└── actions/              # Custom actions
```

---

## iOS Fastlane

### Appfile

```ruby
# fastlane/Appfile
app_identifier "com.example.myapp"
apple_id "developer@example.com"
team_id "ABC123DEFG"
itc_team_id "12345678"
```

### Fastfile - Build & Test

```ruby
default_platform(:ios)

platform :ios do
  desc "Run tests"
  lane :test do
    scan(
      scheme: "MyApp",
      devices: ["iPhone 14"],
      clean: true,
      code_coverage: true,
      derived_data_path: "build/derived_data"
    )
  end

  desc "Build app"
  lane :build do
    build_app(
      workspace: "ios/MyApp.xcworkspace",
      scheme: "MyApp",
      configuration: "Release",
      derived_data_path: "build/derived_data",
      destination: "generic/platform=iOS",
      clean: true
    )
  end

  desc "Build for beta testing"
  lane :beta do
    test
    
    match(type: "appstore", readonly: true)
    
    build_app(
      workspace: "ios/MyApp.xcworkspace",
      scheme: "MyApp",
      configuration: "Release",
      export_method: "app-store",
      export_options: {
        provisioningProfiles: {
          "com.example.myapp" => "MyApp AppStore"
        }
      }
    )
    
    pilot(
      apple_id: "developer@example.com",
      app_identifier: "com.example.myapp",
      skip_waiting_for_build_processing: true
    )
  end

  desc "Release to App Store"
  lane :release do
    test
    
    match(type: "appstore", readonly: true)
    
    build_app(
      workspace: "ios/MyApp.xcworkspace",
      scheme: "MyApp",
      configuration: "Release",
      export_method: "app-store"
    )
    
    deliver(
      submit_for_review: true,
      automatic_release: true,
      force: true
    )
  end
end
```

---

## Android Fastlane

### Appfile

```ruby
# fastlane/Appfile
json_key_file "fastlane/google_play_key.json"
package_name "com.example.myapp"
```

### Fastfile - Build & Test

```ruby
platform :android do
  desc "Run tests"
  lane :test do
    gradle(
      project_dir: "android/",
      task: "test"
    )
  end

  desc "Build debug APK"
  lane :build_debug do
    gradle(
      project_dir: "android/",
      task: "assembleDebug"
    )
  end

  desc "Build release APK"
  lane :build_release do
    gradle(
      project_dir: "android/",
      task: "assembleRelease",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"]
      }
    )
  end

  desc "Build AAB for Play Store"
  lane :build_aab do
    gradle(
      project_dir: "android/",
      task: "bundleRelease",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"]
      }
    )
  end

  desc "Upload to Play Store - Internal Testing"
  lane :beta do
    test
    
    build_aab
    
    upload_to_play_store(
      track: "internal",
      release_status: "inProgress"
    )
  end

  desc "Upload to Play Store - Production"
  lane :release do
    test
    
    build_aab
    
    upload_to_play_store(
      track: "production",
      release_status: "completed"
    )
  end
end
```

---

## Cross-Platform Lanes

```ruby
desc "Build and test for all platforms"
lane :build_all do
  build_ios_beta
  build_android_beta
  post_to_slack("✅ Builds completed")
end

desc "Release both iOS and Android"
lane :release_all do
  release_ios
  release_android
  notify_team("🚀 Released to both stores")
end

private_lane :post_to_slack do |options|
  slack(
    message: options[:message],
    slack_url: ENV["SLACK_WEBHOOK"]
  )
end
```

---

## Environment Variables

Create `.env` files:

```ruby
# fastlane/.env.production
FASTLANE_USER=developer@example.com
FASTLANE_PASSWORD=****
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=****

# fastlane/.env.android
KEYSTORE_PATH=/path/to/keystore.jks
KEYSTORE_PASSWORD=****
KEY_ALIAS=mykey
KEY_PASSWORD=****

# fastlane/.env.slack
SLACK_WEBHOOK=https://hooks.slack.com/****
```

---

## Versioning Automation

```ruby
def increment_version_patch
  version = sh("npm pkg get version | tr -d '\"'").strip
  parts = version.split(".")
  parts[2] = (parts[2].to_i + 1).to_s
  new_version = parts.join(".")
  
  sh("npm version #{new_version} --no-git-tag-version")
  new_version
end

lane :bump_beta do
  version = increment_version_patch
  
  # iOS
  increment_build_number(xcodeproj: "ios/MyApp.xcodeproj")
  
  # Android
  gradle_set_version(
    gradle_file: "android/app/build.gradle",
    version_code: ENV["CI_JOB_ID"],
    version_name: version
  )
end
```

---

## Screenshot Automation

```ruby
desc "Generate localized screenshots"
lane :screenshots do
  frameit(
    white: true,
    path: "fastlane/screenshots",
    output_directory: "fastlane/framed_screenshots"
  )
end
```

---

## Integrating with CI/CD

### GitHub Actions

```yaml
- name: Build and deploy with Fastlane
  run: |
    cd ios
    fastlane beta
    cd ../android
    fastlane beta
  env:
    FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
    KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
```

### GitLab CI

```yaml
build_beta:
  stage: build
  script:
    - cd ios && fastlane beta
    - cd ../android && fastlane beta
  variables:
    FASTLANE_PASSWORD: $FASTLANE_PASSWORD
    KEYSTORE_PASSWORD: $ANDROID_KEYSTORE_PASSWORD
```

---

## Best Practices

✅ **Do**:
- Use environment variables for secrets
- Version control Fastfile (not .env files)
- Test lanes locally before CI
- Use private lanes for helpers
- Document custom actions
- Add error handling

❌ **Don't**:
- Commit secrets to git
- Hardcode credentials
- Run all lanes without testing
- Skip signing configuration
- Forget to update version numbers

---

## Useful Plugins

```ruby
# Add to Gemfile
gem 'fastlane-plugin-slack'
gem 'fastlane-plugin-notify'
gem 'fastlane-plugin-versioning'

# Then: fastlane add_plugin slack
```

---

## Troubleshooting

### Issue: Xcode selection
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Issue: Slow builds
```bash
fastlane scan --disable_slide_to_type
```

### Issue: Keystore not found
```bash
# Create debug keystore
keytool -genkey -v -keystore ~/.android/debug.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 -alias androiddebugkey
```

---

## More Information

- https://fastlane.tools/
- Documentation: https://docs.fastlane.tools/
- Community: https://github.com/fastlane/fastlane
