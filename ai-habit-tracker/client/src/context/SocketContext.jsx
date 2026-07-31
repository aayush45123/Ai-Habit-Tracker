// client/src/context/SocketContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  connectSocket,
  disconnectSocket,
  onSocketEvent,
  offSocketEvent,
} from "../services/socket.service";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const socket = connectSocket(token);
    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleNotification = (notification) => {
      const id = Date.now();
      const notifWithId = { ...notification, id };
      setNotifications((prev) => [notifWithId, ...prev.slice(0, 9)]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    onSocketEvent("notification:new", handleNotification);

    // Reflect current connection state
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      offSocketEvent("notification:new", handleNotification);
    };
  }, [token, user]);

  /**
   * Subscribe to a socket event with auto-cleanup
   * Returns an unsubscribe function.
   */
  const subscribe = (event, callback) => {
    onSocketEvent(event, callback);
    return () => offSocketEvent(event, callback);
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{ isConnected, subscribe, notifications, dismissNotification }}
    >
      {children}
      {/* Live notification toasts */}
      <NotificationToasts
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </SocketContext.Provider>
  );
}

// ──────────────────────────────────────────
// In-app toast notifications component
// ──────────────────────────────────────────
function NotificationToasts({ notifications, onDismiss }) {
  if (!notifications.length) return null;

  const typeStyles = {
    success: { bg: "#10b981", icon: "✅" },
    milestone: { bg: "linear-gradient(135deg, #f59e0b, #d97706)", icon: "🏆" },
    warning: { bg: "#f59e0b", icon: "⚠️" },
    error: { bg: "#ef4444", icon: "❌" },
    info: { bg: "#6366f1", icon: "ℹ️" },
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "340px",
      }}
    >
      {notifications.map((n) => {
        const style = typeStyles[n.type] || typeStyles.info;
        return (
          <div
            key={n.id}
            style={{
              background:
                typeof style.bg === "string" && style.bg.startsWith("linear")
                  ? style.bg
                  : style.bg,
              backgroundColor:
                typeof style.bg === "string" && !style.bg.startsWith("linear")
                  ? style.bg
                  : undefined,
              color: "#fff",
              borderRadius: "10px",
              padding: "14px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              animation: "slideInRight 0.3s ease",
              cursor: "pointer",
            }}
            onClick={() => onDismiss(n.id)}
          >
            <span style={{ fontSize: "18px", flexShrink: 0 }}>{style.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{n.title}</div>
              <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px" }}>
                {n.message}
              </div>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return ctx;
}

export default SocketContext;
