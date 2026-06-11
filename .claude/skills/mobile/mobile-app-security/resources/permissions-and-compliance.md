# Permissions Management & Compliance

Understanding and properly implementing platform permissions is critical for both security and app store acceptance.

---

## Permissions Principle: Least Privilege

**Only request permissions absolutely necessary for app functionality.**

Requesting unnecessary permissions:
- Delays app approval on App Store/Play Store
- Reduces user trust and increases uninstalls
- Creates security vulnerabilities
- Violates user privacy expectations

---

## iOS Permissions (Info.plist)

### Permission Types

| Permission | Key | Description | User Prompt |
|-----------|-----|-------------|-------------|
| Camera | `NSCameraUsageDescription` | Access device camera | First use |
| Microphone | `NSMicrophoneUsageDescription` | Record audio | First use |
| Photo Library | `NSPhotoLibraryUsageDescription` | Read photos | First use |
| Contacts | `NSContactsUsageDescription` | Access contacts | First use |
| Calendar | `NSCalendarsUsageDescription` | Access events | First use |
| Location | `NSLocationWhenInUseUsageDescription` | GPS location | First use |
| Health | `NSHealthShareUsageDescription` | HealthKit data | First use |

### Implementation: iOS Permissions

```swift
import AVFoundation
import CoreLocation
import Photos

// Camera Permission
func requestCameraPermission() {
  AVCaptureDevice.requestAccess(for: .video) { granted in
    if granted {
      print("Camera permission granted")
    } else {
      print("Camera permission denied")
    }
  }
}

// Location Permission (When in use)
class LocationManager: NSObject, CLLocationManagerDelegate {
  let manager = CLLocationManager()
  
  func requestLocationPermission() {
    manager.delegate = self
    manager.requestWhenInUseAuthorization()
  }
  
  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    switch status {
    case .authorizedWhenInUse:
      print("Location permission granted (while in use)")
      manager.startUpdatingLocation()
    case .denied:
      print("Location permission denied")
    case .notDetermined:
      print("Permission not yet requested")
    default:
      break
    }
  }
}

// Photo Library Permission
func requestPhotoLibraryPermission() {
  PHPhotoLibrary.requestAuthorization { status in
    switch status {
    case .authorized:
      print("Photo library access granted")
    case .denied:
      print("Photo library access denied")
    case .notDetermined:
      print("Permission not yet requested")
    case .restricted:
      print("Photo library access restricted")
    @unknown default:
      break
    }
  }
}
```

### Info.plist Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Camera -->
  <key>NSCameraUsageDescription</key>
  <string>We need camera access to take photos for your profile.</string>
  
  <!-- Microphone -->
  <key>NSMicrophoneUsageDescription</key>
  <string>We need microphone access for video calls.</string>
  
  <!-- Photo Library -->
  <key>NSPhotoLibraryUsageDescription</key>
  <string>We need access to your photos to upload images.</string>
  
  <!-- Location -->
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>We need your location to show nearby restaurants.</string>
  <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
  <string>We need your location for background location tracking.</string>
  
  <!-- Contacts -->
  <key>NSContactsUsageDescription</key>
  <string>We need access to your contacts to help you connect with friends.</string>
  
  <!-- Health -->
  <key>NSHealthShareUsageDescription</key>
  <string>We need access to your health data to track your fitness.</string>
  <key>NSHealthUpdateUsageDescription</key>
  <string>We need permission to save health data.</string>
</dict>
</plist>
```

---

## Android Permissions

### Permission Categories

**Normal Permissions** (Automatically granted):
- Internet
- BLUETOOTH
- ACCESS_NETWORK_STATE

**Dangerous Permissions** (Require runtime request):
- Camera
- Contacts
- Calendar
- Location
- Microphone
- Phone
- SMS
- Storage (READ/WRITE_EXTERNAL_STORAGE)
- Body Sensors
- Fitness

### Implementation: Android Permissions

Add to `AndroidManifest.xml`:

```xml
<!-- Request permissions -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_CONTACTS" />

<!-- Optional: Indicate camera is optional -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

Request runtime permission:

```kotlin
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat

class PermissionHandler(private val activity: Activity) {
  
  fun requestCameraPermission() {
    if (ContextCompat.checkSelfPermission(
      activity,
      Manifest.permission.CAMERA
    ) == PackageManager.PERMISSION_DENIED) {
      
      ActivityCompat.requestPermissions(
        activity,
        arrayOf(Manifest.permission.CAMERA),
        REQUEST_CAMERA_CODE
      )
    } else {
      // Permission already granted
      useCamera()
    }
  }
  
  fun requestLocationPermission() {
    val permissions = arrayOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )
    
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      activity.requestPermissions(permissions, REQUEST_LOCATION_CODE)
    }
  }
  
  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ) {
    when (requestCode) {
      REQUEST_CAMERA_CODE -> {
        if (grantResults.isNotEmpty() && 
            grantResults[0] == PackageManager.PERMISSION_GRANTED) {
          useCamera()
        } else {
          showPermissionDeniedDialog()
        }
      }
    }
  }
  
  companion object {
    private const val REQUEST_CAMERA_CODE = 100
    private const val REQUEST_LOCATION_CODE = 101
  }
}
```

---

## React Native Permissions

### Installation

```bash
npm install react-native-permissions
# Autolinking (RN 0.60+)

# Or with Expo
expo install expo-permissions
```

### Implementation

```typescript
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions'
import { Platform } from 'react-native'

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA
    })
    
    if (!permission) return false
    
    const result = await request(permission)
    return result === RESULTS.GRANTED
  } catch (error) {
    console.error('Failed to request camera permission:', error)
    return false
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    })
    
    if (!permission) return false
    
    const result = await request(permission)
    return result === RESULTS.GRANTED
  } catch (error) {
    console.error('Failed to request location permission:', error)
    return false
  }
}

// Usage in component
function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(false)
  
  useEffect(() => {
    requestCameraPermission().then(setHasPermission)
  }, [])
  
  if (!hasPermission) {
    return <Text>Camera permission not granted</Text>
  }
  
  return <Camera {...props} />
}
```

### Expo Permissions API

```typescript
import * as Permissions from 'expo-permissions'

export async function requestCameraPermissionExpo(): Promise<boolean> {
  const { status } = await Permissions.askAsync(Permissions.CAMERA)
  return status === Permissions.PermissionStatus.GRANTED
}

export async function requestLocationPermissionExpo(): Promise<boolean> {
  const { status } = await Permissions.askAsync(Permissions.LOCATION)
  return status === Permissions.PermissionStatus.GRANTED
}
```

---

## Permission Handling Best Practices

### 1. Ask at Right Time

```typescript
// ❌ BAD: Ask for all permissions on app launch
useEffect(() => {
  requestCameraPermission()
  requestLocationPermission()
  requestContactsPermission()
}, [])

// ✅ GOOD: Ask when user needs feature
function CameraButton() {
  const handlePress = async () => {
    const hasPermission = await requestCameraPermission()
    if (hasPermission) {
      openCamera()
    } else {
      showPermissionDeniedAlert()
    }
  }
  
  return <Button onPress={handlePress}>Take Photo</Button>
}
```

### 2. Graceful Degradation

```typescript
// ✅ GOOD: Offer alternative without permission
function ShareButton() {
  const [hasContactsPermission, setHasContactsPermission] = useState(false)
  
  const handleShare = async () => {
    if (hasContactsPermission) {
      // Show contact picker
      showContactPicker()
    } else {
      // Show email input instead
      showEmailInput()
    }
  }
  
  return <Button onPress={handleShare}>Share</Button>
}
```

### 3. Permission Denial Handling

```typescript
// ✅ GOOD: Handle denial gracefully
async function requestWithFallback() {
  const result = await request(PERMISSIONS.IOS.CAMERA)
  
  if (result === RESULTS.GRANTED) {
    // Use camera
  } else if (result === RESULTS.DENIED) {
    // Permission denied, show explanation
    Alert.alert(
      'Camera Access Required',
      'Please enable camera access in Settings to use this feature.'
    )
  } else if (result === RESULTS.BLOCKED) {
    // Permission permanently blocked
    Alert.alert(
      'Camera Access Blocked',
      'Please enable camera access in Settings > AppName > Permissions'
    )
    // Optionally open settings
    Linking.openSettings()
  }
}
```

---

## Compliance Frameworks

### GDPR (General Data Protection Regulation)

**Applies to**: Apps with EU users

**Requirements**:

1. **Explicit Consent** - Get clear permission before collecting data
2. **Privacy Policy** - Disclose what data you collect and why
3. **Data Access** - Let users export their data
4. **Data Deletion** - Implement "right to be forgotten"
5. **Data Processing Agreement** - Document how data is processed

### Implementation

```typescript
// GDPR: Request explicit consent
export function useGDPRConsent() {
  const [hasConsent, setHasConsent] = useState(false)
  
  useEffect(() => {
    checkUserLocation().then(isEU => {
      if (isEU && !hasGivenConsent) {
        showConsentBanner()
      }
    })
  }, [])
  
  return hasConsent
}

// Implement data export
export async function exportUserData(userId: string): Promise<JSON> {
  const userData = await getUserData(userId)
  return {
    profile: userData.profile,
    settings: userData.settings,
    activityLog: userData.activityLog,
    exportedAt: new Date().toISOString()
  }
}

// Implement account deletion
export async function deleteUserAccount(userId: string): Promise<void> {
  await deleteUserData(userId)
  await deleteUserAuthTokens(userId)
  await deleteUserSessions(userId)
  await logDeletion(userId)
}
```

### CCPA (California Consumer Privacy Act)

**Applies to**: Apps with California residents

**Requirements**:

1. **Disclose Data Collection** - Specify what data you collect
2. **Opt-Out Mechanism** - Allow users to opt-out of sale
3. **Access Requests** - Respond to data access within 45 days
4. **No Discrimination** - Don't penalize users for opting out

### HIPAA (Health Information Portability and Accountability Act)

**Applies to**: Health/fitness apps

**Requirements**:

1. **End-to-End Encryption** - All health data encrypted
2. **Access Controls** - Limit who can access health data
3. **Audit Logs** - Track all access to health data
4. **Business Associate Agreement** - Required for third parties
5. **Breach Notification** - Notify within 60 days

---

## App Store & Play Store Requirements

### iOS App Store

- ✅ Privacy Policy link required
- ✅ Privacy Labels required (App Privacy)
- ✅ Only request necessary permissions
- ✅ Transparency about data collection
- ✅ Explain why each permission is needed

### Google Play Store

- ✅ Privacy Policy required
- ✅ Clear data handling policy
- ✅ Permissions justified in app
- ✅ Data deletion on uninstall (recommended)
- ✅ Restricted permissions allowed only if necessary

### Privacy Labels (iOS)

Declare data collection in App Store Connect:

```
Data Used for Tracking (IDFA, Fingerprinting):
- [ ] User ID
- [ ] Advertising ID
- [ ] Device ID
- [ ] Email Address

Contact Information Collected:
- [ ] Email Address
- [ ] Phone Number
- [ ] Physical Address

Health & Fitness Data:
- [ ] Health Records
- [ ] Fitness Data
- [ ] Workout Data
```

---

## Security & Privacy Checklist

Before Launch:
- [ ] Privacy policy written and accessible in-app
- [ ] All permissions justified and documented
- [ ] Permissions requested at appropriate times
- [ ] No unnecessary data collection
- [ ] User data encrypted in transit and at rest
- [ ] User data deleted on logout/uninstall
- [ ] Data export functionality implemented
- [ ] Account deletion functionality implemented
- [ ] No third-party tracking without consent
- [ ] Analytics anonymized
- [ ] GDPR/CCPA compliance verified
- [ ] HIPAA compliance (if health app)
- [ ] Privacy labels completed (iOS)
- [ ] Data handling policy documented (Android)
- [ ] App Store/Play Store review passed
- [ ] Legal review completed

---

## Resources

- [GDPR Text](https://gdpr-info.eu/)
- [CCPA Guide](https://oag.ca.gov/privacy/ccpa)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/)
- [Apple App Privacy Guide](https://developer.apple.com/app-store/app-privacy-details/)
- [Google Play Data Safety](https://play.google.com/about/data-safety/)
