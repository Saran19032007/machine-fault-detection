"""
Dataset analysis / EDA report for industrial_motor_sensor_data_8000.csv

Usage:
    cd ml-service
    python training/analyze_dataset.py

This script is READ-ONLY. It never modifies the source CSV.
"""

import os
import sys

import numpy as np
import pandas as pd

if sys.stdout.encoding is not None and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

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

FEATURES = ["voltage", "current", "temperature", "vibration"]


def load_raw(path: str = DATASET_PATH) -> pd.DataFrame:
    if not os.path.exists(path):
        print(f"ERROR: dataset not found at {path}")
        sys.exit(1)
    return pd.read_csv(path)


def section(title: str) -> None:
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def main() -> None:
    df = load_raw()

    section("1. BASIC SHAPE")
    print(f"Rows: {df.shape[0]}")
    print(f"Columns: {df.shape[1]}")
    print(f"Column names: {list(df.columns)}")

    section("2. DATA TYPES")
    print(df.dtypes)

    df = df.rename(columns=COLUMN_MAP)

    section("3. MISSING VALUES")
    missing = df.isnull().sum()
    print(missing)
    print(f"Total missing cells: {int(missing.sum())}")

    section("4. DUPLICATE ROWS")
    dup_count = df.duplicated().sum()
    print(f"Fully duplicated rows: {dup_count}")

    section("5. INVALID / NON-FINITE VALUES (numeric columns)")
    numeric_cols = FEATURES
    for col in numeric_cols:
        if col not in df.columns:
            continue
        n_inf = np.isinf(df[col]).sum()
        n_neg = (df[col] < 0).sum()
        print(f"{col:12s} -> infinite: {n_inf:4d} | negative: {n_neg:4d}")

    section("6. LABEL / CLASS DISTRIBUTION")
    if "label" in df.columns:
        counts = df["label"].value_counts()
        pct = df["label"].value_counts(normalize=True) * 100
        for label in counts.index:
            print(f"{label:10s}: {counts[label]:5d}  ({pct[label]:.2f}%)")
        print(f"Unique labels: {sorted(df['label'].unique().tolist())}")
    else:
        print("No 'label' column found.")

    section("7. DESCRIPTIVE STATISTICS (min / max / mean / std)")
    desc = df[numeric_cols].describe().T[["min", "max", "mean", "std"]]
    print(desc.round(4))

    section("8. OUTLIERS (IQR method, 1.5x rule)")
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers = df[(df[col] < lower) | (df[col] > upper)]
        print(
            f"{col:12s}: {len(outliers):5d} outliers "
            f"(bounds: [{lower:.2f}, {upper:.2f}])"
        )

    section("9. CORRELATION MATRIX (numeric features)")
    print(df[numeric_cols].corr().round(3))

    section("10. PER-CLASS FEATURE MEANS")
    if "label" in df.columns:
        print(df.groupby("label")[numeric_cols].mean().round(3))

    section("SUMMARY")
    print(f"Dataset is {'CLEAN' if missing.sum() == 0 and dup_count == 0 else 'NOT fully clean'} "
          f"({int(missing.sum())} missing cells, {dup_count} duplicate rows).")
    print("Report complete. Original CSV was not modified.")


if __name__ == "__main__":
    main()
