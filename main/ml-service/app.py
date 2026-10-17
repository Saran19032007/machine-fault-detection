"""
FastAPI ML Prediction Service for Machine Fault Detection / Predictive Maintenance.

Loads the pre-trained soft-voting ensemble model (trained via train.py) and
serves real-time predictions over POST /predict.

Run:
    uvicorn app:app --host 0.0.0.0 --port 8000
"""

import math
import os

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "machine_condition_model.pkl")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")

# Sane physical bounds used only for INPUT VALIDATION (reject garbage payloads).
# These are intentionally wider than the training data range so real sensor
# noise/drift is not incorrectly rejected.
VALID_RANGES = {
    "voltage": (0.0, 1000.0),
    "current": (0.0, 200.0),
    "temperature": (-40.0, 300.0),
    "vibration": (0.0, 200.0),
}

app = FastAPI(
    title="Machine Fault Detection ML Service",
    description="Predicts machine condition (normal / low / moderate / high) "
    "from live voltage, current, temperature and vibration readings.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_scaler = None
_label_encoder = None
_feature_order = None
_load_error = None


def load_model_artifacts():
    global _model, _scaler, _label_encoder, _feature_order, _load_error
    try:
        _model = joblib.load(MODEL_PATH)
        preprocessor = joblib.load(PREPROCESSOR_PATH)
        _scaler = preprocessor["scaler"]
        _label_encoder = preprocessor["label_encoder"]
        _feature_order = preprocessor["feature_order"]
        _load_error = None
        print(f"[ml-service] Model loaded successfully from {MODEL_PATH}")
    except Exception as exc:  # noqa: BLE001
        _model = None
        _load_error = str(exc)
        print(f"[ml-service] WARNING: failed to load model artifacts: {exc}")


load_model_artifacts()


class SensorInput(BaseModel):
    voltage: float = Field(..., description="Voltage in volts (V)")
    current: float = Field(..., description="Current in amperes (A)")
    temperature: float = Field(..., description="Temperature in degrees Celsius (°C)")
    vibration: float = Field(..., description="Vibration in mm/s")

    @field_validator("voltage", "current", "temperature", "vibration")
    @classmethod
    def must_be_finite(cls, value: float, info):
        if value is None or math.isnan(value) or math.isinf(value):
            raise ValueError(f"{info.field_name} must be a finite number")
        return value

    @field_validator("voltage")
    @classmethod
    def validate_voltage(cls, value: float):
        lo, hi = VALID_RANGES["voltage"]
        if not (lo <= value <= hi):
            raise ValueError(f"voltage out of valid range [{lo}, {hi}]")
        return value

    @field_validator("current")
    @classmethod
    def validate_current(cls, value: float):
        lo, hi = VALID_RANGES["current"]
        if not (lo <= value <= hi):
            raise ValueError(f"current out of valid range [{lo}, {hi}]")
        return value

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, value: float):
        lo, hi = VALID_RANGES["temperature"]
        if not (lo <= value <= hi):
            raise ValueError(f"temperature out of valid range [{lo}, {hi}]")
        return value

    @field_validator("vibration")
    @classmethod
    def validate_vibration(cls, value: float):
        lo, hi = VALID_RANGES["vibration"]
        if not (lo <= value <= hi):
            raise ValueError(f"vibration out of valid range [{lo}, {hi}]")
        return value


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: dict


@app.get("/health")
def health():
    return {"status": "healthy" if _model is not None else "degraded", "modelLoaded": _model is not None}


@app.get("/")
def root():
    return {
        "service": "Machine Fault Detection ML Service",
        "modelLoaded": _model is not None,
        "docs": "/docs",
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: SensorInput):
    if _model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model not loaded. Run train.py first. ({_load_error})",
        )

    try:
        row = payload.model_dump()
        X = pd.DataFrame([[row[f] for f in _feature_order]], columns=_feature_order)
        X_scaled = _scaler.transform(X)

        pred_encoded = _model.predict(X_scaled)[0]
        prediction = _label_encoder.inverse_transform([pred_encoded])[0]

        proba = _model.predict_proba(X_scaled)[0]
        class_names = _label_encoder.classes_
        probabilities = {cls: round(float(p), 4) for cls, p in zip(class_names, proba)}
        confidence = round(float(max(proba)), 4)

        return PredictionResponse(
            prediction=str(prediction),
            confidence=confidence,
            probabilities=probabilities,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
