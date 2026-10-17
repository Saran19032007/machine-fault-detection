"""
Model training pipeline for Machine Fault Detection / Predictive Maintenance.

Trains Logistic Regression, Random Forest, SVM and XGBoost classifiers on the
provided industrial_motor_sensor_data_8000.csv dataset, evaluates and compares
them, builds a soft-voting ensemble, and saves the final production model.

Usage:
    cd ml-service
    python train.py
"""

import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from xgboost import XGBClassifier

from training.preprocess import (
    FEATURE_COLUMNS,
    clean_dataset,
    get_features_and_target,
    load_dataset,
)

if sys.stdout.encoding is not None and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

RANDOM_STATE = 42
TEST_SIZE = 0.2

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "machine_condition_model.pkl")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")


def section(title: str) -> None:
    print("\n" + "=" * 65)
    print(title)
    print("=" * 65)


def evaluate_model(name, model, X_test, y_test, class_names):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec_macro = precision_score(y_test, y_pred, average="macro", zero_division=0)
    rec_macro = recall_score(y_test, y_pred, average="macro", zero_division=0)
    f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)
    prec_weighted = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec_weighted = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1_weighted = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n--- {name} ---")
    print(f"Accuracy          : {acc:.4f}")
    print(f"Precision (macro) : {prec_macro:.4f}   | Precision (weighted): {prec_weighted:.4f}")
    print(f"Recall    (macro) : {rec_macro:.4f}   | Recall    (weighted): {rec_weighted:.4f}")
    print(f"F1        (macro) : {f1_macro:.4f}   | F1        (weighted): {f1_weighted:.4f}")
    print(f"Confusion Matrix (rows=actual, cols=predicted) classes={class_names}")
    print(cm)

    return {
        "accuracy": round(float(acc), 4),
        "precision_macro": round(float(prec_macro), 4),
        "recall_macro": round(float(rec_macro), 4),
        "f1_macro": round(float(f1_macro), 4),
        "precision_weighted": round(float(prec_weighted), 4),
        "recall_weighted": round(float(rec_weighted), 4),
        "f1_weighted": round(float(f1_weighted), 4),
        "confusion_matrix": cm.tolist(),
    }


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    section("STEP 1-3: LOAD, VALIDATE & CLEAN DATASET")
    raw_df = load_dataset()
    df = clean_dataset(raw_df)
    print(f"Rows after cleaning: {len(df)} / {len(raw_df)} original")

    X, y = get_features_and_target(df)
    print(f"Features: {FEATURE_COLUMNS}")
    print(f"Target classes: {sorted(y.unique().tolist())}")

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    class_names = list(label_encoder.classes_)
    print(f"Label encoding: {dict(zip(class_names, label_encoder.transform(class_names)))}")

    section("STEP 4: TRAIN / TEST SPLIT (stratified)")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y_encoded
    )
    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

    section("STEP 5: FEATURE SCALING")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    print("StandardScaler fitted on training data.")

    section("STEP 6-7: TRAIN & EVALUATE INDIVIDUAL MODELS")
    results = {}

    log_reg = LogisticRegression(max_iter=2000, random_state=RANDOM_STATE)
    log_reg.fit(X_train_scaled, y_train)
    results["logistic_regression"] = evaluate_model(
        "Logistic Regression", log_reg, X_test_scaled, y_test, class_names
    )

    rf = RandomForestClassifier(
        n_estimators=300, max_depth=None, random_state=RANDOM_STATE, n_jobs=-1
    )
    rf.fit(X_train_scaled, y_train)
    results["random_forest"] = evaluate_model(
        "Random Forest", rf, X_test_scaled, y_test, class_names
    )

    svm = SVC(probability=True, kernel="rbf", random_state=RANDOM_STATE)
    svm.fit(X_train_scaled, y_train)
    results["svm"] = evaluate_model("SVM", svm, X_test_scaled, y_test, class_names)

    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        random_state=RANDOM_STATE,
        eval_metric="mlogloss",
        n_jobs=-1,
    )
    xgb.fit(X_train_scaled, y_train)
    results["xgboost"] = evaluate_model("XGBoost", xgb, X_test_scaled, y_test, class_names)

    section("STEP 7b: MODEL COMPARISON REPORT")
    comparison_df = pd.DataFrame(
        {name: {"accuracy": r["accuracy"], "f1_macro": r["f1_macro"], "f1_weighted": r["f1_weighted"]}
         for name, r in results.items()}
    ).T.sort_values("f1_macro", ascending=False)
    print(comparison_df)

    section("STEP 8: SOFT VOTING ENSEMBLE (RF + XGBoost + SVM)")
    ensemble = VotingClassifier(
        estimators=[
            ("random_forest", RandomForestClassifier(
                n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1
            )),
            ("xgboost", XGBClassifier(
                n_estimators=300, max_depth=6, learning_rate=0.1,
                random_state=RANDOM_STATE, eval_metric="mlogloss", n_jobs=-1
            )),
            ("svm", SVC(probability=True, kernel="rbf", random_state=RANDOM_STATE)),
        ],
        voting="soft",
    )
    ensemble.fit(X_train_scaled, y_train)
    ensemble_metrics = evaluate_model(
        "Soft Voting Ensemble", ensemble, X_test_scaled, y_test, class_names
    )
    results["soft_voting_ensemble"] = ensemble_metrics

    section("STEP 9-10: SAVE MODEL, PREPROCESSOR & METRICS")
    joblib.dump(ensemble, MODEL_PATH)
    print(f"Saved production model -> {MODEL_PATH}")

    joblib.dump(
        {"scaler": scaler, "label_encoder": label_encoder, "feature_order": FEATURE_COLUMNS},
        PREPROCESSOR_PATH,
    )
    print(f"Saved preprocessor (scaler + label encoder) -> {PREPROCESSOR_PATH}")

    metadata = {
        "model_name": "Soft Voting Ensemble (Random Forest + XGBoost + SVM)",
        "training_date": datetime.now(timezone.utc).isoformat(),
        "features": FEATURE_COLUMNS,
        "classes": class_names,
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "test_split_ratio": TEST_SIZE,
        "random_state": RANDOM_STATE,
        "final_model_metrics": ensemble_metrics,
        "all_models_comparison": results,
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata -> {METADATA_PATH}")

    section("STEP 11: FINAL RESULTS")
    print(f"Final ensemble accuracy : {ensemble_metrics['accuracy']:.4f}")
    print(f"Final ensemble F1 (macro): {ensemble_metrics['f1_macro']:.4f}")
    print(f"Final ensemble F1 (weighted): {ensemble_metrics['f1_weighted']:.4f}")
    print("\nTraining complete. Model is ready to be served by app.py")


if __name__ == "__main__":
    main()
