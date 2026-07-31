import "dotenv/config";

import http from "http";
import app from "./app.js";
import { initSocket } from "./socket/socket.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";

// DO NOT FALL BACK TO 5000 ON RENDER
const PORT = process.env.PORT;

if (!PORT) {
  console.error("PORT is not defined. Exiting...");
  process.exit(1);
}

// Create http server wrapping Express app
const httpServer = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = initSocket(httpServer);
registerSocketHandlers(io);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`⚡ Socket.IO ready on port ${PORT}`);
});
