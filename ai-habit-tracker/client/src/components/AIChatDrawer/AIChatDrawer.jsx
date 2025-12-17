import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./AIChatDrawer.module.css";

export default function AIChatDrawer({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open]);

  async function fetchHistory() {
    try {
      const res = await api.get("/ai-chat/chat/history");
      setMessages(res.data.history || []);
    } catch (err) {
      console.error("History fetch error", err);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", message: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/ai-chat/chat/message", {
        message: userMsg.message,
      });

      setMessages((prev) => [...prev, res.data.reply]);
    } catch (err) {
      console.error("Send error", err);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.drawer}>
        <header>
          <h3>AI Habit Coach</h3>
          <button onClick={onClose}>✕</button>
        </header>

        <div className={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? styles.user : styles.ai}
            >
              {m.message}
            </div>
          ))}
          {sending && <div className={styles.ai}>Thinking…</div>}
        </div>

        <footer>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about habits, streaks, discipline…"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </footer>
      </div>
    </div>
  );
}
