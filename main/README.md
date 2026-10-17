# Machine Fault Detection & Predictive Maintenance System

An end-to-end IoT system that monitors an industrial motor in real time and
predicts its condition — **normal / low / moderate / high** — from live
Voltage, Current, Temperature and Vibration readings using a trained machine
learning ensemble.

```
Physical Motor → ESP32 + Sensors → Wi-Fi → Backend API → MongoDB
                                              ↓
                                        ML Prediction
                                              ↓
                                    Socket.IO (real-time)
                                              ↓
                                     React Dashboard
                                (status, charts, alerts, history, CSV export)
```

## 1. Project Overview

The system ingests sensor readings from an ESP32 (or the test-mode
simulator built into the sketch), stores them in MongoDB, sends them to a
FastAPI ML service for a live condition prediction, and broadcasts the
result to a React dashboard over Socket.IO — with historical data,
CSV export, analytics, and a condition-change alert history.

The ML labels (`normal`, `low`, `moderate`, `high`) are treated strictly as
**machine condition/stage**, never as named fault types (e.g. "bearing
fault" or "overheating") — the dataset does not document that mapping, so
the UI and API never claim it either.

## 2. Features

- Real-time dashboard: live status card, sensor cards (V/A/°C/mm-s), class
  probability bars, machine health overview (ESP32 / Backend / DB / ML
  connectivity).
- Live rolling charts (1 min / 5 min / 15 min / 1 hour windows) capped to a
  bounded number of points — no unbounded browser memory growth.
- Historical data table with pagination, date-range, condition and
  machine-ID filters.
- CSV export (all data, filtered, or date-ranged) generated server-side.
- Analytics page: per-condition counts, condition distribution chart,
  average/min/max per sensor.
- Alert system: a prominent banner whenever the ML prediction is `HIGH`,
  plus a full alert history of every condition transition.
- Settings page for backend URL, machine ID, live update interval and chart
  window — no secrets exposed to the browser.
- ESP32 sketch with Wi-Fi auto-reconnect, configurable send interval, and a
  clearly separated `TEST_MODE` (simulated values) vs real sensor mode.

## 3. Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Socket.IO client, React Router |
| Backend | Node.js, Express, Socket.IO, Mongoose |
| ML Service | Python, FastAPI, scikit-learn, XGBoost, pandas, joblib |
| Database | MongoDB |
| Device | ESP32 (Arduino), HTTPClient, ArduinoJson |

## 4. Folder Structure

```
main/
├── dataset/                      industrial_motor_sensor_data_8000.csv (read-only)
├── ml-service/
│   ├── data/
│   ├── models/                   machine_condition_model.pkl, preprocessor.pkl, model_metadata.json
│   ├── training/                 analyze_dataset.py, preprocess.py
│   ├── tests/
│   ├── app.py                    FastAPI prediction service
│   ├── train.py                  training pipeline
│   ├── predict.py                CLI prediction helper
│   └── requirements.txt
├── backend/
│   ├── src/
│   │   ├── config/                env.js, db.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/                SensorReading, AlertHistory
│   │   ├── services/              mlService, socketService, deviceStatusService
│   │   ├── middleware/
│   │   ├── utils/                 csvExport
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/            layout, dashboard, charts, common
│       ├── pages/                 Dashboard, LiveMonitoring, HistoricalData, Analytics, Alerts, Settings
│       ├── services/               api.js, socket.js, settingsStore.js
│       ├── context/                SettingsContext, LiveDataContext
│       └── utils/
├── esp32/
│   └── esp32_sensor_client/esp32_sensor_client.ino
└── README.md
```

## 5. Dataset

`dataset/industrial_motor_sensor_data_8000.csv` — 8000 rows, 5 columns,
perfectly balanced across 4 classes (2000 rows each), no missing values, no
duplicates. Columns are mapped internally as:

| CSV column | Internal name |
|---|---|
| Voltage (V) | `voltage` |
| Current (A) | `current` |
| Temperature (°C) | `temperature` |
| Vibration (mm/s) | `vibration` |
| Label | `label` (`normal` / `low` / `moderate` / `high`) |

Run `python ml-service/training/analyze_dataset.py` for the full EDA report
(dtypes, missing/duplicate checks, outliers, correlations, per-class means).
The dataset is never modified by any script.

## 6. ML Workflow & Model Training

See [ml-service/README.md](ml-service/README.md) for full details. Summary:

```bash
cd ml-service
pip install -r requirements.txt
python train.py
```

Trains Logistic Regression, Random Forest, SVM and XGBoost, evaluates each
(accuracy, precision/recall/F1 macro + weighted, confusion matrix), then
builds a **soft-voting ensemble** (Random Forest + XGBoost + SVM) as the
production model, saved to `ml-service/models/`.

On this dataset the ensemble achieves ~99.9% accuracy / F1 (macro & weighted)
on a held-out stratified 20% test split — see `models/model_metadata.json`
after training for the exact run's numbers.

## 7. Backend Setup

```bash
cd backend
npm install
cp .env.example .env     # edit MONGODB_URI / ML_SERVICE_URL if needed
npm run dev              # http://localhost:5000
```

## 8. ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
python train.py                              # one-time (or whenever the dataset changes)
uvicorn app:app --host 0.0.0.0 --port 8000    # http://localhost:8000
```

## 9. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env     # edit VITE_BACKEND_URL if needed
npm run dev               # http://localhost:5173
```

## 10. MongoDB Setup

Run a local MongoDB instance (or point `MONGODB_URI` at Atlas / any hosted
instance):

```bash
mongod --dbpath <your-data-dir> --port 27017
```

The backend connects using `MONGODB_URI` from `backend/.env` — never
hard-coded. Two collections are used: `sensorreadings` and `alerthistories`
(created automatically by Mongoose on first write).

## 11. ESP32 Setup

See [esp32/README.md](esp32/README.md). Quick summary:

1. Open `esp32/esp32_sensor_client/esp32_sensor_client.ino` in the Arduino
   IDE (ESP32 board package + `ArduinoJson` library installed).
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_URL` to your computer's LAN
   IP, e.g. `http://192.168.1.10:5000/api/sensor-data` (never `localhost`).
3. Flash and open the Serial Monitor at 115200 baud.

### ESP32 Test Mode

`TEST_MODE = true` (default) — `readVoltage()`, `readCurrent()`,
`readTemperature()`, `readVibration()` return simulated values in realistic
ranges, purely to verify Wi-Fi → backend → ML → dashboard connectivity.
Every send is logged as `[TEST MODE]` over Serial.

### ESP32 Real Sensor Mode

`TEST_MODE = false` — the same four functions read from the analog pins
wired to your actual sensors. Update `VOLTAGE_SENSOR_PIN`,
`CURRENT_SENSOR_PIN`, `TEMPERATURE_SENSOR_PIN`, `VIBRATION_SENSOR_PIN` and
the scaling factors for your specific sensor hardware/calibration. No other
code changes — the backend/ML/dashboard interface is identical in both
modes.

## 12. API Documentation

### Backend — `http://localhost:5000`

**POST `/api/sensor-data`** — ingest a reading (ESP32 → backend → ML → DB → Socket.IO)

```json
// Request
{ "voltage": 420.5, "current": 15.2, "temperature": 54.3, "vibration": 4.8 }

// 201 Response
{
  "success": true,
  "data": {
    "voltage": 420.5, "current": 15.2, "temperature": 54.3, "vibration": 4.8,
    "prediction": "moderate", "confidence": 0.87,
    "probabilities": { "normal": 0.03, "low": 0.08, "moderate": 0.87, "high": 0.02 }
  }
}
```

**GET `/api/sensor-data`** / **`/api/sensor-data/history`** — paginated, filterable list
Query params: `page`, `limit`, `machineId`, `prediction`, `startDate`, `endDate`

**GET `/api/sensor-data/latest?machineId=MOTOR-01`** — most recent reading + device connectivity

**GET `/api/sensor-data/export`** — CSV download. Same filters as above.

**GET `/api/sensor-data/stats`** — total/condition counts + avg/min/max per sensor

**GET `/api/alerts`** — condition-transition history (`fromStatus → toStatus`)

**GET `/api/device-status?machineId=MOTOR-01`** — `{ connected, lastSeen, secondsSinceLastSeen }`

**GET `/api/health`**

```json
{ "backend": "connected", "database": "connected", "mlService": "connected", "mlModelLoaded": true }
```

**Socket.IO events (client subscribes):**
- `sensor:update` — new reading + prediction, emitted on every ingest
- `alert:new` — emitted on every condition transition
- `device:status` — connectivity map, emitted every 5s

### ML Service — `http://localhost:8000`

**POST `/predict`**

```json
// Request
{ "voltage": 420.5, "current": 15.2, "temperature": 54.3, "vibration": 4.8 }

// 200 Response
{
  "prediction": "moderate", "confidence": 0.87,
  "probabilities": { "normal": 0.03, "low": 0.08, "moderate": 0.87, "high": 0.02 }
}
```

Invalid/out-of-range/non-finite input → `422` with a Pydantic validation
error body. Model not loaded → `503`.

**GET `/health`** → `{ "status": "healthy", "modelLoaded": true }`

## 13. How to Run the Project (step by step, all commands)

Open **four terminals**, one per service, and start them **in this order**
(each one depends on the previous being up): **MongoDB → ML service →
Backend → Frontend**. Setup steps (`pip install`, `npm install`, `.env`
copy, `train.py`) only need to be run once.

### Terminal 1 — MongoDB

```powershell
mongod --dbpath "C:\projects\MFD_project\mongodb-data" --port 27017
```

Use any data directory you like; create it first if it doesn't exist.

### Terminal 2 — ML Service (FastAPI)

```powershell
cd C:\projects\MFD_project\main\ml-service
pip install -r requirements.txt
python train.py
uvicorn app:app --host 0.0.0.0 --port 8000
```

`train.py` trains and saves the model — only re-run it if the dataset
changes. Once `models/machine_condition_model.pkl` exists you can skip
straight to the `uvicorn` command on future runs.

### Terminal 3 — Backend (Node/Express)

```powershell
cd C:\projects\MFD_project\main\backend
npm install
Copy-Item .env.example .env
npm run dev
```

Runs at `http://localhost:5000`. Edit `.env` if your Mongo/ML URLs differ
from the defaults.

### Terminal 4 — Frontend (React/Vite)

```powershell
cd C:\projects\MFD_project\main\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Runs at `http://localhost:5173` — open this in your browser.

### ESP32 (optional — or use the curl command below to simulate one)

Edit `WIFI_SSID`, `WIFI_PASSWORD` and `SERVER_URL` in
`esp32/esp32_sensor_client/esp32_sensor_client.ino` (`SERVER_URL` must be
your computer's LAN IP, e.g. `http://192.168.1.10:5000/api/sensor-data` —
never `localhost`), then flash it from the Arduino IDE. It starts in
`TEST_MODE = true`, sending simulated readings every `SEND_INTERVAL` ms.

### Quick test without hardware

Simulate one ESP32 reading from any terminal and watch it appear instantly
on the dashboard:

```powershell
curl.exe -X POST http://localhost:5000/api/sensor-data -H "Content-Type: application/json" -d '{\"voltage\":420.5,\"current\":15.2,\"temperature\":54.3,\"vibration\":4.8}'
```

(macOS/Linux: use `curl` with single quotes around the JSON body instead of
escaped double quotes.)

### Stopping everything

`Ctrl+C` in each terminal window.

## 14. Testing

```bash
# Backend (Jest + Supertest; sensor API, validation, DB insertion, ML mocking)
cd backend && npm test

# ML service (pytest; model loading, prediction, invalid input)
cd ml-service && pytest tests/ -v

# Frontend (Vitest + Testing Library; live updates, status rendering)
cd frontend && npm test
```

## 15. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Dashboard shows "Backend: DISCONNECTED" | Backend not running, or `VITE_BACKEND_URL` wrong in `frontend/.env` |
| Dashboard shows "ML Service: DISCONNECTED" | ML service not running, or model not trained (`python train.py`) |
| `POST /api/sensor-data` returns 503 | ML service unreachable — start `uvicorn app:app` |
| `POST /api/sensor-data` returns 500 with a DB error | MongoDB not running / wrong `MONGODB_URI` |
| ESP32 can't reach backend | `SERVER_URL` uses `localhost` (invalid from the device) — use your PC's LAN IP; confirm same Wi-Fi network and firewall allows port 5000 |
| "ESP32: DISCONNECTED" even though it's sending | No reading received within `DEVICE_OFFLINE_THRESHOLD_SECONDS` (default 15s) — check `SEND_INTERVAL` on the ESP32 |
| `/predict` returns 422 | Input out of the configured sanity range (see `VALID_RANGES` in `ml-service/app.py`) or missing/non-numeric field |

## 16. Deployment Notes

- Set real `MONGODB_URI`, `ML_SERVICE_URL`, and `CORS_ORIGIN` via environment
  variables on your hosting platform — never commit `.env` files.
- Run the ML service behind a process manager (`uvicorn ... --workers 2`) or
  containerize it; the backend calls it over HTTP so it can be deployed
  independently.
- The frontend is a static Vite build (`npm run build` → `frontend/dist/`)
  deployable to any static host, with `VITE_BACKEND_URL` pointing at your
  deployed backend.
- For the ESP32 to reach a cloud-hosted backend, use its public HTTPS URL
  and add TLS support (`WiFiClientSecure` + `HTTPClient`) instead of the
  plain-HTTP example in this repo.

## 17. Important ML/Data Rules Followed

- No synthetic training data — the model is trained exclusively on
  `dataset/industrial_motor_sensor_data_8000.csv`.
- No fabricated sensor values, fault types, or invented features (no
  pressure, no RPM — not present in the source data).
- No hard-coded thresholds standing in for the model: the machine condition
  shown on the dashboard is always the live ML prediction.
