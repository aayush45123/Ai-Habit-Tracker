import React, { useState, useRef, useCallback } from "react";
import { Flame, Brain, CheckCircle2, Zap, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import dashboardImg from "../../../assets/dashboard.png";

export default function Hero3DShowcase() {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({
    rotateX: -6,
    rotateY: 8,
    glareX: 30,
    glareY: 20,
    isHovered: false,
  });

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 14;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setCoords({
      rotateX,
      rotateY,
      glareX,
      glareY,
      isHovered: true,
    });
  }, []);

  const handleMouseLeave = () => {
    setCoords({
      rotateX: -4,
      rotateY: 6,
      glareX: 40,
      glareY: 30,
      isHovered: false,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1400px",
        width: "100%",
        maxWidth: "1060px",
        margin: "2.5rem auto 0",
        padding: "1rem",
        position: "relative",
      }}
    >
      {/* 3D Tilted Device Container */}
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${coords.rotateX.toFixed(2)}deg) rotateY(${coords.rotateY.toFixed(2)}deg) translateZ(0px)`,
          transition: coords.isHovered
            ? "transform 0.08s ease-out"
            : "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
          position: "relative",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          border: "3px solid #000000",
          boxShadow: coords.isHovered
            ? "0 30px 60px rgba(0,0,0,0.22), 16px 16px 0 0 #000000"
            : "0 20px 45px rgba(0,0,0,0.14), 12px 12px 0 0 #000000",
          overflow: "visible",
        }}
      >
        {/* Device Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            backgroundColor: "#f5f5f5",
            borderBottom: "2px solid #000000",
            borderTopLeftRadius: "13px",
            borderTopRightRadius: "13px",
            transform: "translateZ(20px)",
          }}
        >
          <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#ff5f56", border: "1px solid #e0443e" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#ffbd2e", border: "1px solid #dea123" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#27c93f", border: "1px solid #1aab29" }} />
          </div>

          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#333333",
              backgroundColor: "#ffffff",
              padding: "0.2rem 1rem",
              borderRadius: "20px",
              border: "1px solid #000000",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.5px",
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.5} color="#000000" />
            <span>app.habitai.io/dashboard</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#27c93f", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>LIVE AI SYNC</span>
          </div>
        </div>

        {/* Dashboard Image Viewport */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#000000",
            borderBottomLeftRadius: "13px",
            borderBottomRightRadius: "13px",
            maxHeight: "540px",
          }}
        >
          <img
            src={dashboardImg}
            alt="HabitAI Interactive Dashboard Interface"
            loading="eager"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "cover",
              transform: "translateZ(0px)",
              filter: "contrast(1.02)",
            }}
          />

          {/* Dynamic Glare Sheen Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at ${coords.glareX}% ${coords.glareY}%, rgba(255, 255, 255, 0.22), transparent 60%)`,
              pointerEvents: "none",
              mixBlendMode: "overlay",
              zIndex: 5,
            }}
          />
        </div>

        {/* ─── 3D FLOATING LAYER 1: Streak Badge (Top Left) ─── */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "-4%",
            transform: "translateZ(65px)",
            backgroundColor: "#ffffff",
            border: "2.5px solid #000000",
            boxShadow: "6px 6px 0 0 #000000",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            zIndex: 20,
            animation: "floatBadge 4s ease-in-out infinite",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              backgroundColor: "#000000",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "2px 2px 0 0 #555555",
            }}
          >
            <Flame size={24} color="#ff9500" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#000000", display: "flex", alignItems: "center", gap: "4px" }}>
              24-Day Streak 🔥
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555555" }}>
              Top 1% Consistent Globally
            </div>
          </div>
        </div>

        {/* ─── 3D FLOATING LAYER 2: AI Neural Insight (Top Right) ─── */}
        <div
          style={{
            position: "absolute",
            top: "22%",
            right: "-4%",
            transform: "translateZ(80px)",
            backgroundColor: "#ffffff",
            border: "2.5px solid #000000",
            boxShadow: "6px 6px 0 0 #000000",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            zIndex: 20,
            animation: "floatBadge 4.5s ease-in-out infinite 0.7s",
            maxWidth: "280px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              backgroundColor: "#000000",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Brain size={22} color="#00ffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000" }}>
              AI Neural Coach
            </div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#222222", lineHeight: 1.3 }}>
              "Energy peak at 9:00 AM. Deep Work session recommended."
            </div>
          </div>
        </div>

        {/* ─── 3D FLOATING LAYER 3: Habit Complete Checkmark (Bottom Left) ─── */}
        <div
          style={{
            position: "absolute",
            bottom: "-6%",
            left: "6%",
            transform: "translateZ(75px)",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "2.5px solid #ffffff",
            boxShadow: "6px 6px 0 0 rgba(0,0,0,0.7)",
            padding: "0.85rem 1.35rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            zIndex: 20,
            animation: "floatBadge 5s ease-in-out infinite 1.4s",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#27c93f",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={22} strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 800, letterSpacing: "0.3px" }}>
              Daily Goals: 100% Done
            </div>
            <div style={{ fontSize: "0.75rem", color: "#cccccc" }}>
              +150 XP Earned • Level 14 Reached
            </div>
          </div>
        </div>

        {/* ─── 3D FLOATING LAYER 4: Deep Focus Metric (Bottom Right) ─── */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            right: "-2%",
            transform: "translateZ(55px)",
            backgroundColor: "#ffffff",
            border: "2.5px solid #000000",
            boxShadow: "6px 6px 0 0 #000000",
            padding: "0.75rem 1.15rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            zIndex: 20,
            animation: "floatBadge 4.2s ease-in-out infinite 1.9s",
          }}
        >
          <Zap size={20} color="#000000" strokeWidth={2.5} />
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 900 }}>
              Deep Focus: 90m Logged
            </div>
            <div style={{ fontSize: "0.7rem", color: "#666666", fontWeight: 700 }}>
              25m Pomodoro Protocol Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
