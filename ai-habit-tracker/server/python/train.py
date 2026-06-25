from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

csv_path = os.path.join(BASE_DIR, "habits.csv")

# Read dataset
data = pd.read_csv(csv_path)

# Features
X = data[["streak"]]

# Target
y = data["target"]

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

# Save model
joblib.dump(
    model,
    os.path.join(BASE_DIR, "model.pkl")
)

print("✅ MODEL TRAINED SUCCESSFULLY")
print(f"Training Samples : {len(data)}")
print(f"Features Used    : {list(X.columns)}")