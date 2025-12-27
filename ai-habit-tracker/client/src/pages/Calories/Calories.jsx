import React, { useEffect, useState } from "react";
import api from "../utils/api";

export default function Calories() {
  const [food, setFood] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    const res = await api.get("/calories/status");
    setStatus(res.data);
  }

  async function addFood() {
    const ai = await api.post("/calories/ai/estimate", { foodName: food });

    await api.post("/calories/food", {
      foodName: food,
      calories: ai.data.calories,
    });

    setFood("");
    loadStatus();
  }

  return (
    <div>
      <h2>Calorie Tracker</h2>

      {status && (
        <p>
          {status.remaining >= 0
            ? `Remaining: ${status.remaining} kcal`
            : `Overate by ${Math.abs(status.remaining)} kcal`}
        </p>
      )}

      <input
        value={food}
        onChange={(e) => setFood(e.target.value)}
        placeholder="What did you eat?"
      />
      <button onClick={addFood}>Add</button>
    </div>
  );
}
