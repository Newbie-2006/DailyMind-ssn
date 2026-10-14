// ============================================================================
// DailyMind IMU + SOS — ESP32 Firmware
// ============================================================================
// Hardware:  ESP32 DevKit  +  MPU6050  +  Tactile push button  +  LED
// Purpose:   Detect suspected falls via IMU, send SOS on button press,
//            and transmit events to the DailyMind backend over HTTPS.
//
// IMPORTANT: This is a college engineering prototype.
//            It is NOT a medically certified fall-detection product.
// ============================================================================

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "config.h"   // ← copy config.h.example → config.h and fill in values

// ---- MPU6050 register addresses -------------------------------------------
#define MPU6050_ADDR        0x68
#define MPU6050_WHO_AM_I    0x75
#define MPU6050_PWR_MGMT_1  0x6B
#define MPU6050_ACCEL_XOUT  0x3B
#define MPU6050_GYRO_XOUT   0x43

// ---- Global state ----------------------------------------------------------
static bool sensorOk      = false;
static uint32_t sequence   = 0;

// Fall-detection state machine
enum FallState { IDLE, CANDIDATE, CONFIRMED, COOLDOWN };
static FallState fallState        = IDLE;
static unsigned long candidateTs  = 0;
static unsigned long cooldownTs   = 0;

// SOS button
static unsigned long lastBtnPress = 0;
static bool lastBtnState          = HIGH;  // INPUT_PULLUP → default HIGH

// Event throttle
static unsigned long lastEventSent = 0;

// ---- Forward declarations --------------------------------------------------
void initMPU6050();
bool readMPU6050(float &ax, float &ay, float &az, float &gx, float &gy, float &gz);
float magnitude3(float x, float y, float z);
void connectWiFi();
bool sendEvent(const char* eventType, float accelMag, float gyroMag);
void blinkLED(int count, int onMs);

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== DailyMind IMU + SOS ===");

  // LED output
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);

  // SOS button with internal pull-up (pressed = LOW)
  pinMode(PIN_SOS_BUTTON, INPUT_PULLUP);

  // I2C for MPU6050
  Wire.begin(PIN_SDA, PIN_SCL);
  initMPU6050();

  // Wi-Fi
  connectWiFi();

  // Send a device_status event so the backend knows we booted
  sendEvent("device_status", 0, 0);

  Serial.println("Setup complete.  Entering main loop.\n");
}

// ============================================================================
// LOOP
// ============================================================================
void loop() {
  // ---- 1. Read SOS button (always, independent of fall detection) ----------
  bool btnNow = digitalRead(PIN_SOS_BUTTON);
  if (btnNow == LOW && lastBtnState == HIGH) {
    // Falling edge — button just pressed
    if (millis() - lastBtnPress > SOS_DEBOUNCE_MS) {
      lastBtnPress = millis();
      Serial.println("[SOS] Button pressed!");
      blinkLED(3, 100);
      sendEvent("sos_button", 0, 0);
    }
  }
  lastBtnState = btnNow;

  // ---- 2. Read IMU ---------------------------------------------------------
  float ax, ay, az, gx, gy, gz;
  if (!sensorOk) {
    // Try to re-initialise periodically
    static unsigned long lastRetry = 0;
    if (millis() - lastRetry > 5000) {
      lastRetry = millis();
      initMPU6050();
      if (!sensorOk) {
        sendEvent("sensor_fault", 0, 0);
      }
    }
    delay(50);
    return;
  }

  if (!readMPU6050(ax, ay, az, gx, gy, gz)) {
    delay(50);
    return;
  }

  float accelMag = magnitude3(ax, ay, az);
  float gyroMag  = magnitude3(gx, gy, gz);

#if DEBUG_SERIAL
  static unsigned long lastDbg = 0;
  if (millis() - lastDbg > 500) {
    lastDbg = millis();
    Serial.printf("[IMU] accel=%.2fg  gyro=%.1f°/s  state=%d\n",
                  accelMag, gyroMag, (int)fallState);
  }
#endif

  // ---- 3. Fall-detection state machine -------------------------------------
  unsigned long now = millis();

  switch (fallState) {
    case IDLE:
      if (accelMag > FALL_ACCEL_THRESHOLD_G && gyroMag > FALL_GYRO_THRESHOLD_DPS) {
        fallState   = CANDIDATE;
        candidateTs = now;
        Serial.println("[FALL] Candidate spike detected.");
      }
      break;

    case CANDIDATE:
      // Wait for the inactivity window
      if (now - candidateTs > FALL_INACTIVITY_WINDOW_MS) {
        if (accelMag < FALL_INACTIVITY_THRESHOLD_G) {
          // Person appears motionless after the spike → suspected fall
          fallState  = CONFIRMED;
          Serial.println("[FALL] Suspected fall confirmed (post-impact inactivity).");
          blinkLED(5, 80);
          sendEvent("suspected_fall", accelMag, gyroMag);
          fallState  = COOLDOWN;
          cooldownTs = now;
        } else {
          // Person is still moving → false alarm
          fallState = IDLE;
          Serial.println("[FALL] Candidate dismissed (still moving).");
        }
      }
      break;

    case CONFIRMED:
      // Handled inline above; should not linger here.
      fallState  = COOLDOWN;
      cooldownTs = now;
      break;

    case COOLDOWN:
      if (now - cooldownTs > FALL_COOLDOWN_MS) {
        fallState = IDLE;
        Serial.println("[FALL] Cooldown expired, returning to IDLE.");
      }
      break;
  }

  // ---- 4. Reconnect Wi-Fi if dropped --------------------------------------
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection lost. Reconnecting...");
    connectWiFi();
  }

  delay(20);  // ~50 Hz sample rate
}

// ============================================================================
// MPU6050 helpers
// ============================================================================
void initMPU6050() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_WHO_AM_I);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)1);

  if (Wire.available()) {
    uint8_t whoAmI = Wire.read();
    if (whoAmI == 0x68 || whoAmI == 0x98) {
      Serial.printf("[IMU] MPU6050 detected (WHO_AM_I = 0x%02X)\n", whoAmI);
    } else {
      Serial.printf("[IMU] Unexpected WHO_AM_I: 0x%02X\n", whoAmI);
      sensorOk = false;
      return;
    }
  } else {
    Serial.println("[IMU] No response on I2C — check wiring!");
    sensorOk = false;
    return;
  }

  // Wake the sensor (clear sleep bit)
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_PWR_MGMT_1);
  Wire.write(0x00);
  Wire.endTransmission();

  sensorOk = true;
  Serial.println("[IMU] MPU6050 initialised successfully.");
}

bool readMPU6050(float &ax, float &ay, float &az,
                 float &gx, float &gy, float &gz) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_ACCEL_XOUT);
  if (Wire.endTransmission(false) != 0) return false;
  Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)14);
  if (Wire.available() < 14) return false;

  int16_t rawAx = (Wire.read() << 8) | Wire.read();
  int16_t rawAy = (Wire.read() << 8) | Wire.read();
  int16_t rawAz = (Wire.read() << 8) | Wire.read();
  /* int16_t temp = */ (Wire.read() << 8) | Wire.read();  // skip temperature
  int16_t rawGx = (Wire.read() << 8) | Wire.read();
  int16_t rawGy = (Wire.read() << 8) | Wire.read();
  int16_t rawGz = (Wire.read() << 8) | Wire.read();

  // Default full-scale: ±2 g (16384 LSB/g), ±250 °/s (131 LSB/°/s)
  ax = rawAx / 16384.0;
  ay = rawAy / 16384.0;
  az = rawAz / 16384.0;
  gx = rawGx / 131.0;
  gy = rawGy / 131.0;
  gz = rawGz / 131.0;
  return true;
}

float magnitude3(float x, float y, float z) {
  return sqrt(x * x + y * y + z * z);
}

// ============================================================================
// Wi-Fi
// ============================================================================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WIFI] Connecting");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected — IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Failed to connect. Will retry in main loop.");
  }
}

// ============================================================================
// HTTPS event posting
// ============================================================================
bool sendEvent(const char* eventType, float accelMag, float gyroMag) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[NET] Cannot send — not connected to Wi-Fi.");
    digitalWrite(PIN_LED, LOW);
    return false;
  }

  // Throttle: don't flood the backend
  unsigned long now = millis();
  if (now - lastEventSent < MIN_EVENT_INTERVAL_MS && lastEventSent != 0) {
    Serial.println("[NET] Throttled — too soon since last event.");
    return false;
  }

  sequence++;

  // Build JSON payload
  char payload[512];
  snprintf(payload, sizeof(payload),
    "{"
      "\"deviceId\":\"%s\","
      "\"eventType\":\"%s\","
      "\"timestamp\":\"%lu\","
      "\"sequence\":%u,"
      "\"data\":{"
        "\"accelerationMagnitude\":%.3f,"
        "\"angularVelocityMagnitude\":%.1f"
      "}"
    "}",
    DEVICE_ID, eventType, now, sequence, accelMag, gyroMag);

  Serial.printf("[NET] Sending %s event (seq %u)...\n", eventType, sequence);

  // Retry with bounded exponential backoff
  for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
    WiFiClientSecure client;
    client.setInsecure();  // Accept any TLS cert (prototype only)

    HTTPClient http;
    String url = String(BACKEND_URL) + "/api/hardware/events";
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", DEVICE_API_KEY);
    http.setTimeout(10000);

    int httpCode = http.POST(payload);

    if (httpCode == 200 || httpCode == 201) {
      Serial.printf("[NET] Event delivered (HTTP %d).\n", httpCode);
      lastEventSent = millis();
      blinkLED(1, 200);  // Short blink = success
      http.end();
      return true;
    }

    Serial.printf("[NET] Attempt %d failed (HTTP %d). ", attempt + 1, httpCode);
    http.end();

    if (attempt < MAX_RETRIES - 1) {
      unsigned long backoff = RETRY_BASE_MS * (1 << attempt);
      Serial.printf("Retrying in %lu ms.\n", backoff);
      delay(backoff);
    } else {
      Serial.println("All retries exhausted.");
    }
  }

  // Failure feedback: rapid blinks
  blinkLED(6, 50);
  return false;
}

// ============================================================================
// LED feedback
// ============================================================================
void blinkLED(int count, int onMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_LED, HIGH);
    delay(onMs);
    digitalWrite(PIN_LED, LOW);
    if (i < count - 1) delay(onMs);
  }
}
