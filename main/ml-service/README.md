# ML Service — Machine Fault Detection

FastAPI microservice that trains and serves the machine condition
classification model (`normal` / `low` / `moderate` / `high`) from live
Voltage, Current, Temperature and Vibration readings.

## Setup

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

## 1. Analyze the dataset (read-only)

```bash
python training/analyze_dataset.py
```

Prints row/column counts, dtypes, missing/duplicate checks, class balance,
descriptive statistics, IQR outlier counts, correlations and per-class means.
Never modifies `dataset/industrial_motor_sensor_data_8000.csv`.

## 2. Train the model

```bash
python train.py
```

This will:

1. Load and clean the dataset (drop invalid rows only in memory).
2. Stratified 80/20 train/test split.
3. Scale features with `StandardScaler`.
4. Train Logistic Regression, Random Forest, SVM and XGBoost.
5. Evaluate each with accuracy, precision/recall/F1 (macro + weighted) and a
   confusion matrix.
6. Build a soft-voting ensemble (Random Forest + XGBoost + SVM).
7. Save:
   - `models/machine_condition_model.pkl` — the production ensemble model
   - `models/preprocessor.pkl` — the fitted scaler + label encoder
   - `models/model_metadata.json` — metrics, classes, dataset size, etc.

## 3. Run the prediction API

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

- `GET /health` → `{"status": "healthy", "modelLoaded": true}`
- `POST /predict` → see root README's API documentation section.

## 4. Run a single prediction from the CLI

```bash
python predict.py --voltage 420.5 --current 15.2 --temperature 54.3 --vibration 4.8
```

## 5. Tests

```bash
pytest tests/ -v
```

## Notes

- The four input features are **voltage, current, temperature, vibration**
  only — no pressure, no RPM (not present in the dataset).
- Labels (`normal`/`low`/`moderate`/`high`) are treated strictly as
  **machine condition/stage**, not as named fault types (e.g. "bearing
  fault"), since the dataset does not document that mapping.
