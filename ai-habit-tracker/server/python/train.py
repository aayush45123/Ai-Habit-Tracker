from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

csv_path = os.path.join(BASE_DIR, "habits.csv")

# -----------------------------
# Load Dataset
# -----------------------------
data = pd.read_csv(csv_path)

print("=" * 60)
print("DATASET LOADED")
print("=" * 60)
print(data.head())
print()

# -----------------------------
# Features
# -----------------------------
feature_columns = [
    "streak",
    "completion",
    "longestStreak",
    "totalLogs",
    "missedLogs",
    "successRate",
    "habitAge"
]

X = data[feature_columns]

# -----------------------------
# Target
# -----------------------------
y = data["target"]

# -----------------------------
# Class Distribution
# -----------------------------
print("=" * 60)
print("CLASS DISTRIBUTION")
print("=" * 60)
print(y.value_counts())
print()

# -----------------------------
# Train Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# -----------------------------
# Train Model
# -----------------------------
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=5,
    min_samples_split=5,
    min_samples_leaf=3,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

# -----------------------------
# Evaluate
# -----------------------------
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)
trainAccuracy = model.score(X_train, y_train)

print("=" * 60)
print("MODEL EVALUATION")
print("=" * 60)
print(f"Training Accuracy : {trainAccuracy*100:.2f}%")
print(f"Testing Accuracy  : {accuracy*100:.2f}%")
print()

print(classification_report(y_test, predictions))

# -----------------------------
# Feature Importance
# -----------------------------
print("=" * 60)
print("FEATURE IMPORTANCE")
print("=" * 60)

importance = pd.DataFrame({
    "Feature": feature_columns,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print(importance.to_string(index=False))
print()

# -----------------------------
# Save Model
# -----------------------------
model_path = os.path.join(BASE_DIR, "model.pkl")

joblib.dump(model, model_path)

print("=" * 60)
print("MODEL TRAINED SUCCESSFULLY")
print("=" * 60)
print(f"Training Samples : {len(X_train)}")
print(f"Testing Samples  : {len(X_test)}")
print(f"Features Used    : {feature_columns}")
print(f"Model Saved At   : {model_path}")