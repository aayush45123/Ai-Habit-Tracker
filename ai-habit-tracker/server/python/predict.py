import sys
import joblib
import os

streak = float(sys.argv[1])
completion = float(sys.argv[2])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

model = joblib.load(MODEL_PATH)
prediction = model.predict([
    [streak, completion]
])

print(int(prediction[0]))