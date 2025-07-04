from flask import Blueprint, request, jsonify
from .models.yield_model import YieldModel
from .models.irrigation_model import IrrigationModel
from .utils import validate_yield_input, validate_irrigation_input

api_bp = Blueprint("api", __name__, url_prefix="/api")

yield_model = YieldModel()
irrigation_model = IrrigationModel()

@api_bp.route("/predict-yield", methods=["POST"])
def predict_yield():
    data = request.get_json()
    print(f"[predict-yield] Incoming data: {data}")
    valid, errors = validate_yield_input(data)
    if not valid:
        print(f"[predict-yield] Invalid input: {errors}")
        return jsonify({"error": "Invalid input", "details": errors}), 400
    try:
        prediction, _, summary = yield_model.predict(data)
        response = {
            "prediction": prediction,
            "summary": summary
        }
        print(f"[predict-yield] Outgoing response: {response}")
        return jsonify(response)
    except Exception as e:
        print(f"[predict-yield] Exception: {e}")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

@api_bp.route("/predict-irrigation", methods=["POST"])
def predict_irrigation():
    data = request.get_json()
    print(f"[predict-irrigation] Incoming data: {data}")
    valid, errors = validate_irrigation_input(data)
    if not valid:
        print(f"[predict-irrigation] Invalid input: {errors}")
        return jsonify({"error": "Invalid input", "details": errors}), 400
    try:
        prediction, _, summary = irrigation_model.predict(data)
        response = {
            "prediction": prediction,
            "summary": summary
        }
        print(f"[predict-irrigation] Outgoing response: {response}")
        return jsonify(response)
    except Exception as e:
        print(f"[predict-irrigation] Exception: {e}")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

@api_bp.route("/reload-models", methods=["POST"])
def reload_models():
    global yield_model, irrigation_model
    try:
        yield_model = YieldModel()
        irrigation_model = IrrigationModel()
        print("[reload-models] Models reloaded from disk.")
        return jsonify({"status": "success", "message": "Models reloaded."}), 200
    except Exception as e:
        print(f"[reload-models] Exception: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500 