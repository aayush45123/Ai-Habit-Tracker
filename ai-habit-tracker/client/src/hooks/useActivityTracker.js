// client/src/hooks/useActivityTracker.js  (full replacement)
import { useEffect, useRef, useCallback } from "react";
import api from "../utils/api";

const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

export default function useActivityTracker({ isAuthenticated }) {
  const heartbeatTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const isActiveRef = useRef(true);
  const isVisibleRef = useRef(!document.hidden);

  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated || !isActiveRef.current || !isVisibleRef.current) return;

    try {
      // No stored session (user was already logged in before tracking, or
      // storage was cleared) → ask the server to create one.
      const existing = localStorage.getItem("sessionId");
      const { data } = existing
        ? await api.post("/activity/heartbeat", { sessionId: existing })
        : await api.post("/activity/session/init", {});

      // Server may issue a NEW id (idle > 30 min, or session closed)
      if (data?.sessionId && data.sessionId !== existing) {
        localStorage.setItem("sessionId", data.sessionId);
      }
    } catch {
      // never block the user for analytics
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
        resetInactivityTimer();
        startHeartbeat();
        sendHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    const handleActivity = () => resetInactivityTimer();

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetInactivityTimer();
    startHeartbeat();
    sendHeartbeat(); // ← NEW: register/refresh immediately on app load, not after 60s

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