import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Auto-attach JWT token and Session ID to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const sessionId = localStorage.getItem("sessionId");
  if (sessionId) {
    config.headers["X-Session-Id"] = sessionId;
  }
  return config;
});

/**
 * Endpoints where a 401 should NOT trigger a full logout redirect.
 * These are background/analytics calls that should fail silently.
 */
const SILENT_401_PATHS = [
  "/activity/heartbeat",
  "/activity/session/logout",
  "/activity/session/init",
];

// Prevent multiple rapid redirects (e.g. parallel requests all returning 401)
let isRedirectingToLogin = false;

// Auto-logout on 401 (expired / invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      // Never redirect for background analytics/activity calls
      const isSilent = SILENT_401_PATHS.some((path) => requestUrl.includes(path));
      if (isSilent) {
        return Promise.reject(error);
      }

      // Only hard-redirect once, even if many requests fail simultaneously
      if (isRedirectingToLogin) {
        return Promise.reject(error);
      }

      const hadToken = !!localStorage.getItem("token");
      if (hadToken) {
        isRedirectingToLogin = true;
        localStorage.removeItem("token");
        localStorage.removeItem("sessionId");
        // Small delay so any in-flight React state updates can settle
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
