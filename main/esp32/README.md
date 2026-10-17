# ESP32 Sensor Client

Arduino sketch that reads Voltage, Current, Temperature and Vibration from an
industrial motor and POSTs them to the backend for ML-based condition
prediction.

## Requirements

- Arduino IDE (or PlatformIO) with the **ESP32 board package** installed.
- Libraries (Arduino Library Manager):
  - `ArduinoJson` (by Benoit Blanchon)
  - `HTTPClient` and `WiFi` are bundled with the ESP32 core.

## Configuration

Open `esp32_sensor_client/esp32_sensor_client.ino` and edit the top section:

```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "http://192.168.1.10:5000/api/sensor-data";
const unsigned long SEND_INTERVAL = 5000; // ms
const char* MACHINE_ID    = "MOTOR-01";
bool TEST_MODE = true;
```

- `SERVER_URL` must point at your computer's **LAN IP address** (find it with
  `ipconfig` on Windows / `ifconfig` on macOS/Linux), on the same Wi-Fi
  network as the ESP32. Never use `localhost` or `127.0.0.1` here — that
  refers to the ESP32 itself.
- `SEND_INTERVAL` controls how often readings are sent.

## TEST MODE vs REAL SENSOR MODE

- **`TEST_MODE = true`**: `readVoltage()`, `readCurrent()`, `readTemperature()`,
  `readVibration()` return simulated values in realistic ranges, purely to
  verify Wi-Fi + backend + ML + dashboard connectivity end-to-end. These are
  clearly logged as `[TEST MODE]` over Serial and are never claimed to be
  real sensor measurements.
- **`TEST_MODE = false`**: the same four functions read from the analog pins
  wired to your actual sensors (voltage transformer/divider, current sensor
  such as ACS712, temperature probe, vibration/accelerometer). Update the
  pin numbers and scaling factors (`analogRead(...) * scale`) to match your
  specific sensor hardware and calibration.

Because both modes share the same function signatures, no other code (Wi-Fi,
HTTP POST, JSON payload, backend, ML service) needs to change when you move
from testing to real sensors.

## Flashing

1. Select your ESP32 board and COM port in the Arduino IDE.
2. Install the `ArduinoJson` library if not already installed.
3. Upload the sketch.
4. Open the Serial Monitor at `115200` baud to watch connection and send logs.

## Payload sent

```json
{
  "voltage": 420.5,
  "current": 15.2,
  "temperature": 54.3,
  "vibration": 4.8,
  "machineId": "MOTOR-01"
}
```
