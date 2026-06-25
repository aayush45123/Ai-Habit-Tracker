import sys
import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# -----------------------------
# Read Arguments
# -----------------------------

streak = float(sys.argv[1])
completion = float(sys.argv[2])
longestStreak = float(sys.argv[3])
totalLogs = float(sys.argv[4])
missedLogs = float(sys.argv[5])
successRate = float(sys.argv[6])
habitAge = float(sys.argv[7])

# -----------------------------
# Load Model
# -----------------------------

model = joblib.load(MODEL_PATH)

# -----------------------------
# Prepare Input
# -----------------------------

sample = pd.DataFrame(
    [[
        streak,
        completion,
        longestStreak,
        totalLogs,
        missedLogs,
        successRate,
        habitAge
    ]],
    columns=[
        "streak",
        "completion",
        "longestStreak",
        "totalLogs",
        "missedLogs",
        "successRate",
        "habitAge"
    ]
)

# -----------------------------
# Prediction
# -----------------------------

prediction = int(model.predict(sample)[0])

probabilities = model.predict_proba(sample)[0]

confidence = round(max(probabilities) * 100, 2)

successProbability = round(probabilities[1] * 100, 2)

failureProbability = round(probabilities[0] * 100, 2)

# -----------------------------
# Output
# -----------------------------

print(
    f"{prediction},"
    f"{confidence},"
    f"{successProbability},"
    f"{failureProbability}"
)