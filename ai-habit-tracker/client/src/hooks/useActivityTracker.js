import { useEffect, useRef, useCallback } from "react";
import api from "../utils/api";

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useActivityTracker
 * Tracks user activity via browser events and sends heartbeat pings to the server.
 * - Pauses when tab is hidden or user is inactive
 * - Resumes on return
 * - Gracefully handles network failures
 */
export default function useActivityTracker({ isAuthenticated }) {
  const heartbeatTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const isActiveRef = useRef(true);
  const isVisibleRef = useRef(!document.hidden);

  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated || !isActiveRef.current || !isVisibleRef.current) return;

    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) return;

    try {
      await api.post("/activity/heartbeat", { sessionId });
    } catch {
      // Silent failure — never block user for analytics
    }
  }, [isAuthenticated]);

  const resetInactivityTimer = useCallback(() => {
    isActiveRef.current = true;
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      isActiveRef.current = false;
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) return;
    heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        // Resuming — send immediate heartbeat and restart timer
        resetInactivityTimer();
        startHeartbeat();
        sendHeartbeat();
      } else {
        // Tab hidden — stop heartbeat
        stopHeartbeat();
      }
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Browser activity events
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Bootstrap
    resetInactivityTimer();
    startHeartbeat();

    return () => {
      stopHeartbeat();
      clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, sendHeartbeat, startHeartbeat, stopHeartbeat, resetInactivityTimer]);
}
