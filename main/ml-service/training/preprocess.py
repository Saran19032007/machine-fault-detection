"""
Shared data loading / preprocessing helpers used by train.py and analyze_dataset.py.
"""

import os

import numpy as np
import pandas as pd

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "dataset", "industrial_motor_sensor_data_8000.csv"
)

COLUMN_MAP = {
    "Voltage (V)": "voltage",
    "Current (A)": "current",
    "Temperature (°C)": "temperature",
    "Vibration (mm/s)": "vibration",
    "Label": "label",
}

FEATURE_COLUMNS = ["voltage", "current", "temperature", "vibration"]
TARGET_COLUMN = "label"


def load_dataset(path: str = DATASET_PATH) -> pd.DataFrame:
    """Load the raw CSV and rename columns to internal snake_case names.
    Does NOT modify the source file on disk.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}")

    df = pd.read_csv(path)
    df = df.rename(columns=COLUMN_MAP)

    missing_cols = set(FEATURE_COLUMNS + [TARGET_COLUMN]) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Dataset is missing expected columns: {missing_cols}")

    return df


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Validate and clean an in-memory copy of the dataset.
    - Drops rows with missing/NaN values in required columns.
    - Drops rows with infinite values.
    - Drops exact duplicate rows.
    Does not touch the original CSV file.
    """
    df = df.copy()

    before = len(df)
    df = df.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])

    numeric = df[FEATURE_COLUMNS]
    finite_mask = np.isfinite(numeric.to_numpy()).all(axis=1)
    df = df[finite_mask]

    df = df.drop_duplicates()

    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(str).str.strip().str.lower()
    valid_labels = {"normal", "low", "moderate", "high"}
    df = df[df[TARGET_COLUMN].isin(valid_labels)]

    after = len(df)
    if after < before:
        print(f"[preprocess] Cleaned dataset: dropped {before - after} invalid rows "
              f"({before} -> {after})")

    return df.reset_index(drop=True)


def get_features_and_target(df: pd.DataFrame):
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()
    return X, y
