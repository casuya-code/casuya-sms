# Implementation Plan - Fix Project Warnings and Errors

The project currently fails to build because Android SDK Platform 35 is missing. This causes widespread "Unresolved reference" errors throughout the codebase as the IDE cannot link against the Android framework. Additionally, there are reported errors in `AndroidManifest.xml` which might be related to the SDK issue or minor structural problems.

## User Review Required

> [!IMPORTANT]
> I am downgrading the `compileSdk` and `targetSdk` from 35 to 34 to allow the project to build on environments where SDK 35 is not yet installed. If you specifically require SDK 35 features, please install it via the SDK Manager and let me know.

## Proposed Changes

### Build Configuration

#### [MODIFY] [build.gradle.kts](file:///C:/Users/Admin/Desktop/casuya-sms/casuya-sms-device/app/build.gradle.kts)
- Downgrade `compileSdk` to 34.
- Downgrade `targetSdk` to 34.

### Manifest Fixes

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/Admin/Desktop/casuya-sms/casuya-sms-device/app/src/main/AndroidManifest.xml)
- Verify and potentially fix the XML structure if issues persist after SDK downgrade. (Currently looks mostly correct, but the IDE is flagging attributes as "not allowed").

## Verification Plan

### Automated Tests
- Run `./gradlew assembleDebug` to ensure the project builds successfully.
- Run `analyze_file` on key files (`MainActivity.kt`, `App.kt`, `SMSBackgroundService.kt`) to ensure no more "Unresolved reference" errors exist.

### Manual Verification
- None required at this stage.
