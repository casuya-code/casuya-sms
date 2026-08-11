# Project Modernization and Build Fix Plan

The project is currently experiencing build issues due to a version mismatch between the newly updated Android Gradle Plugin (8.13.0), Gradle (9.3.0), and the older Kotlin (1.9.24). I have already fixed a redundant OkHttp dependency that was causing immediate resolution errors.

## Proposed Changes

### Build Infrastructure

#### [MODIFY] [build.gradle.kts](file:///C:/Users/Admin/Desktop/casuya-sms/casuya-sms-device/build.gradle.kts)
- Upgrade Kotlin version to `2.0.21` (or latest stable).
- Add the new Compose Compiler Gradle plugin.

#### [MODIFY] [app/build.gradle.kts](file:///C:/Users/Admin/Desktop/casuya-sms/casuya-sms-device/app/build.gradle.kts)
- Apply the `org.jetbrains.kotlin.plugin.compose` plugin.
- Remove the legacy `composeOptions` block (it's no longer needed with the new plugin).
- Update `compileSdk` and `targetSdk` to 35 to match modern Android standards.
- Align Kotlin BOM and other core dependencies.

### Dependencies

#### [MODIFY] [app/build.gradle.kts](file:///C:/Users/Admin/Desktop/casuya-sms/casuya-sms-device/app/build.gradle.kts)
- Update `androidx.core:core-ktx` to `1.15.0`.
- Update `androidx.lifecycle` to `2.8.7`.
- Update `androidx.activity:activity-compose` to `1.9.3`.

## Verification Plan

### Automated Tests
- Run `./gradlew assembleDebug` to ensure all components compile with the new toolchain.
- Perform a Gradle Sync to verify dependency resolution.

### Manual Verification
- Deploy the app to a device/emulator to ensure runtime compatibility with SDK 35.
