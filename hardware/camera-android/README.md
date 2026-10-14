# DailyMind Room Camera — Android Application

A standalone Android application that turns a spare phone into a live monitoring camera for the DailyMind safety system.

## Overview

This app captures live video from the phone's rear camera and broadcasts it via WebRTC to the DailyMind backend's signaling server. A caregiver using the DailyMind app can then view the live feed from the **Safety Monitoring → Room Camera** screen.

## Features

- Rear camera video capture (configurable to front camera)
- WebRTC peer-to-peer video streaming
- WebSocket-based signaling through the DailyMind backend
- Foreground service to keep streaming when minimized
- Explicit start/stop broadcasting controls
- Visible broadcasting indicator
- Auto-reconnect on network interruptions
- Camera and microphone runtime permission handling

## Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- Android SDK 24+ (target SDK 34)
- A spare Android phone with a working camera
- The DailyMind backend running with WebSocket signaling enabled

## Building

1. Open this directory (`hardware/camera-android/`) in Android Studio
2. Let Gradle sync complete
3. Connect your Android phone via USB (enable USB debugging)
4. Click **Run** (▶) to build and install

Or build from the command line:

```bash
cd hardware/camera-android
./gradlew assembleDebug
# APK will be at app/build/outputs/apk/debug/app-debug.apk
```

## Configuration

Before building, update the signaling server URL in [`app/src/main/java/com/dailymind/camera/SignalingClient.kt`](app/src/main/java/com/dailymind/camera/SignalingClient.kt):

```kotlin
private const val SIGNALING_URL = "wss://dailymind-ssn.onrender.com/ws/signaling"
```

Replace with your actual backend URL.

## Usage

1. Install the APK on the monitoring phone
2. Place the phone in the room to be monitored (propped up, rear camera facing the room)
3. Open the app and tap **Start Broadcasting**
4. Grant camera and microphone permissions when prompted
5. The app shows a "LIVE" indicator when actively streaming
6. On the caregiver's phone, open DailyMind → Profile → Safety Monitoring → Room Camera → Start Viewing

## Android Background Restrictions

⚠️ Android aggressively manages battery and may kill background apps. This app uses a **foreground service** with a persistent notification to maintain the camera stream while minimized. However:

- Some manufacturers (Xiaomi, Huawei, Samsung) have additional battery optimization that may still stop the service
- The user may need to disable battery optimization for this app manually
- The app must be granted the "Display over other apps" permission on some devices
- Keeping the phone plugged in is recommended for continuous monitoring

## Privacy & Security

- The camera only activates when the user explicitly taps "Start Broadcasting"
- A prominent "LIVE" indicator is always visible during streaming
- No video is recorded or saved to storage
- No audio is captured by default (can be enabled in settings)
- The signaling connection uses WSS (encrypted WebSocket)
- Stopping the broadcast immediately terminates the stream

## Known Limitations

1. **Single viewer**: The current signaling protocol supports one viewer at a time
2. **No TURN relay**: Uses Google's free STUN server; may fail behind strict NATs
3. **Battery drain**: Continuous camera use drains battery quickly — keep plugged in
4. **No authentication**: The signaling WebSocket does not require a session token (prototype limitation)
