import numpy as np
import os
import glob
from joblib import load
from datetime import datetime
import logging

class IrrigationModel:
    """
    Irrigation prediction model wrapper.
    Loads the latest model, encoder, and scaler. Provides robust prediction with validation and logging.
    """
    def __init__(self, valid_crops=None, valid_soil_types=None):
        self.model, self.encoder, self.scaler = self._load_latest_model()
        self.valid_crops = valid_crops
        self.valid_soil_types = valid_soil_types
        logging.basicConfig(level=logging.INFO)
        logging.info("IrrigationModel initialized.")

    def _load_latest_model(self):
        model_dir = os.path.join(os.path.dirname(__file__), '../../models')
        model_files = sorted(glob.glob(os.path.join(model_dir, 'irrigation_model_*.joblib')))
        encoder_files = sorted(glob.glob(os.path.join(model_dir, 'irrigation_encoder_*.joblib')))
        scaler_files = sorted(glob.glob(os.path.join(model_dir, 'irrigation_scaler_*.joblib')))
        if not model_files or not encoder_files or not scaler_files:
            raise RuntimeError('No trained irrigation model found.')
        model = load(model_files[-1])
        encoder = load(encoder_files[-1])
        scaler = load(scaler_files[-1])
        return model, encoder, scaler

    def predict(self, features: dict):
        """
        Predict irrigation given input features. Returns (prediction, confidence, summary).
        Confidence is a placeholder (0.9).
        """
        from .utils import validate_irrigation_input
        valid, errors = validate_irrigation_input(features, self.valid_crops, self.valid_soil_types)
        if not valid:
            logging.error(f"IrrigationModel input validation failed: {errors}")
            raise ValueError(f"Input validation failed: {errors}")
        X = self._prepare_features(features)
        X_scaled = self.scaler.transform(X)
        pred = self.model.predict(X_scaled)[0]
        conf = 0.9  # Placeholder, see docs
        summary = self.farmer_summary(pred, features)
        if not summary:
            summary = f"Add about {pred:.0f} mm of water to your plot. Adjust as needed for your crop."
        logging.info(f"IrrigationModel prediction: {pred}, confidence: {conf}, summary: {summary}")
        return float(pred), conf, summary

    def _prepare_features(self, features):
        base = [
            float(features["rainfall"]),
            float(features["temperature"]),
            float(features["soil_moisture"]),
            float(features.get("areaSqM", features.get("area", 0))),
            float(features["rainfall"]),
            float(features["temperature"]),
        ]
        crop = features.get("crop", "unknown")
        soil_type = features.get("soil_type", "unknown")
        cat = [[crop, soil_type]]
        cat_encoded = self.encoder.transform(cat)
        X = np.concatenate([base, cat_encoded[0]])
        return np.array([X])

    def farmer_summary(self, prediction, features):
        try:
            crop = features.get("crop") or features.get("crop_type") or "your crop"
            temp = features.get("temperature")
            rain = features.get("rainfall")
            moisture = features.get("soil_moisture")
            if moisture is not None:
                if moisture < 20:
                    advice = f"Soil moisture is low. Irrigate {crop} soon."
                elif moisture > 60:
                    advice = f"Soil is very moist. Avoid overwatering {crop}."
                else:
                    advice = f"Soil moisture is optimal for {crop}. Monitor regularly."
            else:
                advice = f"Monitor soil moisture closely for best irrigation results."
            summary = f"Recommended irrigation: {prediction:.2f} mm. {advice}"
        except Exception as e:
            summary = "Add about {:.0f} mm of water to your plot. Adjust as needed for your crop.".format(prediction)
        if not summary or not isinstance(summary, str) or not summary.strip():
            summary = "Add about {:.0f} mm of water to your plot. Adjust as needed for your crop.".format(prediction)
        print(f"IrrigationModel summary: {summary}")
        return summary

    def farmer_summary_old(self, pred, features):
        soil_moisture = features.get("soil_moisture", 0)
        rain = features.get("rainfall", 0)
        month = datetime.now().month
        month_name = datetime.now().strftime('%B')
        tips = []
        if soil_moisture < 30:
            tips.append("Soil is dry. Make sure to water your crops well.")
        elif soil_moisture > 70:
            tips.append("Soil is very wet. Avoid overwatering.")
        if rain > 100:
            tips.append("Recent heavy rain. You may need less irrigation this week.")
        elif rain < 30:
            tips.append("Little rain lately. Irrigate more if needed.")
        # Seasonal tip
        if month in [6,7,8]:
            tips.append(f"It's {month_name}, check for water runoff and soil erosion during rains.")
        elif month in [12,1,2]:
            tips.append(f"It's {month_name}, water early in the day to avoid cold stress at night.")
        else:
            tips.append(f"It's {month_name}, adjust your watering as the season changes.")
        tips_str = " ".join(tips)
        return f"Add about {pred:.0f} mm of water to your plot. {tips_str}" 