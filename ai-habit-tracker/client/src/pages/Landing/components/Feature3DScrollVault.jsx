import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Brain,
  BarChart3,
  Flame,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import aiInsightsImg from "../../../assets/ai_insights.png";
import analyticsImg from "../../../assets/analytics.png";
import challengeImg from "../../../assets/21.png";
import timetableImg from "../../../assets/timetable.png";

gsap.registerPlugin(ScrollTrigger);

export default function Feature3DScrollVault() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const cardsRef = useRef([]);

  const features = [
    {
      id: "ai",
      icon: <Brain size={24} />,
      tag: "Neural Intelligence",
      title: "Predictive AI Habit Optimization",
      desc: "Our neural engine decodes your personal energy cycles, alerting you to fatigue bottlenecks hours before they threaten your streaks.",
      metric: "94.2% Streak Retention Rate",
      image: aiInsightsImg,
      highlights: [
        "Fatigue forecast algorithm",
        "Context-sensitive habit sequencing",
        "Adaptive recovery protocols",
      ],
    },
    {
      id: "analytics",
      icon: <BarChart3 size={24} />,
      tag: "Compounding Growth",
      title: "Institutional-Grade Analytics & Heatmaps",
      desc: "Track every micro-win with 365-day density maps, consistency velocity curves, and multi-variable correlation charts.",
      metric: "+48% Long-Term Adherence",
      image: analyticsImg,
      highlights: [
        "GitHub-style annual density grids",
        "Category balance distribution",
        "Exportable PDF performance audits",
      ],
    },
    {
      id: "challenge",
      icon: <Flame size={24} />,
      tag: "Neuroplasticity",
      title: "21-Day Habit Rewiring Protocol",
      desc: "Transform fleeting willpower into permanent neuro-pathways through structured 21-day cohort challenges and visual milestone checkpoints.",
      metric: "50,000+ Challenges Conquered",
      image: challengeImg,
      highlights: [
        "Milestone XP and tier unlocks",
        "Streak armor fail-safes",
        "Global & private leaderboards",
      ],
    },
    {
      id: "timetable",
      icon: <Calendar size={24} />,
      tag: "Time Blocking",
      title: "Algorithmic Timetable & Focus Synergy",
      desc: "Automatically block non-negotiable habit windows into your day, synchronized directly with Pomodoro sessions and nutritional logs.",
      metric: "Save 3.5 Hours Every Week",
      image: timetableImg,
      highlights: [
        "One-click adaptive AI schedule generator",
        "Direct workout & nutrition integration",
        "Integrated 25/5 & 50/10 focus intervals",
      ],
    },
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const cards = cardsRef.current;
    if (!cards || cards.length === 0) return;

    const ctx = gsap.context(() => {
      // Pin the section and scrub through the 3D unfolding cards
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=320%",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      // Initial card states:
      // Card 0 is front and center.
      // Cards 1, 2, 3 are pitched back in 3D perspective below the camera.
      cards.forEach((card, i) => {
        if (i === 0) {
          gsap.set(card, {
            transformPerspective: 1400,
            transformOrigin: "center center",
            rotateX: 0,
            rotateY: 0,
            z: 0,
            scale: 1,
            opacity: 1,
            yPercent: 0,
          });
        } else {
          gsap.set(card, {
            transformPerspective: 1400,
            transformOrigin: "center top",
            rotateX: 42,
            rotateY: -12,
            z: -260,
            scale: 0.86,
            opacity: 0,
            yPercent: 75,
          });
        }
      });

      // ─── Transition 1: Card 0 folds away -> Card 1 unfolds forward ───
      tl.to(
        cards[0],
        {
          rotateX: -30,
          z: 160,
          yPercent: -65,
          scale: 0.9,
          opacity: 0,
          ease: "power2.inOut",
          duration: 1,
        },
        0.5
      );

      tl.to(
        cards[1],
        {
          rotateX: 0,
          rotateY: 0,
          z: 0,
          yPercent: 0,
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          duration: 1,
        },
        0.5
      );

      // ─── Transition 2: Card 1 folds away -> Card 2 unfolds forward ───
      tl.to(
        cards[1],
        {
          rotateX: -30,
          z: 160,
          yPercent: -65,
          scale: 0.9,
          opacity: 0,
          ease: "power2.inOut",
          duration: 1,
        },
        1.8
      );

      tl.to(
        cards[2],
        {
          rotateX: 0,
          rotateY: 0,
          z: 0,
          yPercent: 0,
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          duration: 1,
        },
        1.8
      );

      // ─── Transition 3: Card 2 folds away -> Card 3 unfolds forward ───
      tl.to(
        cards[2],
        {
          rotateX: -30,
          z: 160,
          yPercent: -65,
          scale: 0.9,
          opacity: 0,
          ease: "power2.inOut",
          duration: 1,
        },
        3.1
      );

      tl.to(
        cards[3],
        {
          rotateX: 0,
          rotateY: 0,
          z: 0,
          yPercent: 0,
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          duration: 1,
        },
        3.1
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="feature-vault"
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        borderTop: "3px solid #000000",
        borderBottom: "3px solid #000000",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "1.5rem",
          zIndex: 10,
          padding: "0 1rem",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "0.35rem 1rem",
            border: "2px solid #000000",
            backgroundColor: "#f7f7f7",
            boxShadow: "3px 3px 0 0 #000000",
            fontSize: "0.75rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "0.75rem",
            borderRadius: "4px",
          }}
        >
          3D Perspective Vault • Scroll to Unfold
        </div>
        <h2
          style={{
            fontSize: "clamp(2rem, 3.8vw, 2.8rem)",
            fontWeight: 900,
            color: "#000000",
            margin: "0 0 0.5rem 0",
            letterSpacing: "-1px",
          }}
        >
          Engineered for Permanent Consistency
        </h2>
      </div>

      {/* 3D Stacking Track */}
      <div
        ref={trackRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1060px",
          height: "560px",
          perspective: "1400px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 1rem",
        }}
      >
        {features.map((feat, idx) => (
          <div
            key={feat.id}
            ref={(el) => (cardsRef.current[idx] = el)}
            style={{
              position: "absolute",
              width: "100%",
              maxWidth: "1020px",
              height: "530px",
              backgroundColor: "#ffffff",
              border: "3px solid #000000",
              boxShadow: "14px 14px 0 0 #000000",
              borderRadius: "14px",
              padding: "2.5rem 3rem",
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: "2.5rem",
              alignItems: "center",
              transformStyle: "preserve-3d",
              willChange: "transform, opacity",
            }}
          >
            {/* Left Column: Copy & Highlights */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "0.3rem 0.85rem",
                  backgroundColor: "#f5f5f5",
                  border: "1.5px solid #000000",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "1rem",
                  width: "fit-content",
                }}
              >
                <Sparkles size={14} strokeWidth={2.5} />
                <span>{feat.metric}</span>
              </div>

              <h3
                style={{
                  fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)",
                  fontWeight: 900,
                  color: "#000000",
                  lineHeight: 1.15,
                  letterSpacing: "-0.5px",
                  margin: "0 0 0.85rem 0",
                }}
              >
                {feat.title}
              </h3>

              <p
                style={{
                  fontSize: "1rem",
                  color: "#555555",
                  lineHeight: 1.6,
                  margin: "0 0 1.5rem 0",
                }}
              >
                {feat.desc}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                  marginBottom: "1.75rem",
                }}
              >
                {feat.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      color: "#1a1a1a",
                    }}
                  >
                    <CheckCircle2 size={17} strokeWidth={2.75} color="#000000" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0.8rem 1.6rem",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  border: "2px solid #000000",
                  boxShadow: "4px 4px 0 0 #000000",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  textDecoration: "none",
                  width: "fit-content",
                }}
              >
                <span>Unlock Free</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>

            {/* Right Column: 3D Visual Mockup */}
            <div
              style={{
                borderRadius: "10px",
                overflow: "hidden",
                border: "2.5px solid #000000",
                boxShadow: "8px 8px 0 0 #000000",
                backgroundColor: "#f5f5f5",
                height: "100%",
                maxHeight: "420px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 0.85rem",
                  backgroundColor: "#eeeeee",
                  borderBottom: "2px solid #000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", gap: "5px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#27c93f" }} />
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  HABITAI • {feat.tag}
                </span>
              </div>
              <img
                src={feat.image}
                alt={feat.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
