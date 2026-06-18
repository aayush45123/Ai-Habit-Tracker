from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

csv_path = os.path.join(
    BASE_DIR,
    "habits.csv"
)

data = pd.read_csv(csv_path)

X = data[
    ["streak","completion"]
]

y = data["target"]

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X,y)

joblib.dump(
    model,
    os.path.join(
        BASE_DIR,
        "model.pkl"
    )
)

print(
    "MODEL TRAINED FROM REAL DATA"
)