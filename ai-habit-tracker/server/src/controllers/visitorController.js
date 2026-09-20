import jwt from "jsonwebtoken";
import VisitorLog from "../models/VisitorLog.js";
import { parseUserAgent } from "../services/activity.service.js";

/**
 * Public endpoint to track page visits from both guests (non-logged-in)
 * and authenticated users.
 */
export async function trackVisit(req, res) {
  try {
    const { visitorId, path = "/", referrer = "" } = req.body;

    if (!visitorId || typeof visitorId !== "string") {
      return res.status(400).json({ message: "visitorId is required" });
    }

    let userId = null;
    let isGuest = true;

    // Optional authentication check from Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && token !== "null" && token !== "undefined") {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded?.userId) {
            userId = decoded.userId;
            isGuest = false;
          }
        } catch {
          // Token expired or invalid - treat as guest
        }
      }
    }

    const userAgent = req.headers["user-agent"] || "";
    const { deviceType, browser } = parseUserAgent(userAgent);

    const cleanPath = (typeof path === "string" ? path.slice(0, 200) : "/").split("?")[0] || "/";
    const cleanReferrer = typeof referrer === "string" ? referrer.slice(0, 300) : "";

    await VisitorLog.create({
      visitorId: visitorId.slice(0, 100),
      userId,
      isGuest,
      path: cleanPath,
      referrer: cleanReferrer,
      deviceType,
      browser,
      timestamp: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[VisitorTracking] Error logging visit:", error);
    return res.status(500).json({ message: "Failed to record visit" });
  }
}
