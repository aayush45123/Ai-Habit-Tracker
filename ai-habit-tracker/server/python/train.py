from sklearn.ensemble import RandomForestClassifier
import joblib
import pandas as pd

data = pd.DataFrame([
    [1,20,0],
    [2,35,0],
    [5,60,1],
    [8,80,1],
    [15,95,1],
    [3,40,0],
    [12,90,1],
    [4,50,0]
], columns=[
    "streak",
    "completion",
    "target"
])

X = data[["streak","completion"]]
y = data["target"]

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X,y)

joblib.dump(
    model,
    "model.pkl"
)

print("MODEL TRAINED")