from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "loan_default_model.pkl"
DATA_PATH = BASE_DIR / "Loan_default.csv"

app = Flask(__name__)
CORS(app)

model = joblib.load(MODEL_PATH)
dataset = pd.read_csv(DATA_PATH)

FEATURES = [c for c in dataset.columns if c not in ["LoanID", "Default"]]
NUMERIC_FIELDS = [
    "Age", "Income", "LoanAmount", "CreditScore", "MonthsEmployed",
    "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio"
]
CATEGORICAL_FIELDS = [
    "Education", "EmploymentType", "MaritalStatus", "HasMortgage",
    "HasDependents", "LoanPurpose", "HasCoSigner"
]

RANGES = {
    "Age": (18, 69),
    "Income": (15000, 149999),
    "LoanAmount": (5000, 249999),
    "CreditScore": (300, 849),
    "MonthsEmployed": (0, 119),
    "NumCreditLines": (1, 4),
    "InterestRate": (2.0, 25.0),
    "LoanTerm": (12, 60),
    "DTIRatio": (0.1, 0.9),
}

CATEGORY_VALUES = {
    field: sorted(dataset[field].astype(str).unique().tolist())
    for field in CATEGORICAL_FIELDS
}


def risk_category(score: float) -> str:
    if score <= 30:
        return "Low Risk"
    if score <= 60:
        return "Moderate Risk"
    if score <= 80:
        return "High Risk"
    return "Critical Risk"


def validate_payload(data: dict):
    missing = [field for field in FEATURES if field not in data]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"

    for field, (low, high) in RANGES.items():
        try:
            value = float(data[field])
        except (TypeError, ValueError):
            return f"{field} must be numeric."
        if not low <= value <= high:
            return f"{field} must be between {low} and {high}."

    for field, allowed in CATEGORY_VALUES.items():
        if str(data[field]) not in allowed:
            return f"Invalid {field}. Allowed values: {', '.join(allowed)}"

    return None


def make_frame(data: dict) -> pd.DataFrame:
    # Keep exactly the same feature order used during training.
    row = {field: data[field] for field in FEATURES}
    return pd.DataFrame([row], columns=FEATURES)


def predict_data(data: dict):
    frame = make_frame(data)
    probability = float(model.predict_proba(frame)[0][1])
    score = probability * 100
    prediction = int(model.predict(frame)[0])
    return prediction, probability, score, risk_category(score)


def explain_data(data: dict):
    frame = make_frame(data)
    preprocessor = model.named_steps["preprocessor"]
    classifier = model.named_steps["model"]
    transformed = preprocessor.transform(frame)
    feature_names = list(preprocessor.get_feature_names_out())

    explainer = shap.TreeExplainer(classifier)
    shap_result = explainer(transformed)
    values = np.asarray(shap_result.values)

    if values.ndim == 3:
        values = values[0, :, 1]
    else:
        values = values[0]

    explanation = pd.DataFrame({
        "feature": feature_names,
        "value": frame.iloc[0].values,
        "shap_value": values.astype(float),
    })
    explanation["importance"] = explanation["shap_value"].abs()
    explanation["impact"] = np.where(
        explanation["shap_value"] >= 0,
        "Increases default risk",
        "Decreases default risk",
    )
    explanation = explanation.sort_values("importance", ascending=False).head(5)

    return explanation.to_dict(orient="records")


def dashboard_stats():
    frame = dataset[FEATURES]
    probabilities = model.predict_proba(frame)[:, 1]
    scores = probabilities * 100
    categories = np.where(
        scores <= 30, "Low Risk",
        np.where(scores <= 60, "Moderate Risk",
                 np.where(scores <= 80, "High Risk", "Critical Risk"))
    )

    counts = pd.Series(categories).value_counts().to_dict()
    classifier = model.named_steps["model"]
    preprocessor = model.named_steps["preprocessor"]
    importances = pd.Series(
        classifier.feature_importances_,
        index=preprocessor.get_feature_names_out(),
    ).sort_values(ascending=False).head(5)

    return {
        "total_applications": int(len(dataset)),
        "low_risk": int(counts.get("Low Risk", 0)),
        "moderate_risk": int(counts.get("Moderate Risk", 0)),
        "high_risk": int(counts.get("High Risk", 0)),
        "critical_risk": int(counts.get("Critical Risk", 0)),
        "average_risk_score": round(float(scores.mean()), 2),
        "top_risk_factors": [
            {"feature": str(name), "importance": round(float(value), 4)}
            for name, value in importances.items()
        ],
    }


@app.get("/")
def home():
    return jsonify({
        "message": "Loan Default Prediction API is running",
        "flow": "Validation -> Preprocessing -> ML -> Probability -> Risk Score -> Explainability -> What-if -> Dashboard",
    })


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": True})


@app.get("/metadata")
def metadata():
    return jsonify({
        "features": FEATURES,
        "numeric_fields": NUMERIC_FIELDS,
        "categorical_fields": CATEGORICAL_FIELDS,
        "category_values": CATEGORY_VALUES,
        "ranges": RANGES,
    })


@app.post("/predict")
def predict():
    try:
        data = request.get_json(silent=True) or {}
        error = validate_payload(data)
        if error:
            return jsonify({"success": False, "error": error}), 400

        prediction, probability, score, category = predict_data(data)
        explanation = explain_data(data)

        return jsonify({
            "success": True,
            "default_prediction": prediction,
            "default_probability": round(probability, 4),
            "default_probability_percentage": round(probability * 100, 2),
            "risk_score": round(score, 2),
            "risk_category": category,
            "explanation": explanation,
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.post("/what-if")
def what_if():
    try:
        body = request.get_json(silent=True) or {}
        original = body.get("original", {})
        changed = body.get("changed", {})

        error = validate_payload(original)
        if error:
            return jsonify({"success": False, "error": f"Original input: {error}"}), 400
        error = validate_payload(changed)
        if error:
            return jsonify({"success": False, "error": f"Changed input: {error}"}), 400

        _, _, old_score, old_category = predict_data(original)
        _, _, new_score, new_category = predict_data(changed)

        return jsonify({
            "success": True,
            "original_score": round(old_score, 2),
            "new_score": round(new_score, 2),
            "score_change": round(new_score - old_score, 2),
            "original_category": old_category,
            "new_category": new_category,
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.get("/dashboard")
def dashboard():
    try:
        return jsonify({"success": True, **dashboard_stats()})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
