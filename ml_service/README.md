# ML Service: Yield & Irrigation Prediction

## 1. Training the Models

- Ensure you have Python 3.8+ and the following packages:
  ```bash
  pip install pandas scikit-learn joblib
  # For best results, also install:
  pip install xgboost lightgbm
  ```
- Place your data CSV (e.g., `../exported_farm_data.csv`) in the correct location.
- Run the training script:
  ```bash
  python train_yield_irrigation.py
  ```
- Trained models and preprocessors will be saved in `./models/`.

## 2. Boosting Accuracy
- Add more features: historical yields, weather, soil type, plot size, etc.
- Use more data if available.
- Try advanced models (XGBoost, LightGBM).
- Tune hyperparameters (edit the script for more grid options).

## 3. Integrating with Flask
- In your Flask endpoints, load the model, encoder, and scaler from `./models/`.
- Preprocess incoming data the same way as in training (one-hot encode, scale).
- Use the model's `.predict()` method to get predictions.

## 4. Example Flask Integration
```python
from joblib import load
import numpy as np

model = load('models/yield_model.joblib')
encoder = load('models/yield_encoder.joblib')
scaler = load('models/yield_scaler.joblib')

def predict_yield(features):
    # features: dict with keys 'rainfall', 'temperature', 'soil_moisture', 'crop'
    X = np.array([[features['rainfall'], features['temperature'], features['soil_moisture']]])
    crop_encoded = encoder.transform([[features['crop']]])
    X_full = np.concatenate([X, crop_encoded], axis=1)
    X_scaled = scaler.transform(X_full)
    pred = model.predict(X_scaled)
    return float(pred[0])
```

---

For further improvements, add more domain-specific features, use ensemble models, and keep your data pipeline up to date! 