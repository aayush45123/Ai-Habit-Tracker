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
import { CheckCircle, Award, AlertTriangle, XCircle, Info } from "lucide-react";

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
    success: { bg: "var(--color-accent-primary, #000)", border: "var(--color-border, #000)", icon: <CheckCircle size={18} /> },
    milestone: { bg: "var(--color-accent-primary, #000)", border: "var(--color-border, #000)", icon: <Award size={18} /> },
    warning: { bg: "var(--color-accent-secondary, #222)", border: "var(--color-border, #000)", icon: <AlertTriangle size={18} /> },
    error: { bg: "var(--color-accent-primary, #000)", border: "var(--color-border, #000)", icon: <XCircle size={18} /> },
    info: { bg: "var(--color-accent-secondary, #222)", border: "var(--color-border, #000)", icon: <Info size={18} /> },
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
              backgroundColor: style.bg,
              color: "#fff",
              border: "2px solid #000",
              boxShadow: "4px 4px 0 0 #000",
              padding: "14px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              animation: "slideInRight 0.3s ease",
              cursor: "pointer",
            }}
            onClick={() => onDismiss(n.id)}
          >
            <span style={{ flexShrink: 0, marginTop: "1px" }}>{style.icon}</span>
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
