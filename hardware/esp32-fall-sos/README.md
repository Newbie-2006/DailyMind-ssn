# DailyMind IMU + SOS — ESP32 Hardware Prototype

> **College engineering prototype.**  
> This is NOT a medically certified fall-detection product.

## Overview

A breadboard-based wearable prototype that:
- Reads accelerometer + gyroscope data from an **MPU6050** module.
- Detects **suspected falls** using acceleration spikes followed by inactivity.
- Provides a physical **SOS push button** for manual emergency alerts.
- Sends events to the DailyMind backend over **HTTPS**.
- Gives visual feedback via an **LED**.

---

## Bill of Materials

| # | Component | Specification | Approx. Price (INR) |
|---|-----------|---------------|---------------------|
| 1 | ESP32 DevKit V1 (30-pin) | ESP-WROOM-32, USB-C or Micro-USB | ₹450–550 |
| 2 | MPU6050 breakout board | GY-521 module, 3.3 V / 5 V compatible | ₹120–180 |
| 3 | Breadboard | 830 tie-point, full size | ₹80–120 |
| 4 | Jumper wires (M-M) | Pack of 20+, various lengths | ₹50–80 |
| 5 | Tactile push button | 6 × 6 mm momentary, 4-pin | ₹5–10 |
| 6 | LED (green or red) | 5 mm, standard through-hole | ₹3–5 |
| 7 | Resistor, 220 Ω | ¼ W, carbon film | ₹1–2 |
| 8 | USB cable | Matching the ESP32 port (Micro-USB or USB-C) | ₹80–120 |
|   | **Total** | | **₹789–1,067** |

All components are available on Amazon.in, Robu.in, or local electronics shops.

---

## Wiring Table

| MPU6050 Pin | → ESP32 Pin | Notes |
|-------------|-------------|-------|
| VCC | 3V3 | Use the 3.3 V rail — safe for the GY-521 module |
| GND | GND | Common ground |
| SDA | GPIO 21 | I2C data |
| SCL | GPIO 22 | I2C clock |

| SOS Button Terminal | → ESP32 Pin | Notes |
|---------------------|-------------|-------|
| Terminal A | GPIO 25 | Configured as INPUT_PULLUP |
| Terminal B | GND | Press = LOW signal |

| LED | → ESP32 Pin | Notes |
|-----|-------------|-------|
| Anode (+, long leg) | GPIO 26 via 220 Ω resistor | Current-limiting resistor required |
| Cathode (−, short leg) | GND | Common ground |

---

## Breadboard Layout

```
                        ESP32 DevKit
                    ┌─────────────────┐
              3V3 ──┤ 3V3         VIN ├
              GND ──┤ GND         GND ├── GND bus
                    ┤ GPIO 15         ├
                    ┤ GPIO 2          ├
                    ┤ GPIO 4          ├
                    ┤ GPIO 16         ├
                    ┤ GPIO 17         ├
                    ┤ GPIO 5          ├
                    ┤ GPIO 18         ├
                    ┤ GPIO 19         ├
          I2C SDA ──┤ GPIO 21         ├
                    ┤ GPIO 3  (RX)    ├
                    ┤ GPIO 1  (TX)    ├
          I2C SCL ──┤ GPIO 22         ├
                    ┤ GPIO 23         ├
       SOS Button ──┤ GPIO 25         ├
        LED (220Ω)──┤ GPIO 26         ├
                    ┤ GPIO 27         ├
                    └────────USB──────┘

  MPU6050 (GY-521)
  ┌──────────────┐
  │  VCC ────────│──── ESP32 3V3
  │  GND ────────│──── ESP32 GND
  │  SCL ────────│──── ESP32 GPIO 22
  │  SDA ────────│──── ESP32 GPIO 21
  │  XDA         │    (unused)
  │  XCL         │    (unused)
  │  AD0         │    (leave floating or GND for address 0x68)
  │  INT         │    (unused in this prototype)
  └──────────────┘

  SOS Button (4-pin tactile)
  ┌───┐
  │ A │──── ESP32 GPIO 25
  │ B │──── GND bus
  └───┘

  LED Circuit
  GPIO 26 ───[220Ω]───(Anode +)LED(Cathode −)─── GND
```

---

## Pre-Power-On Wiring Checklist

Before connecting USB power, verify:

- [ ] MPU6050 VCC goes to **3.3 V**, NOT 5 V (the ESP32 GPIOs are 3.3 V)
- [ ] SDA and SCL are on the correct GPIO pins (21, 22)
- [ ] The SOS button has one terminal on GPIO 25 and the other on GND
- [ ] The LED has a **220 Ω resistor** in series (never connect directly!)
- [ ] LED polarity is correct: long leg (anode) toward GPIO, short leg toward GND
- [ ] No exposed wire strands are touching adjacent breadboard rows
- [ ] The ESP32 is oriented correctly — USB port facing outward
- [ ] **No GPIO pin is connected to 5 V** (the VIN pin is only for power input)

---

## Power & Electrical Safety Notes

| ⚠️ Rule | Why |
|---------|-----|
| Never connect an ESP32 GPIO to 5 V | GPIOs are 3.3 V tolerant only — 5 V will damage the chip |
| Always use a current-limiting resistor with LEDs | Without it, excessive current can damage both the LED and the GPIO |
| Use the 3V3 pin for the MPU6050 | The GY-521 module has an on-board regulator, but 3.3 V is safer for the I2C lines |
| Don't power motors or buzzers directly from GPIO | Use a transistor/MOSFET driver for loads > 12 mA |
| Don't leave the prototype unattended while powered | This is a breadboard prototype with exposed conductors |

---

## Arduino IDE Setup

### 1. Install Arduino IDE
Download from https://www.arduino.cc/en/software (v2.x recommended).

### 2. Add ESP32 Board Support
1. Open **File → Preferences**
2. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Tools → Board → Board Manager**
4. Search "esp32" and install **"esp32" by Espressif Systems** (v2.x or v3.x)

### 3. Select Your Board
- **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
- **Tools → Port** → select the COM port showing your ESP32

### 4. Configure the Firmware
```bash
cd hardware/esp32-fall-sos/DailyMind_IMU_SOS/
cp config.h.example config.h
```
Edit `config.h` and fill in:
- Your Wi-Fi SSID and password
- Your DailyMind backend URL
- A random device API key (must match the server's `HARDWARE_DEVICE_KEY` env var)

### 5. Upload
1. Open `DailyMind_IMU_SOS.ino` in the Arduino IDE
2. Click **Upload** (→ button)
3. Open **Tools → Serial Monitor** at 115200 baud

---

## Testing Procedure

### Test 1: Sensor Only (No Network)
Set `DEBUG_SERIAL 1` in config.h. In the Serial Monitor you should see:
```
[IMU] MPU6050 detected (WHO_AM_I = 0x68)
[IMU] MPU6050 initialised successfully.
[IMU] accel=1.00g  gyro=0.5°/s  state=0
```
- Tilt the breadboard → acceleration values change
- Tap sharply → acceleration spikes above 2 g
- Press the SOS button → `[SOS] Button pressed!` appears once per press

### Test 2: Button Debounce
Press and release the button rapidly 5 times. You should see exactly 5 `[SOS]` messages (not more from bouncing).

### Test 3: Network Connectivity
With valid Wi-Fi credentials:
```
[WIFI] Connected — IP: 192.168.x.x
[NET] Sending device_status event (seq 1)...
[NET] Event delivered (HTTP 201).
```

### Test 4: Fall Detection
Hold the board flat, then drop it onto a soft surface from ~30 cm:
```
[FALL] Candidate spike detected.
[FALL] Suspected fall confirmed (post-impact inactivity).
```
The event is labeled "suspected_fall" — never "confirmed fall".

### Test 5: Network Failure
Disconnect Wi-Fi (turn off router). Press SOS:
```
[NET] Cannot send — not connected to Wi-Fi.
```
The LED gives rapid blinks (failure feedback). Reconnect Wi-Fi, and the next event should succeed.

---

## Event Types

| Event | Trigger | Sensor Data |
|-------|---------|-------------|
| `sos_button` | Physical button press | `null` (not sensor-based) |
| `suspected_fall` | Accel spike + post-impact inactivity | Accel & gyro magnitude |
| `sensor_fault` | MPU6050 not responding on I2C | `null` |
| `device_status` | Device boot / periodic health | `null` |

---

## Known Limitations

1. **Not medically validated** — thresholds are experimental and will produce false positives/negatives.
2. **No battery** — requires USB power. A LiPo battery + charge board could be added.
3. **No persistent event queue** — if the network is down, events are not stored and retried later.
4. **TLS certificate not verified** — `setInsecure()` is used for prototype simplicity.
5. **Single-threaded** — sensor reading, network I/O, and button handling share one core.
6. **Clock is not NTP-synced** — timestamps are `millis()` uptime, not wall-clock UTC.
