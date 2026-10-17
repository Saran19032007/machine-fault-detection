/*
  esp32_sensor_client.ino

  IoT Machine Fault Detection - ESP32 Sensor Client

  Reads Voltage, Current, Temperature and Vibration and sends them as JSON
  to the backend over HTTP POST. Includes:
    - Wi-Fi connect + automatic reconnect
    - TEST_MODE (simulated values) vs REAL SENSOR MODE (actual sensor reads)
    - Configurable send interval
    - Basic HTTP error handling

  IMPORTANT:
    - This sketch does NOT invent an RPM reading; only the four features the
      trained ML model actually uses are sent: voltage, current, temperature,
      vibration.
    - Do NOT hard-code "localhost" as SERVER_URL — an ESP32 is a separate
      device on the network and must target your computer's LAN IP address,
      e.g. http://192.168.1.10:5000/api/sensor-data
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =====================================================================
// CONFIGURATION - edit these for your network / deployment
// =====================================================================

const char* WIFI_SSID     = "SARAN";
const char* WIFI_PASSWORD = "saran1903";

// Point this at your backend's LAN IP address (not localhost / 127.0.0.1),
// since the ESP32 is a separate device on the network.
const char* SERVER_URL = "http://10.1.74.41:5000/api/sensor-data";

// Milliseconds between sensor readings sent to the backend.
const unsigned long SEND_INTERVAL = 5000;

// Optional machine identifier (multi-machine support on the backend).
const char* MACHINE_ID = "MOTOR-01";

// -----------------------------------------------------------------------
// TEST_MODE = true  -> generate simulated values purely to test connectivity
// TEST_MODE = false -> read values from the actual sensor wiring below
// -----------------------------------------------------------------------
bool TEST_MODE = true;

// =====================================================================
// REAL SENSOR PIN MAPPING (used only when TEST_MODE = false)
// Replace with your actual sensor wiring / driver calls.
// =====================================================================
const int VOLTAGE_SENSOR_PIN     = 34; // e.g. ZMPT101B analog pin
const int CURRENT_SENSOR_PIN     = 35; // e.g. ACS712 analog pin
const int TEMPERATURE_SENSOR_PIN = 32; // e.g. LM35 / thermocouple amp analog pin
const int VIBRATION_SENSOR_PIN   = 33; // e.g. accelerometer analog/interrupt pin

unsigned long lastSendTime = 0;

// =====================================================================
// WIFI CONNECTION
// =====================================================================

void connectWiFi() {
  Serial.print("[wifi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  const unsigned long WIFI_CONNECT_TIMEOUT = 20000;

  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt) < WIFI_CONNECT_TIMEOUT) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[wifi] Connected. IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[wifi] Failed to connect within timeout. Will retry in loop().");
  }
}

void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[wifi] Connection lost. Reconnecting...");
    connectWiFi();
  }
}

// =====================================================================
// SENSOR READING FUNCTIONS
//
// Each function has the SAME signature whether running in TEST_MODE or
// REAL SENSOR MODE, so the rest of the sketch (and any future backend/ML
// integration) never needs to change when real sensors are wired in.
// =====================================================================

float readVoltage() {
  if (TEST_MODE) {
    // Simulated value within the dataset's realistic range (200-480 V),
    // clearly marked as TEST DATA, not a real measurement.
    return random(2000, 4800) / 10.0;
  }
  // REAL SENSOR MODE: replace with your actual voltage sensor conversion.
  int raw = analogRead(VOLTAGE_SENSOR_PIN);
  return raw * (450.0 / 4095.0); // example scaling factor — calibrate for your sensor
}

float readCurrent() {
  if (TEST_MODE) {
    return random(0, 5000) / 100.0; // 0.00 - 50.00 A simulated
  }
  int raw = analogRead(CURRENT_SENSOR_PIN);
  return raw * (50.0 / 4095.0); // example scaling factor — calibrate for your sensor
}

float readTemperature() {
  if (TEST_MODE) {
    return random(300, 1200) / 10.0; // 30.0 - 120.0 C simulated
  }
  int raw = analogRead(TEMPERATURE_SENSOR_PIN);
  return raw * (150.0 / 4095.0); // example scaling factor — calibrate for your sensor
}

float readVibration() {
  if (TEST_MODE) {
    return random(0, 3000) / 100.0; // 0.00 - 30.00 mm/s simulated
  }
  int raw = analogRead(VIBRATION_SENSOR_PIN);
  return raw * (30.0 / 4095.0); // example scaling factor — calibrate for your sensor
}

// =====================================================================
// SEND SENSOR DATA
// =====================================================================

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[http] Skipping send — Wi-Fi not connected.");
    return;
  }

  float voltage     = readVoltage();
  float current      = readCurrent();
  float temperature  = readTemperature();
  float vibration     = readVibration();

  StaticJsonDocument<256> doc;
  doc["voltage"] = voltage;
  doc["current"] = current;
  doc["temperature"] = temperature;
  doc["vibration"] = vibration;
  doc["machineId"] = MACHINE_ID;

  String payload;
  serializeJson(doc, payload);

  Serial.print(TEST_MODE ? "[TEST MODE] " : "[REAL SENSOR MODE] ");
  Serial.print("Sending: ");
  Serial.println(payload);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    if (httpCode == 200 || httpCode == 201) {
      Serial.print("[http] Server accepted reading. Response: ");
      Serial.println(response);
    } else {
      Serial.print("[http] Server returned error status ");
      Serial.print(httpCode);
      Serial.print(": ");
      Serial.println(response);
    }
  } else {
    Serial.print("[http] POST failed, error: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}

// =====================================================================
// ARDUINO LIFECYCLE
// =====================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("========================================");
  Serial.println(" Machine Fault Detection - ESP32 Client");
  Serial.print(" Mode: ");
  Serial.println(TEST_MODE ? "TEST MODE (simulated values)" : "REAL SENSOR MODE");
  Serial.println("========================================");

  randomSeed(analogRead(0));
  connectWiFi();
}

void loop() {
  ensureWiFiConnected();

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    sendSensorData();
  }

  delay(50);
}
