import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyRegressor
from xgboost import XGBRegressor


MODEL_FOLDER = "models"
MODEL_FILE = "expense_model.pkl"
FALLBACK_DATASET = "fallback_dataset.csv"   # your monthly CSV

os.makedirs(MODEL_FOLDER, exist_ok=True)


# ------------------------------------------------------------------------------------------------
# ✅ Load fallback dataset ONCE → acts as default training + demo model
# ------------------------------------------------------------------------------------------------
def load_fallback_dataset():
    if not os.path.exists(FALLBACK_DATASET):
        raise FileNotFoundError(f"Fallback dataset missing: {FALLBACK_DATASET}")

    df = pd.read_csv(FALLBACK_DATASET)

    # Remove non-feature columns
    drop_cols = [c for c in df.columns if c.lower() in ['month', 'savings']]
    df = df.drop(columns=drop_cols, errors='ignore')

    # Use mean row as baseline representation
    return df.mean(numeric_only=True)


fallback_mean_vector = load_fallback_dataset()


# ------------------------------------------------------------------------------------------------
# ✅ Create a fallback model (DummyRegressor → predicts mean monthly total)
# ------------------------------------------------------------------------------------------------
def create_fallback_model():
    # X (all features)
    X = np.array([fallback_mean_vector.values])

    # ✅ Detect correct target column automatically
    target_col = None
    for col in fallback_mean_vector.index:
        if col.lower().replace(" ", "_") == "total_expense":
            target_col = col
            break

    if target_col is None:
        raise KeyError("❌ ERROR: Fallback dataset must contain 'Total_Expense' (case-insensitive).")

    y = np.array([fallback_mean_vector[target_col]])  # target

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", DummyRegressor(strategy="mean"))
    ])

    pipeline.fit(X, y)
    return pipeline, list(fallback_mean_vector.index)



# ------------------------------------------------------------------------------------------------
# ✅ Load trained model if available; otherwise load fallback model
# ------------------------------------------------------------------------------------------------
def load_model():
    model_path = os.path.join(MODEL_FOLDER, MODEL_FILE)

    if os.path.exists(model_path):
        try:
            data = joblib.load(model_path)
            print("[AI] Loaded trained model successfully.")
            return data["pipeline"], data["feature_columns"]
        except Exception as e:
            print(f"[AI WARNING] Trained model corrupted, using fallback model. Reason: {e}")

    print("[AI] Using fallback model.")
    return create_fallback_model()


# ------------------------------------------------------------------------------------------------
# ✅ TRAINING FUNCTION → Uses DB if available; otherwise uses fallback model
# ------------------------------------------------------------------------------------------------
def train_model_from_db(expense_df):
    """
    expense_df must have:
       user_id, amount, category, date  (at least)

    But since this is a demo, if any issue → fallback model.
    """

    model_path = os.path.join(MODEL_FOLDER, MODEL_FILE)

    # --------------------------------------------------------------------------------------------
    # ✅ 1. If database is empty → train fallback model
    # --------------------------------------------------------------------------------------------
    if expense_df is None or expense_df.empty:
        print("[AI WARNING] Database empty → training fallback model.")
        pipeline, feature_cols = create_fallback_model()
        joblib.dump({"pipeline": pipeline, "feature_columns": feature_cols}, model_path)
        return {"status": "fallback_model_trained"}

    # --------------------------------------------------------------------------------------------
    # ✅ 2. Prepare supervised dataset from DB
    # --------------------------------------------------------------------------------------------
    df = expense_df.copy()

    try:
        df["date"] = pd.to_datetime(df["date"])
        df["month"] = df["date"].dt.to_period("M").astype(str)
    except:
        print("[AI WARNING] Invalid dates → using fallback model.")
        pipeline, feature_cols = create_fallback_model()
        joblib.dump({"pipeline": pipeline, "feature_columns": feature_cols}, model_path)
        return {"status": "fallback_model_trained"}

    monthly = (
        df.groupby("month")
          .agg(total_expense=("amount", "sum"))
          .reset_index()
    )

    # Need at least 3 rows for ML to work
    if len(monthly) < 3:
        print("[AI WARNING] Not enough DB data (<3 months) → using fallback model.")
        pipeline, feature_cols = create_fallback_model()
        joblib.dump({"pipeline": pipeline, "feature_columns": feature_cols}, model_path)
        return {"status": "fallback_model_trained"}

    # --------------------------------------------------------------------------------------------
    # ✅ 3. Train real ML model using XGBoost
    # --------------------------------------------------------------------------------------------
    try:
        monthly["last_month_expense"] = monthly["total_expense"].shift(1)
        monthly["mean_expense"] = monthly["total_expense"].expanding().mean()
        monthly = monthly.dropna()

        X = monthly[["last_month_expense", "mean_expense"]]
        y = monthly["total_expense"]

        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("model", XGBRegressor(n_estimators=120, max_depth=5, learning_rate=0.1))
        ])
        pipeline.fit(X, y)

        joblib.dump({
            "pipeline": pipeline,
            "feature_columns": list(X.columns)
        }, model_path)

        return {"status": "trained_using_db"}

    except Exception as e:
        print(f"[AI WARNING] Training failed → fallback model. Reason: {e}")
        pipeline, feature_cols = create_fallback_model()
        joblib.dump({"pipeline": pipeline, "feature_columns": feature_cols}, model_path)
        return {"status": "fallback_model_trained"}


# ------------------------------------------------------------------------------------------------
# ✅ PREDICTION FUNCTION → Always safe
# ------------------------------------------------------------------------------------------------
def predict_expense(feature_data):
    pipeline, feature_cols = load_model()

    row = []
    for col in feature_cols:
        value = feature_data.get(col, fallback_mean_vector[col])
        if pd.isna(value):
            value = 0
        row.append(value)

    X = pd.DataFrame([row], columns=feature_cols)

    # ✅ Convert to numpy to avoid StandardScaler warning
    X_values = X.to_numpy().astype(float)

    pred = pipeline.predict(X_values)[0]

    # ✅ Handle invalid predictions
    if pred is None or pd.isna(pred) or pred == float("nan"):
        pred = float(fallback_mean_vector.mean())  # safe fallback

    pred = float(pred)

    if pred < 0:
        pred = 0.0

    return pred

