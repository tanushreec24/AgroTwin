import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, StackingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score, KFold
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from joblib import dump
import os
import json
from datetime import datetime
import glob

# Optional: Use XGBoost/LightGBM/CatBoost if available
try:
    from xgboost import XGBRegressor
    has_xgb = True
except ImportError:
    has_xgb = False
try:
    from lightgbm import LGBMRegressor
    has_lgbm = True
except ImportError:
    has_lgbm = False
try:
    from catboost import CatBoostRegressor
    has_cat = True
except ImportError:
    has_cat = False

# --- DATA SOURCE ---
# Change this path to use a different dataset (e.g., exported_farm_data.csv, synthetic_farm_data.csv, etc.)
DATA_PATH = 'app/synthetic_farm_data.csv'  # Default: synthetic data for development
OUTPUT_DIR = './models'
HISTORICAL_DIR = '../historical_uploads'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Load and clean data ---
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows from {DATA_PATH}")

# --- Merge with historical data if available ---
hist_files = glob.glob(os.path.join(HISTORICAL_DIR, '*.csv')) if os.path.exists(HISTORICAL_DIR) else []
if hist_files:
    print(f"Merging with {len(hist_files)} historical data file(s)...")
    hist_dfs = [pd.read_csv(f) for f in hist_files]
    hist_df = pd.concat(hist_dfs, ignore_index=True)
    # Merge on plot_id, crop, or other common columns if available
    # For now, just concatenate and drop duplicates, preferring historical data
    combined = pd.concat([hist_df, df], ignore_index=True)
    if 'plot_id' in combined.columns:
        df = combined.drop_duplicates(subset=['plot_id'], keep='first')
    else:
        df = combined.drop_duplicates(keep='first')
    print(f"Final training set: {len(df)} rows (after merging historical data)")
else:
    print("No historical data found. Using only sensor data.")

# --- Column normalization for compatibility ---
# Accept both 'crop' and 'crop_type', 'areaSqM' and 'area'
if 'crop' not in df.columns and 'crop_type' in df.columns:
    df['crop'] = df['crop_type']
if 'areaSqM' not in df.columns and 'area' in df.columns:
    df['areaSqM'] = df['area']

# --- Data cleaning: drop rows with missing values in key columns ---
required_features = ['rainfall', 'temperature', 'soil_moisture', 'crop']
df = df.dropna(subset=required_features)

# --- Feature Engineering ---
# Add soil_type, plot size, rolling weather, etc.
if 'soil_type' in df.columns:
    df['soil_type'] = df['soil_type'].fillna('unknown')
else:
    df['soil_type'] = 'unknown'
if 'areaSqM' in df.columns:
    df['areaSqM'] = df['areaSqM'].fillna(df['areaSqM'].mean())
else:
    df['areaSqM'] = 0
# Rolling rainfall/temperature (last 7 days) if timestamped data is available
if 'timestamp' in df.columns:
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')
    df['rainfall_7d'] = df['rainfall'].rolling(window=7, min_periods=1).mean()
    df['temperature_7d'] = df['temperature'].rolling(window=7, min_periods=1).mean()
else:
    df['rainfall_7d'] = df['rainfall']
    df['temperature_7d'] = df['temperature']

# --- One-hot encode categorical features ---
cat_features = ['crop', 'soil_type']
X = df[['rainfall', 'temperature', 'soil_moisture', 'areaSqM', 'rainfall_7d', 'temperature_7d'] + cat_features].copy()
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
cat_encoded = encoder.fit_transform(X[cat_features])
cat_feature_names = encoder.get_feature_names_out(cat_features)
X = X.drop(cat_features, axis=1)
X[cat_feature_names] = cat_encoded

# --- Standardize features ---
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# --- Model training and export ---
def train_and_export(target_col, model_name, pretty_name, units, interpretation_func=None):
    if target_col not in df.columns:
        print(f"No '{target_col}' column found in CSV. Skipping {model_name} model.")
        return

    y = df[target_col].dropna()
    X_target = X_scaled[df[target_col].notna()]
    X_train, X_test, y_train, y_test = train_test_split(X_target, y, test_size=0.2, random_state=42)

    models = {
        'RandomForest': RandomForestRegressor(random_state=42),
        'GradientBoosting': GradientBoostingRegressor(random_state=42)
    }
    param_grids = {
        'RandomForest': {
            'n_estimators': [100, 200, 300],
            'max_depth': [None, 10, 20, 30],
            'min_samples_split': [2, 5, 10]
        },
        'GradientBoosting': {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.01, 0.05, 0.1],
            'max_depth': [3, 5, 7]
        }
    }
    if has_xgb:
        models['XGBoost'] = XGBRegressor(random_state=42, verbosity=0)
        param_grids['XGBoost'] = {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.01, 0.05, 0.1],
            'max_depth': [3, 5, 7]
        }
    if has_lgbm:
        models['LightGBM'] = LGBMRegressor(random_state=42)
        param_grids['LightGBM'] = {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.01, 0.05, 0.1],
            'max_depth': [3, 5, 7]
        }
    if has_cat:
        models['CatBoost'] = CatBoostRegressor(verbose=0, random_state=42)
        param_grids['CatBoost'] = {
            'iterations': [100, 200, 300],
            'learning_rate': [0.01, 0.05, 0.1],
            'depth': [3, 5, 7]
        }

    best_score = -np.inf
    best_model = None
    best_name = None
    best_params = None
    best_rmse = None
    best_mae = None
    best_mape = None
    best_cv_scores = None

    for name, model in models.items():
        print(f"\nTuning {name} for {model_name}...")
        grid = GridSearchCV(model, param_grids[name], cv=5, scoring='r2', n_jobs=-1)
        grid.fit(X_train, y_train)
        preds = grid.predict(X_test)
        rmse = mean_squared_error(y_test, preds, squared=False)
        r2 = r2_score(y_test, preds)
        mae = mean_absolute_error(y_test, preds)
        mape = np.mean(np.abs((y_test - preds) / np.clip(y_test, 1e-8, None))) * 100
        print(f"{name} RMSE: {rmse:.3f} {units}, MAE: {mae:.3f} {units}, MAPE: {mape:.2f}%, R2: {r2:.3f}, Best Params: {grid.best_params_}")
        if r2 > best_score:
            best_score = r2
            best_model = grid.best_estimator_
            best_name = name
            best_params = grid.best_params_
            best_rmse = rmse
            best_mae = mae
            best_mape = mape

    # Cross-validation on best model
    kf = KFold(n_splits=10, shuffle=True, random_state=42)
    cv_scores = cross_val_score(best_model, X_target, y, cv=kf, scoring='r2')
    print(f"\nBest model for {model_name}: {best_name}")
    print(f"  Test R2: {best_score:.3f}")
    print(f"  CV R2: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
    print(f"  Test RMSE: {best_rmse:.3f} {units}")
    print(f"  Test MAE: {best_mae:.3f} {units}")
    print(f"  Test MAPE: {best_mape:.2f}%")

    # Print feature importances if available
    if hasattr(best_model, 'feature_importances_'):
        print("Feature importances:")
        for name, importance in zip(list(X.columns), best_model.feature_importances_):
            print(f"  {name}: {importance:.3f}")

    # Export model, encoder, scaler, and metrics with versioning
    version = datetime.now().strftime('%Y%m%d%H%M%S')
    dump(best_model, os.path.join(OUTPUT_DIR, f'{model_name}_model_{version}.joblib'))
    dump(encoder, os.path.join(OUTPUT_DIR, f'{model_name}_encoder_{version}.joblib'))
    dump(scaler, os.path.join(OUTPUT_DIR, f'{model_name}_scaler_{version}.joblib'))
    print(f"Saved {model_name} model and preprocessors to {OUTPUT_DIR}/ (version {version})")

    # --- Save metrics for this model ---
    metrics = {
        "model": best_name,
        "test_rmse": best_rmse,
        "test_mae": best_mae,
        "test_mape": best_mape,
        "test_r2": best_score,
        "cv_r2_mean": float(cv_scores.mean()),
        "cv_r2_std": float(cv_scores.std()),
        "params": best_params,
        "feature_importances": getattr(best_model, 'feature_importances_', None).tolist() if hasattr(best_model, 'feature_importances_') else None,
        "units": units
    }
    with open(os.path.join(OUTPUT_DIR, f'{model_name}_metrics_{version}.json'), 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to {OUTPUT_DIR}/{model_name}_metrics_{version}.json")

    # --- Farmer-friendly summary ---
    print("\n--- Farmer-friendly summary ---")
    print(f"{pretty_name} prediction is in {units}.")
    print(f"Typical prediction range: {y.min():.1f} to {y.max():.1f} {units}.")
    print(f"On average, the model's error is ±{best_mae:.1f} {units}.")
    if interpretation_func:
        print(interpretation_func(best_mae, units))
    print("------------------------------\n")

# --- Train both models ---
train_and_export(
    target_col='yield',
    model_name='yield',
    pretty_name='Yield',
    units='kg',
    interpretation_func=lambda mae, units: f"This means your predicted yield is usually within ±{mae:.1f} {units} of the actual value."
)
train_and_export(
    target_col='irrigation_required',
    model_name='irrigation',
    pretty_name='Irrigation Requirement',
    units='mm',
    interpretation_func=lambda mae, units: f"This means you should apply the predicted amount of water (in mm) to your plot. The model is usually within ±{mae:.1f} {units} of the true requirement."
)

print("Done. Models and metrics saved in ./models/")

# --- USAGE NOTE ---
# To use a different dataset, change DATA_PATH above.
# To add more data, generate/merge CSVs with the same columns as synthetic_farm_data.csv. 