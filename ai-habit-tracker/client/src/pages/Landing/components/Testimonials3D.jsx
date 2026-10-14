import React from "react";
import TiltCard from "./TiltCard";
import { Star, ShieldCheck, Flame } from "lucide-react";

export default function Testimonials3D() {
  const reviews = [
    {
      name: "Marcus Vance",
      role: "Senior Software Engineer",
      avatar: "MV",
      streak: "72 Days 🔥",
      quote:
        "I was tired of clunky habit trackers with cluttered ads. HabitAI is crisp, laser-fast, and the AI coach actually understands energy management instead of just spamming notifications.",
      rating: 5,
    },
    {
      name: "Dr. Ananya Sharma",
      role: "Resident Physician & Researcher",
      avatar: "AS",
      streak: "48 Days 🔥",
      quote:
        "The 21-Day Challenge changed how I approach my daily non-negotiables. Seeing the heatmaps and compounding streak visual made consistency addictive in the best way possible.",
      rating: 5,
    },
    {
      name: "Liam Chen",
      role: "Founder & Product Designer",
      avatar: "LC",
      streak: "115 Days 🔥",
      quote:
        "The aesthetic and tactile feel is 10/10. It feels like a high-end command center for your life. The Pomodoro and calorie synergy made it an all-in-one daily staple.",
      rating: 5,
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
        }}
      >
        {reviews.map((rev, i) => (
          <TiltCard key={i} maxTilt={8} scale={1.02}>
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "3px solid #000000",
                boxShadow: "7px 7px 0 0 #000000",
                padding: "2rem",
                borderRadius: "10px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div>
                {/* Header: Stars & Streak Badge */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "3px" }}>
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} size={17} fill="#000000" color="#000000" />
                    ))}
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      backgroundColor: "#f5f5f5",
                      border: "1.5px solid #000000",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "4px",
                    }}
                  >
                    {rev.streak}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.65,
                    color: "#222222",
                    fontStyle: "italic",
                    marginBottom: "1.75rem",
                  }}
                >
                  "{rev.quote}"
                </p>
              </div>

              {/* User Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  borderTop: "1.5px solid #eaeaea",
                  paddingTop: "1rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  {rev.avatar}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 900,
                      color: "#000000",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{rev.name}</span>
                    <ShieldCheck size={15} color="#27c93f" strokeWidth={2.5} />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#666666", fontWeight: 700 }}>
                    {rev.role}
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
