"""
Standalone CLI prediction utility.

Loads the saved production model + preprocessor and runs a single prediction.
Useful for smoke-testing the trained model without starting the FastAPI server.

Usage:
    cd ml-service
    python predict.py --voltage 420.5 --current 15.2 --temperature 54.3 --vibration 4.8
"""

import argparse
import os
import sys

import joblib
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "machine_condition_model.pkl")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")


def load_artifacts():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(PREPROCESSOR_PATH):
        print("ERROR: model artifacts not found. Run `python train.py` first.")
        sys.exit(1)
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    return model, preprocessor


def predict(voltage: float, current: float, temperature: float, vibration: float):
    model, preprocessor = load_artifacts()
    scaler = preprocessor["scaler"]
    label_encoder = preprocessor["label_encoder"]
    feature_order = preprocessor["feature_order"]

    row = {"voltage": voltage, "current": current, "temperature": temperature, "vibration": vibration}
    X = pd.DataFrame([[row[f] for f in feature_order]], columns=feature_order)
    X_scaled = scaler.transform(X)

    pred_encoded = model.predict(X_scaled)[0]
    prediction = label_encoder.inverse_transform([pred_encoded])[0]

    probabilities = None
    confidence = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X_scaled)[0]
        class_names = label_encoder.classes_
        probabilities = {cls: round(float(p), 4) for cls, p in zip(class_names, proba)}
        confidence = round(float(max(proba)), 4)

    return {"prediction": prediction, "confidence": confidence, "probabilities": probabilities}


def main():
    parser = argparse.ArgumentParser(description="Run a single machine condition prediction.")
    parser.add_argument("--voltage", type=float, required=True)
    parser.add_argument("--current", type=float, required=True)
    parser.add_argument("--temperature", type=float, required=True)
    parser.add_argument("--vibration", type=float, required=True)
    args = parser.parse_args()

    result = predict(args.voltage, args.current, args.temperature, args.vibration)
    print(result)


if __name__ == "__main__":
    main()
