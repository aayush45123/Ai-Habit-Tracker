import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

// ❌ DO NOT FALL BACK TO 5000 ON RENDER
const PORT = process.env.PORT;

if (!PORT) {
  console.error("❌ PORT is not defined. Exiting...");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
