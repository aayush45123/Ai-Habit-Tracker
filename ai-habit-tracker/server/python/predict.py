import sys
import joblib

streak = float(sys.argv[1])
completion = float(sys.argv[2])

model = joblib.load("model.pkl")

result = model.predict(
    [[streak, completion]]
)

print(result[0])