import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Flame, Sparkles, Trophy, ArrowRight, Sun, Code, Dumbbell } from "lucide-react";

export default function InteractiveHabitSimulator() {
  const [habits, setHabits] = useState([
    {
      id: 1,
      name: "Morning Sunlight & Hydration",
      time: "07:30 AM",
      icon: <Sun size={20} />,
      xp: "+30 XP",
      completed: false,
    },
    {
      id: 2,
      name: "Deep Work Sprint (60m)",
      time: "10:00 AM",
      icon: <Code size={20} />,
      xp: "+50 XP",
      completed: false,
    },
    {
      id: 3,
      name: "Strength Training & Protein",
      time: "05:00 PM",
      icon: <Dumbbell size={20} />,
      xp: "+40 XP",
      completed: false,
    },
  ]);

  const [streak, setStreak] = useState(14);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const toggleHabit = (id) => {
    setHabits((prev) => {
      const next = prev.map((h) => {
        if (h.id === id) {
          const willComplete = !h.completed;
          if (willComplete) {
            setStreak((s) => s + 1);
            triggerConfetti();
          } else {
            setStreak((s) => Math.max(14, s - 1));
          }
          return { ...h, completed: willComplete };
        }
        return h;
      });

      const allCompleted = next.every((h) => h.completed);
      setShowCelebration(allCompleted);
      return next;
    });
  };

  const triggerConfetti = () => {
    const pieces = Array.from({ length: 18 }).map((_, i) => ({
      id: Math.random() + i,
      x: (Math.random() - 0.5) * 260,
      y: -(Math.random() * 120 + 40),
      rot: Math.random() * 360,
      color: ["#000000", "#ff9500", "#333333", "#27c93f", "#666666"][Math.floor(Math.random() * 5)],
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setConfettiPieces([]), 1200);
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const progressPercent = Math.round((completedCount / habits.length) * 100);

  return (
    <div
      style={{
        maxWidth: "880px",
        margin: "0 auto",
        padding: "2.5rem 2rem",
        backgroundColor: "#ffffff",
        border: "3px solid #000000",
        boxShadow: "10px 10px 0 0 #000000",
        position: "relative",
        borderRadius: "12px",
      }}
    >
      {/* Simulator Tag */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "0.35rem 0.9rem",
          backgroundColor: "#f5f5f5",
          border: "2px solid #000000",
          boxShadow: "3px 3px 0 0 #000000",
          fontSize: "0.75rem",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "1rem",
        }}
      >
        <Sparkles size={14} strokeWidth={2.5} />
        <span>Interactive Live Preview</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.75rem",
              fontWeight: 900,
              color: "#000000",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Feel the Dopamine of Progress
          </h3>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#666666",
              margin: "0.4rem 0 0",
            }}
          >
            Click a habit to mark it complete and watch your streak and XP multiply in real-time.
          </p>
        </div>

        {/* Live Streak & Level Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            backgroundColor: "#f5f5f5",
            padding: "0.6rem 1.25rem",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0 0 #000000",
            borderRadius: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Flame size={20} color="#ff9500" strokeWidth={2.5} />
            <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#000000" }}>
              {streak} Days
            </span>
          </div>
          <div style={{ width: "2px", height: "24px", backgroundColor: "#000000" }} />
          <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>
            {completedCount}/{habits.length} Done ({progressPercent}%)
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: "100%",
          height: "10px",
          backgroundColor: "#f0f0f0",
          border: "2px solid #000000",
          marginBottom: "1.5rem",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: "#000000",
            transition: "width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        />
      </div>

      {/* Habit Interactive Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", position: "relative" }}>
        {habits.map((h) => {
          return (
            <div
              key={h.id}
              onClick={() => toggleHabit(h.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                backgroundColor: h.completed ? "#f5f5f5" : "#ffffff",
                border: "2.5px solid #000000",
                boxShadow: h.completed ? "2px 2px 0 0 #000000" : "5px 5px 0 0 #000000",
                transform: h.completed ? "translate(2px, 2px)" : "translate(0, 0)",
                cursor: "pointer",
                transition: "all 0.18s ease-out",
                borderRadius: "8px",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {/* 3D Checkbox */}
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px",
                    border: "2.5px solid #000000",
                    backgroundColor: h.completed ? "#000000" : "#ffffff",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                    boxShadow: h.completed ? "none" : "2px 2px 0 0 #000000",
                  }}
                >
                  {h.completed && <Check size={18} strokeWidth={3.5} />}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: h.completed ? "#777777" : "#000000",
                      textDecoration: h.completed ? "line-through" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{h.name}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888888" }}>
                    Target: {h.time}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  padding: "0.3rem 0.75rem",
                  border: "1.5px solid #000000",
                  backgroundColor: h.completed ? "#000000" : "#f5f5f5",
                  color: h.completed ? "#ffffff" : "#000000",
                  borderRadius: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                {h.xp}
              </div>
            </div>
          );
        })}

        {/* Confetti Particle Layer */}
        {confettiPieces.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "8px",
              height: "8px",
              backgroundColor: p.color,
              pointerEvents: "none",
              transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`,
              transition: "transform 1s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 1s ease",
              opacity: confettiPieces.length > 0 ? 1 : 0,
              zIndex: 30,
            }}
          />
        ))}
      </div>

      {/* Dynamic Conversion Trigger */}
      <div
        style={{
          marginTop: "1.75rem",
          padding: "1.25rem",
          backgroundColor: showCelebration ? "#000000" : "#f7f7f7",
          color: showCelebration ? "#ffffff" : "#000000",
          border: "2px solid #000000",
          boxShadow: "4px 4px 0 0 #000000",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {showCelebration ? (
            <Trophy size={28} color="#ffbd2e" strokeWidth={2.5} />
          ) : (
            <Sparkles size={24} strokeWidth={2} />
          )}
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900 }}>
              {showCelebration
                ? "Perfect Consistency! You've unlocked the 21-Day Blueprint."
                : "Want to track your habits permanently with AI insights?"}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: showCelebration ? "#cccccc" : "#666666",
                fontWeight: 600,
              }}
            >
              Takes 15 seconds to create your free account • No credit card required
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link
            to="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.6rem 1.25rem",
              backgroundColor: showCelebration ? "#ffffff" : "#000000",
              color: showCelebration ? "#000000" : "#ffffff",
              border: "2px solid #000000",
              fontWeight: 900,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textDecoration: "none",
              boxShadow: showCelebration ? "3px 3px 0 0 #ffffff" : "3px 3px 0 0 #000000",
            }}
          >
            <span>Start Free</span>
            <ArrowRight size={15} strokeWidth={3} />
          </Link>
          <Link
            to="/login"
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              color: showCelebration ? "#ffffff" : "#000000",
              textDecoration: "underline",
            }}
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
