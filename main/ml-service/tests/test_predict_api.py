"""
Tests for the FastAPI ML prediction service.

Requires the model to already be trained (python train.py), since app.py
loads the saved artifacts at import time.

Run:
    cd ml-service
    pytest tests/
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app, _model  # noqa: E402

client = TestClient(app)

MODEL_TRAINED = _model is not None


def test_health_endpoint_reports_model_loaded():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert "status" in body
    assert "modelLoaded" in body


@pytest.mark.skipif(not MODEL_TRAINED, reason="Model not trained yet — run train.py first")
def test_predict_valid_input_returns_known_class():
    res = client.post(
        "/predict",
        json={"voltage": 420.5, "current": 15.2, "temperature": 54.3, "vibration": 4.8},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["prediction"] in {"normal", "low", "moderate", "high"}
    assert 0.0 <= body["confidence"] <= 1.0
    assert set(body["probabilities"].keys()) == {"normal", "low", "moderate", "high"}
    assert abs(sum(body["probabilities"].values()) - 1.0) < 0.01


@pytest.mark.skipif(not MODEL_TRAINED, reason="Model not trained yet — run train.py first")
def test_predict_high_condition_input():
    res = client.post(
        "/predict",
        json={"voltage": 460.0, "current": 22.0, "temperature": 110.0, "vibration": 25.0},
    )
    assert res.status_code == 200
    assert res.json()["prediction"] == "high"


def test_predict_rejects_missing_field():
    res = client.post("/predict", json={"voltage": 420.5, "current": 15.2, "temperature": 54.3})
    assert res.status_code == 422


def test_predict_rejects_out_of_range_voltage():
    res = client.post(
        "/predict",
        json={"voltage": -50, "current": 15.2, "temperature": 54.3, "vibration": 4.8},
    )
    assert res.status_code == 422


def test_predict_rejects_non_numeric_input():
    res = client.post(
        "/predict",
        json={"voltage": "not-a-number", "current": 15.2, "temperature": 54.3, "vibration": 4.8},
    )
    assert res.status_code == 422


def test_predict_rejects_malformed_json():
    res = client.post(
        "/predict",
        content="{not valid json",
        headers={"Content-Type": "application/json"},
    )
    assert res.status_code == 422
