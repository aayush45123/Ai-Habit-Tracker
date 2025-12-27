import { useEffect, useState } from "react";
import api from "../utils/api";

export default function CalorieSummary() {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    api.get("/calories/ai/summary").then((res) => {
      setSummary(res.data.items);
    });
  }, []);

  return (
    <ul>
      {summary.map((f) => (
        <li key={f._id}>
          {f.foodName} — {f.calories} kcal
        </li>
      ))}
    </ul>
  );
}
