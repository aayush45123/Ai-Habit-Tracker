import {
  heartbeatSession,
  closeSession,
  createSession,
} from "../services/activity.service.js";

/**
 * Active Heartbeat Controller (called every ~60s)
 */
export async function sendHeartbeat(req, res) {
  try {
    const userId = req.user._id;
    const sessionId = req.body.sessionId || req.headers["x-session-id"];

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const result = await heartbeatSession({ userId, sessionId });
    return res.json(result);
  } catch (error) {
    console.error("Heartbeat controller error:", error);
    return res.status(500).json({ message: "Failed to process heartbeat" });
  }
}

/**
 * Explicit Session Logout Controller
 */
export async function logoutSession(req, res) {
  try {
    const userId = req.user._id;
    const sessionId = req.body.sessionId || req.headers["x-session-id"];

    if (sessionId) {
      await closeSession({ userId, sessionId });
    }

    return res.json({ message: "Session closed successfully" });
  } catch (error) {
    console.error("Session logout error:", error);
    return res.status(500).json({ message: "Failed to close session" });
  }
}

/**
 * Initialize / Resume Session Controller
 */
export async function initSession(req, res) {
  try {
    const userId = req.user._id;
    const existingSessionId = req.body.sessionId || req.headers["x-session-id"];

    if (existingSessionId) {
      const result = await heartbeatSession({ userId, sessionId: existingSessionId });
      if (result.success && result.status === "active") {
        return res.json({ sessionId: existingSessionId, status: "active" });
      }
    }

    const { sessionId } = await createSession({ userId, req });
    return res.json({ sessionId, status: "active" });
  } catch (error) {
    console.error("Init session error:", error);
    return res.status(500).json({ message: "Failed to initialize session" });
  }
}
