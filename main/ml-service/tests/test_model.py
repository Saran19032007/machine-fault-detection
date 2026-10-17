"""
Tests for model artifact loading and the predict.py CLI helper.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "machine_condition_model.pkl")
PREPROCESSOR_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "preprocessor.pkl")

MODEL_EXISTS = os.path.exists(MODEL_PATH) and os.path.exists(PREPROCESSOR_PATH)


@pytest.mark.skipif(not MODEL_EXISTS, reason="Model not trained yet — run train.py first")
def test_model_artifacts_load_and_predict():
    from predict import predict

    result = predict(voltage=420.5, current=15.2, temperature=54.3, vibration=4.8)

    assert result["prediction"] in {"normal", "low", "moderate", "high"}
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["probabilities"] is not None


@pytest.mark.skipif(not MODEL_EXISTS, reason="Model not trained yet — run train.py first")
def test_metadata_file_has_expected_fields():
    import json

    metadata_path = os.path.join(os.path.dirname(__file__), "..", "models", "model_metadata.json")
    with open(metadata_path, encoding="utf-8") as f:
        metadata = json.load(f)

    assert metadata["features"] == ["voltage", "current", "temperature", "vibration"]
    assert set(metadata["classes"]) == {"normal", "low", "moderate", "high"}
    assert "final_model_metrics" in metadata
    assert metadata["final_model_metrics"]["accuracy"] > 0.5
