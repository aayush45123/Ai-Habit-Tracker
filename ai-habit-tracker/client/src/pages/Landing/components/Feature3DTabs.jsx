import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  BarChart3,
  Flame,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import aiInsightsImg from "../../../assets/ai_insights.png";
import analyticsImg from "../../../assets/analytics.png";
import challengeImg from "../../../assets/21.png";
import timetableImg from "../../../assets/timetable.png";
import pomodoroImg from "../../../assets/pomodoro.png";

export default function Feature3DTabs() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: "ai",
      label: "AI Neural Coach",
      icon: <Brain size={18} />,
      title: "Personalized Intelligence Tailored to Your Biology",
      subtitle:
        "Our neural models analyze your daily energy dips, routine bottlenecks, and completion velocity to recommend the exact adjustments that keep your streak alive.",
      image: aiInsightsImg,
      highlights: [
        "Predictive fatigue detection before you drop a habit",
        "Context-aware recommendations based on your historical peak hours",
        "Real-time conversational AI coach for personalized advice",
      ],
      metric: "94.2% Streak Retention Rate",
    },
    {
      id: "analytics",
      label: "Deep Analytics",
      icon: <BarChart3 size={18} />,
      title: "GitHub-Style Consistency Heatmaps & Trend Curves",
      subtitle:
        "Visualize your long-term momentum with institutional-grade data. Uncover hidden correlations between your workout, sleep, and deep work productivity.",
      image: analyticsImg,
      highlights: [
        "365-day habit density heatmaps showing real compounding growth",
        "Category breakdown to maintain holistic work-life synergy",
        "Exportable PDF and JSON reports for weekly reviews",
      ],
      metric: "+48% Long-Term Adherence",
    },
    {
      id: "challenge",
      label: "21-Day Challenge",
      icon: <Flame size={18} />,
      title: "Rewire Your Brain Through 21 Days of Neuroplasticity",
      subtitle:
        "Behavioral science proves that 21 consecutive days of consistent action lays down permanent neural pathways. Join guided cohort challenges and climb leaderboards.",
      image: challengeImg,
      highlights: [
        "Milestone checkpoints with dynamic XP and badge unlocks",
        "Visual streak armor to protect against accidental slip-ups",
        "Public or private accountability boards",
      ],
      metric: "Over 50,000+ Completed Challenges",
    },
    {
      id: "timetable",
      label: "Smart Timetable",
      icon: <Calendar size={18} />,
      title: "Algorithmic Time-Blocking Synced with Your Habits",
      subtitle:
        "Stop reacting to chaos. Effortlessly structure your day into optimized time slots that automatically reserve energy for your non-negotiable habits.",
      image: timetableImg,
      highlights: [
        "One-click timetable generation with AI adaptive scheduling",
        "Direct workout and nutrition slot synchronization",
        "Conflict warnings when your schedule threatens your habit goals",
      ],
      metric: "Save 3.5 Hours Every Week",
    },
    {
      id: "focus",
      label: "Pomodoro & Synergy",
      icon: <Clock size={18} />,
      title: "Precision Focus Sessions Integrated into Habit Tracking",
      subtitle:
        "Combine the Pomodoro technique with calorie and nutrition logging to turn every study or work block into a quantifiable victory.",
      image: pomodoroImg,
      highlights: [
        "Customizable 25/5 and 50/10 focus intervals with audio cues",
        "Direct XP rewards upon session completion",
        "Instant calorie and macro accountability companion",
      ],
      metric: "2.4x Deep Work Output",
    },
  ];

  const current = tabs[activeTab];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      {/* Tab Navigation Pill Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
          marginBottom: "3rem",
        }}
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.4rem",
                backgroundColor: isActive ? "#000000" : "#ffffff",
                color: isActive ? "#ffffff" : "#000000",
                border: "2.5px solid #000000",
                boxShadow: isActive ? "5px 5px 0 0 #000000" : "3px 3px 0 0 #000000",
                transform: isActive ? "translate(-2px, -2px)" : "translate(0, 0)",
                fontSize: "0.9rem",
                fontWeight: 800,
                cursor: "pointer",
                borderRadius: "8px",
                transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 3D Stage */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "3rem",
          alignItems: "center",
          backgroundColor: "#ffffff",
          border: "3px solid #000000",
          boxShadow: "10px 10px 0 0 #000000",
          borderRadius: "14px",
          padding: "3rem 2.5rem",
        }}
      >
        {/* Left Side: Copy & Highlights */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.3rem 0.8rem",
              backgroundColor: "#f5f5f5",
              border: "1.5px solid #000000",
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "1.25rem",
            }}
          >
            <Sparkles size={13} strokeWidth={2.5} />
            <span>{current.metric}</span>
          </div>

          <h3
            style={{
              fontSize: "2.1rem",
              fontWeight: 900,
              color: "#000000",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              margin: "0 0 1rem 0",
            }}
          >
            {current.title}
          </h3>

          <p
            style={{
              fontSize: "1.05rem",
              color: "#555555",
              lineHeight: 1.65,
              marginBottom: "1.75rem",
            }}
          >
            {current.subtitle}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
              marginBottom: "2.25rem",
            }}
          >
            {current.highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a1a1a",
                }}
              >
                <CheckCircle2
                  size={19}
                  color="#000000"
                  strokeWidth={2.5}
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <span>{h}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link
              to="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.85rem 1.75rem",
                backgroundColor: "#000000",
                color: "#ffffff",
                border: "2px solid #000000",
                boxShadow: "4px 4px 0 0 #000000",
                fontSize: "0.95rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>Unlock {current.label} Free</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Right Side: 3D Perspective Visual Display */}
        <div
          style={{
            perspective: "1200px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateY(-8deg) rotateX(4deg)",
              transition: "transform 0.4s ease",
              width: "100%",
              maxWidth: "520px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "3px solid #000000",
              boxShadow: "12px 12px 0 0 #000000",
              backgroundColor: "#f5f5f5",
            }}
          >
            <div
              style={{
                padding: "0.6rem 1rem",
                backgroundColor: "#eeeeee",
                borderBottom: "2px solid #000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#27c93f" }} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                HABITAI • {current.label}
              </span>
            </div>
            <img
              src={current.image}
              alt={current.title}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
                minHeight: "300px",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
