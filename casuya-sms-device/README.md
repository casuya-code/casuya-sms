# casuya-sms-device

SMS Gateway Device App for Android (Kotlin). This is the **APK project only** — an Android app that lives on the phone 24/7, keeps a WebSocket connection to the backend, and sends real SMS when orders arrive.

> The app doesn't know the web dashboard exists. It only talks to the backend. The backend is the bridge.

## How It Works

```
[ Backend API ]  ────(WebSocket JSON)────►  [ WebSocketClient.kt ]
                                                   │
                                           (Passes Payload)
                                                   ▼
[ SmsManager ]   ◄───(Triggers SIM Card)───  [ SMSHandler.kt ]
```

1. User opens the app and logs in with their dashboard credentials.
2. The app registers the phone as a device and stores its `deviceId` locally.
3. A foreground service keeps the WebSocket connection alive 24/7.
4. When the backend receives an SMS order, it pushes the JSON payload over WebSocket.
5. The payload flows through `WebSocketClient.kt` → `SMSHandler.kt` → Android's native `SmsManager`, firing the SMS over the cellular network, then the result is reported back.

## Project Structure

```
casuya-sms-device/
│
├── build.gradle.kts               # Project-level build config
├── settings.gradle.kts            # rootProject.name + :app module
├── gradle.properties
├── .gitignore
│
└── app/
    ├── build.gradle.kts           # Deps (Retrofit, OkHttp, Compose, SecurityCrypto)
    └── src/
        ├── main/
        │   ├── java/com/casuya/sms/
        │   │   ├── App.kt                            # Application (inits PrefsManager)
        │   │   ├── data/
        │   │   │   ├── local/
        │   │   │   │   └── PrefsManager.kt           # Encrypted JWT + DeviceId store
        │   │   │   └── models/
        │   │   │       ├── LoginRequest.kt
        │   │   │       ├── LoginResponse.kt
        │   │   │       └── DeviceRegisterRequest.kt
        │   │   │
        │   │   ├── network/
        │   │   │   ├── ApiClient.kt                  # Retrofit client
        │   │   │   ├── ApiService.kt                 # HTTP endpoint definitions
        │   │   │   ├── AuthInterceptor.kt            # Attaches JWT to requests
        │   │   │   └── WebSocketClient.kt            # Permanent connection + reconnect
        │   │   │
        │   │   ├── receivers/
        │   │   │   └── BootReceiver.kt               # Auto-start after reboot
        │   │   │
        │   │   ├── services/
        │   │   │   └── SMSBackgroundService.kt       # Foreground service 24/7
        │   │   │
        │   │   ├── ui/
        │   │   │   ├── MainActivity.kt               # Entry + runtime permissions
        │   │   │   ├── login/
        │   │   │   │   └── LoginScreen.kt            # Compose login UI
        │   │   │   └── dashboard/
        │   │   │       └── DashboardScreen.kt        # Status + logout
        │   │   │
        │   │   └── utils/
        │   │       └── SMSHandler.kt                 # SmsManager + multipart
        │   │
        │   ├── res/
        │   │   ├── drawable/                         # ic_launcher.xml (vector icon)
        │   │   └── values/
        │   │       ├── strings.xml
        │   │       └── themes.xml
        │   │
        │   └── AndroidManifest.xml                   # Permissions & service registration
        └── test/                                     # Unit tests
```

## Deep Dive: App Architecture & Data Flow

```
[ Backend API ]  ────(WebSocket JSON)────►  [ WebSocketClient.kt ]
                                                   │
                                           (Passes Payload)
                                                   ▼
[ SmsManager ]   ◄───(Triggers SIM Card)───  [ SMSHandler.kt ]
```

## Deep Dive: Critical Files

### `AndroidManifest.xml` — The Permission Engine

The single most important file for an SMS gateway. It forces the OS to grant critical access and registers the background service:

- `SEND_SMS` — allows the code to trigger the cellular antenna
- `RECEIVE_BOOT_COMPLETED` — auto-start after the phone reboots
- `FOREGROUND_SERVICE` **and** `FOREGROUND_SERVICE_DATA_SYNC` — declares the 24/7 background service (Android 14+)
- `INTERNET`, `POST_NOTIFICATIONS` — network + persistent notification icon

### 1. Background Survival (`services/SMSBackgroundService.kt`)

Android heavily restricts background apps to maximize battery life — an idle app gets forcefully terminated.

- **The Mechanism:** The service implements a **Foreground Service**. By displaying a permanent, non-dismissible notification in the status bar, it explicitly signals to the Android OS that its execution is critical to the user.
- **The Result:** The system flags the app as high priority, preventing it from being killed even during deep sleep (**Doze Mode**). The WebSocket stays alive.

### 2. Automatic Recovery (`receivers/BootReceiver.kt`)

If the phone runs out of battery, updates, or restarts, the gateway goes offline. Users shouldn't have to reopen the app manually.

- **The Mechanism:** A system broadcast listener registered for the native `android.intent.action.BOOT_COMPLETED` signal.
- **The Result:** The moment the device boots to the lock screen, the receiver wakes up silently, reads the saved login credentials, and launches `SMSBackgroundService` with zero user interaction.

### 3. Hardware Execution (`utils/SMSHandler.kt`)

The bridge between web software instructions and the physical phone network.

- **The Mechanism:** Initializes Android's low-level `SmsManager` API. Parses the incoming network payload, extracts the recipient string and message body, and queues them to the carrier's cellular queue.
- **Multipart Handling:** Standard texts are limited to 160 characters. This handler uses `divideMessage()` and `sendMultipartTextMessage()` to break long messages apart and let the recipient's phone stitch them back together — no hardware errors, no truncation.

### 4. Safe State Management (`data/local/PrefsManager.kt`)

Every network socket must prove authorization to listen to a specific user account.

- **The Mechanism:** A secure local storage sandbox built on `EncryptedSharedPreferences`.
- **The Result:** Caches the server-issued JWT and Device ID. When the WebSocket drops (poor cell signal), the app securely reads these keys and silently re-authenticates with the backend.

## Component Summary

| File | Job |
|------|-----|
| `data/local/PrefsManager.kt` | Encrypted local store for JWT + device id (re-auth on reconnect) |
| `network/ApiClient.kt` | Retrofit client for REST calls |
| `network/ApiService.kt` | Defines HTTP endpoints (login, register device) |
| `network/AuthInterceptor.kt` | Attaches the auth token to every HTTP request |
| `network/WebSocketClient.kt` | Long-lived connection that receives SMS orders |
| `receivers/BootReceiver.kt` | Re-opens the connection after reboot |
| `services/SMSBackgroundService.kt` | Foreground service keeping it alive 24/7 |
| `ui/MainActivity.kt` | Entry point + runtime permission requests |
| `utils/SMSHandler.kt` | Sends SMS via `SmsManager` (handles multipart >160 chars) |

## Configuration

Before building, set your backend URL in `app/build.gradle.kts` — the `BASE_URL` `buildConfigField` (e.g. `"https://your-backend.onrender.com"`):

```kotlin
defaultConfig {
    buildConfigField "String", "BASE_URL", "\"https://your-backend.onrender.com\""
}
```

## Building the APK

Open the project in **Android Studio**, then:

```bash
./gradlew assembleRelease
```

The signed APK will be at `app/build/outputs/apk/release/`.

## Notes

- Sending SMS requires a runtime permission on Android 6+ (request in `MainActivity.kt`).
- The app must display a small persistent notification for the foreground service.
- On device reboot, `BootReceiver.kt` automatically restarts the service and reconnects.
- On weak cell signal, `PrefsManager.kt` supplies the cached JWT so the WebSocket silently re-authenticates.
- Re-login reuses the stored `deviceId` instead of registering a duplicate device.

## ⚠️ Google Play Store Compliance Warning

| Distribution Channel | Policy Restriction | Action Required |
|---|---|---|
| **Google Play Store** | Strictly forbidden for general use. Google restricts `SEND_SMS` permissions solely to default dialer or default texting apps. | Your app will likely be rejected if submitted to the Play Store. |
| **Direct APK Distribution** | Allowed. Android permits any hardware access if the user installs the app manually via an APK file. | Provide a direct `.apk` download link on your web dashboard; users must enable "Allow installation from unknown sources" on their device. |

## Related

- Web project: `casuya-sms-web` — dashboard + backend that pushes orders to this app.