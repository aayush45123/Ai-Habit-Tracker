from sklearn.ensemble import RandomForestClassifier
import joblib
import pandas as pd

data = pd.DataFrame([
    [5,90,1],
    [2,40,0],
    [15,95,1],
    [1,20,0],
], columns=["streak","completion","target"])

X = data[["streak","completion"]]
y = data["target"]

model = RandomForestClassifier()

model.fit(X,y)

joblib.dump(
    model,
    "model.pkl"
)

print("trained")