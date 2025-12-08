import dotenv from "dotenv";
dotenv.config(); // LOAD .env BEFORE ANYTHING ELSE!!!

import app from "./app.js";

const PORT = process.env.PORT || 5000;

console.log("ENV Test:", process.env.GROQ_API_KEY);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
