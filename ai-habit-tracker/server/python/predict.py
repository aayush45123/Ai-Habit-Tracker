import sys
import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

streak = float(sys.argv[1])
completion = float(sys.argv[2])

model = joblib.load(MODEL_PATH)

sample = pd.DataFrame(
    [[streak, completion]],
    columns=["streak", "completion"]
)

prediction = model.predict(sample)[0]

probability = model.predict_proba(sample)[0]

confidence = round(max(probability) * 100)

print(f"{prediction},{confidence}")