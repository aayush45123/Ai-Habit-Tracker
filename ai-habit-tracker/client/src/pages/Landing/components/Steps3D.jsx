import React from "react";
import TiltCard from "./TiltCard";
import { Sparkles, Compass, CheckCircle2, Trophy, ArrowRight } from "lucide-react";

export default function Steps3D() {
  const steps = [
    {
      num: "01",
      tag: "Foundation",
      icon: <Compass size={24} />,
      title: "Set Your Non-Negotiables",
      desc: "Select curated habits from high-performance templates or engineer custom routines calibrated to your schedule.",
    },
    {
      num: "02",
      tag: "Execution",
      icon: <CheckCircle2 size={24} />,
      title: "Track & Build Momentum",
      desc: "Check off habits with tactile satisfaction. Lock in focus sessions with the Pomodoro timer and log nutrition effortlessly.",
    },
    {
      num: "03",
      tag: "Evolution",
      icon: <Trophy size={24} />,
      title: "AI Optimization & Streaks",
      desc: "Our neural algorithms spot friction before you fail. Unlock levels, conquer the 21-Day challenge, and become unstoppable.",
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          position: "relative",
        }}
      >
        {steps.map((st, i) => (
          <TiltCard key={i} maxTilt={9} scale={1.03}>
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "3px solid #000000",
                boxShadow: "8px 8px 0 0 #000000",
                padding: "2.5rem 2rem",
                borderRadius: "12px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Giant Watermark Number */}
              <div
                style={{
                  position: "absolute",
                  top: "-15px",
                  right: "15px",
                  fontSize: "5.5rem",
                  fontWeight: 900,
                  color: "#000000",
                  opacity: 0.06,
                  userSelect: "none",
                  lineHeight: 1,
                  fontFamily: "var(--font-primary)",
                }}
              >
                {st.num}
              </div>

              {/* Step Tag & Icon */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.75rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "3px 3px 0 0 #444444",
                  }}
                >
                  {st.icon}
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    padding: "0.25rem 0.65rem",
                    backgroundColor: "#f5f5f5",
                    border: "1.5px solid #000000",
                    borderRadius: "4px",
                  }}
                >
                  STEP {st.num}
                </span>
              </div>

              <h4
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 900,
                  color: "#000000",
                  margin: "0 0 0.85rem 0",
                  letterSpacing: "-0.5px",
                }}
              >
                {st.title}
              </h4>

              <p
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.65,
                  color: "#555555",
                  margin: 0,
                  flexGrow: 1,
                }}
              >
                {st.desc}
              </p>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
