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
// ─────────────────────────────────────────────────────────────────────────────
// server/src/services/activity.service.js
// REPLACE the existing `heartbeatSession` function with this one.
// Fixes: expired/missing sessions used to re-create the SAME sessionId, which
// violates the unique index and silently failed, so returning users were never
// tracked again. Now a fresh sessionId is issued and returned to the client.
// ─────────────────────────────────────────────────────────────────────────────
export async function heartbeatSession({ userId, sessionId, req = null }) {
  try {
    const now = new Date();

    const startNewSession = async (source) => {
      const ua = req?.headers?.["user-agent"] || "";
      const { deviceType, browser } = parseUserAgent(ua);
      const newSessionId = crypto.randomUUID();

      await UserSession.create({
        userId,
        sessionId: newSessionId,
        loginAt: now,
        lastActivityAt: now,
        activeDurationSeconds: 0,
        status: "active",
        deviceType,
        browser,
      });

      // Counts as a login in the admin "Activity" tab (a returning user opened the app)
      await recordActivityEvent({
        userId,
        sessionId: newSessionId,
        eventType: "LOGIN_SUCCESS",
        metadata: { deviceType, browser, source },
      });

      return {
        success: true,
        sessionId: newSessionId, // client must store this
        activeDurationSeconds: 0,
        status: "active",
        renewed: true,
      };
    };

    const session = sessionId
      ? await UserSession.findOne({ sessionId, userId })
      : null;

    // No session on record, or it was closed by a logout → start a new one
    if (!session || session.status === "closed") {
      return await startNewSession("resume");
    }

    const elapsedSeconds =
      (now.getTime() - new Date(session.lastActivityAt).getTime()) / 1000;

    // Idle > 30 min → expire the old session and start a NEW one (new id)
    if (elapsedSeconds > 1800) {
      session.status = "expired";
      await session.save();
      await recordActivityEvent({ userId, sessionId, eventType: "SESSION_EXPIRED" });
      return await startNewSession("idle_return");
    }

    if (elapsedSeconds >= 10) {
      const increment = Math.min(Math.round(elapsedSeconds), 90);
      session.activeDurationSeconds =
        (session.activeDurationSeconds || 0) + increment;
    }

    session.lastActivityAt = now;
    session.status = "active";
    await session.save();

    return {
      success: true,
      sessionId: session.sessionId,
      activeDurationSeconds: session.activeDurationSeconds,
      status: "active",
    };
  } catch (error) {
    console.error("[ActivityService] Heartbeat error:", error);
    return { success: false, message: "Internal heartbeat error" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// server/src/controllers/activityController.js  (two small edits)
//
// 1) sendHeartbeat: sessionId is no longer required, and pass req through:
//
//      const sessionId = req.body.sessionId || req.headers["x-session-id"] || null;
//      const result = await heartbeatSession({ userId, sessionId, req });
//      return res.json(result);
//
//    (delete the `if (!sessionId) return res.status(400)...` block)
//
// 2) initSession: pass req too:
//
//      const result = await heartbeatSession({ userId, sessionId: existingSessionId, req });
//      if (result.success && result.status === "active") {
//        return res.json({ sessionId: result.sessionId, status: "active" });
//      }
// ─────────────────────────────────────────────────────────────────────────────
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
