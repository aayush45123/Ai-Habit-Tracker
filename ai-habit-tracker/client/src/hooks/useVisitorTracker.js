import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../utils/api";

function getOrCreateVisitorId() {
  try {
    let id = localStorage.getItem("visitorId");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "v-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("visitorId", id);
    }
    return id;
  } catch {
    return "anonymous-" + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * useVisitorTracker
 * Tracks web page visitors (both non-logged in guests and authenticated users).
 * Fires on every route change and records path, referrer, and visitorId.
 * Completely silent on errors to never disturb the user.
 */
export default function useVisitorTracker() {
  const location = useLocation();
  const lastTrackedRef = useRef({ path: null, time: 0 });

  useEffect(() => {
    const currentPath = location.pathname;
    const now = Date.now();

    // Debounce duplicate tracking calls for the same path within 2.5 seconds
    // (e.g. React 19 StrictMode double-invocations or rapid rerenders)
    if (
      lastTrackedRef.current.path === currentPath &&
      now - lastTrackedRef.current.time < 2500
    ) {
      return;
    }

    lastTrackedRef.current = { path: currentPath, time: now };

    const visitorId = getOrCreateVisitorId();

    api
      .post("/visitors/track", {
        visitorId,
        path: currentPath,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      })
      .catch(() => {
        // Silent failure — never block or alert the user
      });
  }, [location.pathname]);
}
