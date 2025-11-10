from ml_utils import create_fallback_model
import joblib
import os

MODEL_FOLDER = "models"
MODEL_FILE = "expense_model.pkl"

os.makedirs(MODEL_FOLDER, exist_ok=True)

pipeline, feature_cols = create_fallback_model()

joblib.dump({
    "pipeline": pipeline,
    "feature_columns": feature_cols
}, os.path.join(MODEL_FOLDER, MODEL_FILE))

print("✅ Fallback model trained and saved successfully.")
