import numpy as np
import os
import glob
from joblib import load
from datetime import datetime
import logging

class YieldModel:
    """
    Yield prediction model wrapper.
    Loads the latest model, encoder, and scaler. Provides robust prediction with validation and logging.
    """
    def __init__(self, valid_crops=None, valid_soil_types=None):
        self.model, self.encoder, self.scaler = self._load_latest_model()
        self.valid_crops = valid_crops
        self.valid_soil_types = valid_soil_types
        logging.basicConfig(level=logging.INFO)
        logging.info("YieldModel initialized.")

    def _load_latest_model(self):
        model_dir = os.path.join(os.path.dirname(__file__), '../../models')
        model_files = sorted(glob.glob(os.path.join(model_dir, 'yield_model_*.joblib')))
        encoder_files = sorted(glob.glob(os.path.join(model_dir, 'yield_encoder_*.joblib')))
        scaler_files = sorted(glob.glob(os.path.join(model_dir, 'yield_scaler_*.joblib')))
        if not model_files or not encoder_files or not scaler_files:
            raise RuntimeError('No trained yield model found.')
        model = load(model_files[-1])
        encoder = load(encoder_files[-1])
        scaler = load(scaler_files[-1])
        return model, encoder, scaler

    def predict(self, features: dict):
        """
        Predict yield given input features. Returns (prediction, confidence, summary).
        Confidence is a placeholder (0.95).
        """
        # Validate input
        from .utils import validate_yield_input
        valid, errors = validate_yield_input(features, self.valid_crops, self.valid_soil_types)
        if not valid:
            logging.error(f"YieldModel input validation failed: {errors}")
            raise ValueError(f"Input validation failed: {errors}")
        # Prepare input features in the right order
        X = self._prepare_features(features)
        X_scaled = self.scaler.transform(X)
        pred = self.model.predict(X_scaled)[0]
        conf = 0.95  # Placeholder, see docs
        summary = self.farmer_summary(pred, features)
        if not summary:
            summary = f"You can expect about {pred:.0f} kg of crops from this plot. Keep monitoring your field for best results."
        logging.info(f"YieldModel prediction: {pred}, confidence: {conf}, summary: {summary}")
        return float(pred), conf, summary

    def _prepare_features(self, features):
        # This should match the training script's feature order
        base = [
            float(features["rainfall"]),
            float(features["temperature"]),
            float(features.get("soil_moisture", 0)),
            float(features.get("areaSqM", features.get("area", 0))),
            float(features["rainfall"]),  # rainfall_7d fallback
            float(features["temperature"]),  # temperature_7d fallback
        ]
        crop = features.get("crop", "unknown")
        soil_type = features.get("soil_type", "unknown")
        # Handle unknowns gracefully
        cat = [[crop, soil_type]]
        cat_encoded = self.encoder.transform(cat)
        X = np.concatenate([base, cat_encoded[0]])
        return np.array([X])

    def farmer_summary(self, prediction, features):
        # Existing summary logic
        try:
            crop = features.get("crop") or features.get("crop_type") or "your crop"
            temp = features.get("temperature")
            rain = features.get("rainfall")
            area = features.get("areaSqM") or features.get("area")
            if temp is not None and rain is not None:
                if temp > 35:
                    advice = f"High temperatures detected. Consider mulching and irrigation for {crop}."
                elif temp < 15:
                    advice = f"Low temperatures detected. Protect {crop} from cold stress."
                elif rain < 20:
                    advice = f"Low rainfall. Irrigation may be needed for {crop}."
                else:
                    advice = f"Conditions are favorable for {crop}. Maintain regular monitoring."
            else:
                advice = f"Monitor your field conditions closely for best results."
            summary = f"Expected yield: {prediction:.2f} kg. {advice}"
        except Exception as e:
            summary = "You can expect about {:.0f} kg of crops from this plot. Keep monitoring your field for best results.".format(prediction)
        if not summary or not isinstance(summary, str) or not summary.strip():
            summary = "You can expect about {:.0f} kg of crops from this plot. Keep monitoring your field for best results.".format(prediction)
        print(f"YieldModel summary: {summary}")
        return summary 