import ml_utils
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    if not data or 'user_id' not in data:
        return jsonify({'error': 'Missing user_id'}), 400

    # ✅ You do NOT use db_conn_string currently
    user_id = int(data['user_id'])

    # ✅ Predict without DB features
    predicted_value = ml_utils.predict_expense({})

    return jsonify({
        "user_id": user_id,
        "predicted_next_month_expense": predicted_value,
        "based_on": "fallback model / limited history"
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    model_path = os.path.join(ml_utils.MODEL_FOLDER, ml_utils.MODEL_FILE)
    fallback_dataset_path = ml_utils.FALLBACK_DATASET
    return jsonify({
        'status': 'ok',
        'model_file_found': os.path.exists(model_path),
        'fallback_dataset_found': os.path.exists(fallback_dataset_path),
        'model_path_checked': model_path
    })


if __name__ == '__main__':
    port = 5001
    print(f"--- Starting Flask AI Service on http://localhost:{port} ---")
    app.run(host='0.0.0.0', port=port, debug=True)
