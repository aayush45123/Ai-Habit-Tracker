import crypto from "crypto";
import UserSession from "../models/UserSession.js";
import ActivityEvent from "../models/ActivityEvent.js";

/**
 * Safely parse User-Agent header into device type and browser name
 */
export function parseUserAgent(ua = "") {
  const uaLower = ua.toLowerCase();

  // Device Detection
  let deviceType = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = "mobile";
  }

  // Browser Detection
  let browser = "Other";
  if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
    browser = "Opera";
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
  }

  return { deviceType, browser };
}

/**
 * Whitelist sanitize metadata object to guarantee no sensitive data is stored
 */
export function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object") return {};

  const sanitized = {};
  const allowedKeys = [
    "habitId",
    "category",
    "frequency",
    "status",
    "streak",
    "challengeId",
    "challengeTitle",
    "habitIndex",
    "durationMin",
    "sessionType",
    "type",
    "deviceType",
    "browser",
    "source",
    "count",
  ];

  for (const key of allowedKeys) {
    if (metadata[key] !== undefined) {
      // Ensure values are primitives or short safe strings
      if (
        typeof metadata[key] === "string" ||
        typeof metadata[key] === "number" ||
        typeof metadata[key] === "boolean"
      ) {
        sanitized[key] = metadata[key];
      }
    }
  }

  return sanitized;
}

/**
 * Create a new user session on successful login
 */
export async function createSession({ userId, req }) {
  try {
    const userAgent = req?.headers?.["user-agent"] || "";
    const { deviceType, browser } = parseUserAgent(userAgent);
    const sessionId = crypto.randomUUID();

    const session = await UserSession.create({
      userId,
      sessionId,
      loginAt: new Date(),
      lastActivityAt: new Date(),
      activeDurationSeconds: 0,
      status: "active",
      deviceType,
      browser,
    });

    // Record LOGIN_SUCCESS event
    await recordActivityEvent({
      userId,
      sessionId,
      eventType: "LOGIN_SUCCESS",
      metadata: { deviceType, browser },
    });

    return { sessionId, session };
  } catch (error) {
    console.error("[ActivityService] Error creating session:", error);
    // Return a fallback session ID so login flow doesn't fail
    return { sessionId: crypto.randomUUID(), session: null };
  }
}

/**
 * Close session on user logout
 */
export async function closeSession({ userId, sessionId }) {
  try {
    if (!sessionId) return null;

    const session = await UserSession.findOne({ sessionId, userId });
    if (session) {
      session.status = "closed";
      session.logoutAt = new Date();
      session.lastActivityAt = new Date();
      await session.save();
    }

    await recordActivityEvent({
      userId,
      sessionId,
      eventType: "LOGOUT",
    });

    return session;
  } catch (error) {
    console.error("[ActivityService] Error closing session:", error);
    return null;
  }
}

/**
 * Handle active usage heartbeat (every ~60s)
 * Server-side validated: duration increments cannot exceed realistic delta
 */
export async function heartbeatSession({ userId, sessionId }) {
  try {
    if (!sessionId) {
      return { success: false, message: "Missing sessionId" };
    }

    let session = await UserSession.findOne({ sessionId, userId });

    const now = new Date();

    if (!session) {
      // If session not found, initialize a fresh active session
      session = await UserSession.create({
        userId,
        sessionId,
        loginAt: now,
        lastActivityAt: now,
        activeDurationSeconds: 0,
        status: "active",
      });
      return {
        success: true,
        activeDurationSeconds: 0,
        status: "active",
      };
    }

    // Check if session was already closed
    if (session.status === "closed") {
      return { success: false, message: "Session is closed", status: "closed" };
    }

    const elapsedSeconds = (now.getTime() - new Date(session.lastActivityAt).getTime()) / 1000;

    // If inactivity gap > 30 minutes, mark previous session expired and revive/restart cleanly
    if (elapsedSeconds > 1800) {
      session.status = "expired";
      await session.save();

      await recordActivityEvent({
        userId,
        sessionId,
        eventType: "SESSION_EXPIRED",
      });

      // Revive or restart new active session
      const newSession = await UserSession.create({
        userId,
        sessionId,
        loginAt: now,
        lastActivityAt: now,
        activeDurationSeconds: 0,
        status: "active",
        deviceType: session.deviceType,
        browser: session.browser,
      });

      return {
        success: true,
        activeDurationSeconds: 0,
        status: "active",
      };
    }

    // Valid heartbeat window: between 10s and 300s
    if (elapsedSeconds >= 10) {
      // Bound increment: max 90 seconds per heartbeat to prevent tampering
      const increment = Math.min(Math.round(elapsedSeconds), 90);
      session.activeDurationSeconds = (session.activeDurationSeconds || 0) + increment;
    }

    session.lastActivityAt = now;
    session.status = "active";
    await session.save();

    return {
      success: true,
      activeDurationSeconds: session.activeDurationSeconds,
      status: "active",
    };
  } catch (error) {
    console.error("[ActivityService] Heartbeat error:", error);
    return { success: false, message: "Internal heartbeat error" };
  }
}

/**
 * Record an activity event in a non-blocking, safe manner
 */
export async function recordActivityEvent({
  userId,
  sessionId = null,
  eventType,
  metadata = {},
  req = null,
}) {
  try {
    if (!userId || !eventType) return;

    // If sessionId not passed directly, try extracting from request headers
    const resolvedSessionId =
      sessionId || (req?.headers ? req.headers["x-session-id"] : null);

    const safeMetadata = sanitizeMetadata(metadata);

    // Fire & forget event creation so API endpoints remain fast
    ActivityEvent.create({
      userId,
      sessionId: resolvedSessionId,
      eventType,
      metadata: safeMetadata,
      timestamp: new Date(),
    }).catch((err) => {
      console.error("[ActivityService] Event save failure:", err.message);
    });
  } catch (error) {
    console.error("[ActivityService] Record event error:", error);
  }
}
