import React from "react";
import { Flame, Zap, Trophy, ShieldCheck, Star } from "lucide-react";

export default function LiveCommunityTicker() {
  const events = [
    { icon: <Flame size={15} color="#ff9500" />, text: "Priya M. just hit a 45-day streak in Morning Meditation", time: "1m ago" },
    { icon: <Zap size={15} color="#000000" />, text: "Rohan K. completed a 50-minute Deep Focus Pomodoro", time: "3m ago" },
    { icon: <Trophy size={15} color="#ffbd2e" />, text: "Alex C. unlocked 'Consistency Titan' Level 15", time: "6m ago" },
    { icon: <Flame size={15} color="#ff9500" />, text: "David S. completed all 5 daily non-negotiables", time: "8m ago" },
    { icon: <ShieldCheck size={15} color="#27c93f" />, text: "Elena R. finished the 21-Day Neuro Challenge", time: "12m ago" },
  ];

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#000000",
        color: "#ffffff",
        borderTop: "3px solid #000000",
        borderBottom: "3px solid #000000",
        padding: "0.85rem 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "3rem",
          alignItems: "center",
          whiteSpace: "nowrap",
          animation: "marquee 28s linear infinite",
        }}
      >
        {/* Double the list for infinite scroll */}
        {[...events, ...events].map((evt, i) => (
          <div
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.3px",
              color: "#e6e6e6",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
              }}
            >
              {evt.icon}
            </span>
            <span>{evt.text}</span>
            <span style={{ color: "#888888", fontSize: "0.75rem" }}>• {evt.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
