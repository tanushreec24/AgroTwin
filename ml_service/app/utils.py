import logging
from typing import List, Optional

def validate_yield_input(data, valid_crops: Optional[List[str]] = None, valid_soil_types: Optional[List[str]] = None):
    """
    Validate input for yield prediction.
    Checks for presence, type, range, and valid categorical values.
    """
    required = ["rainfall", "temperature", "soil_type", "crop", "areaSqM"]
    errors = []
    # Presence
    for field in required:
        if field not in data:
            errors.append(f"Missing field: {field}")
    # Type and range
    if "rainfall" in data:
        try:
            val = float(data["rainfall"])
            if not (0 <= val <= 1000):
                errors.append("rainfall out of range (0-1000 mm)")
        except Exception:
            errors.append("rainfall must be a number")
    if "temperature" in data:
        try:
            val = float(data["temperature"])
            if not (-30 <= val <= 60):
                errors.append("temperature out of range (-30 to 60 °C)")
        except Exception:
            errors.append("temperature must be a number")
    if "areaSqM" in data:
        try:
            val = float(data["areaSqM"])
            if not (0 < val < 1e7):
                errors.append("areaSqM out of range (0-10,000,000)")
        except Exception:
            errors.append("areaSqM must be a number")
    # Categorical
    if "crop" in data and valid_crops:
        if data["crop"] not in valid_crops:
            errors.append(f"Invalid crop: {data['crop']}. Allowed: {valid_crops}")
    if "soil_type" in data and valid_soil_types:
        if data["soil_type"] not in valid_soil_types:
            errors.append(f"Invalid soil_type: {data['soil_type']}. Allowed: {valid_soil_types}")
    return (len(errors) == 0), errors

def validate_irrigation_input(data, valid_crops: Optional[List[str]] = None, valid_soil_types: Optional[List[str]] = None):
    """
    Validate input for irrigation prediction.
    Checks for presence, type, range, and valid categorical values.
    """
    required = ["soil_moisture", "rainfall", "temperature", "soil_type", "crop", "areaSqM"]
    errors = []
    for field in required:
        if field not in data:
            errors.append(f"Missing field: {field}")
    if "soil_moisture" in data:
        try:
            val = float(data["soil_moisture"])
            if not (0 <= val <= 100):
                errors.append("soil_moisture out of range (0-100%)")
        except Exception:
            errors.append("soil_moisture must be a number")
    if "rainfall" in data:
        try:
            val = float(data["rainfall"])
            if not (0 <= val <= 1000):
                errors.append("rainfall out of range (0-1000 mm)")
        except Exception:
            errors.append("rainfall must be a number")
    if "temperature" in data:
        try:
            val = float(data["temperature"])
            if not (-30 <= val <= 60):
                errors.append("temperature out of range (-30 to 60 °C)")
        except Exception:
            errors.append("temperature must be a number")
    if "areaSqM" in data:
        try:
            val = float(data["areaSqM"])
            if not (0 < val < 1e7):
                errors.append("areaSqM out of range (0-10,000,000)")
        except Exception:
            errors.append("areaSqM must be a number")
    if "crop" in data and valid_crops:
        if data["crop"] not in valid_crops:
            errors.append(f"Invalid crop: {data['crop']}. Allowed: {valid_crops}")
    if "soil_type" in data and valid_soil_types:
        if data["soil_type"] not in valid_soil_types:
            errors.append(f"Invalid soil_type: {data['soil_type']}. Allowed: {valid_soil_types}")
    return (len(errors) == 0), errors 