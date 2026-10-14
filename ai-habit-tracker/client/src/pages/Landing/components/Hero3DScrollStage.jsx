import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Flame,
  Brain,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import dashboardImg from "../../../assets/dashboard.png";

gsap.registerPlugin(ScrollTrigger);

export default function Hero3DScrollStage() {
  const containerRef = useRef(null);
  const textContentRef = useRef(null);
  const mockupViewportRef = useRef(null);
  const badgeStreakRef = useRef(null);
  const badgeAiRef = useRef(null);
  const badgeHabitsRef = useRef(null);
  const badgeFocusRef = useRef(null);
  const statsBarRef = useRef(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Timeline pinned to scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 0.75,
          anticipatePin: 1,
        },
      });

      // ─── Phase 1: Text zooms towards camera and fades as user scrolls ───
      tl.to(
        textContentRef.current,
        {
          scale: 1.18,
          y: -70,
          opacity: 0,
          ease: "power1.inOut",
          duration: 0.35,
        },
        0
      );

      // ─── Phase 2: 3D Device un-tilts from pitch angle & zooms towards viewer ───
      tl.fromTo(
        mockupViewportRef.current,
        {
          rotateX: 24,
          rotateY: -4,
          scale: 0.84,
          y: 70,
          transformPerspective: 1300,
        },
        {
          rotateX: 0,
          rotateY: 0,
          scale: 1.04,
          y: -10,
          ease: "power2.out",
          duration: 0.55,
        },
        0.1
      );

      // ─── Phase 3: Floating 3D Badges fly in from spatial Z-depth and dock ───
      tl.fromTo(
        badgeStreakRef.current,
        {
          z: 220,
          scale: 0.5,
          opacity: 0,
          x: -40,
        },
        {
          z: 0,
          scale: 1,
          opacity: 1,
          x: 0,
          ease: "back.out(1.4)",
          duration: 0.4,
        },
        0.25
      );

      tl.fromTo(
        badgeAiRef.current,
        {
          z: 260,
          scale: 0.5,
          opacity: 0,
          x: 40,
        },
        {
          z: 0,
          scale: 1,
          opacity: 1,
          x: 0,
          ease: "back.out(1.4)",
          duration: 0.4,
        },
        0.3
      );

      tl.fromTo(
        badgeHabitsRef.current,
        {
          z: 190,
          scale: 0.6,
          opacity: 0,
          y: 35,
        },
        {
          z: 0,
          scale: 1,
          opacity: 1,
          y: 0,
          ease: "back.out(1.4)",
          duration: 0.4,
        },
        0.35
      );

      tl.fromTo(
        badgeFocusRef.current,
        {
          z: 190,
          scale: 0.6,
          opacity: 0,
          y: 35,
        },
        {
          z: 0,
          scale: 1,
          opacity: 1,
          y: 0,
          ease: "back.out(1.4)",
          duration: 0.4,
        },
        0.4
      );

      // ─── Phase 4: Stats bar smoothly settles into resting position ───
      tl.fromTo(
        statsBarRef.current,
        {
          opacity: 0.4,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          ease: "power1.out",
          duration: 0.3,
        },
        0.45
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={containerRef}
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        padding: "3rem 1.5rem 2rem",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {/* ─── Hero Text Content (Transforms towards viewer on scroll) ─── */}
      <div
        ref={textContentRef}
        style={{
          maxWidth: "880px",
          margin: "0 auto 1.5rem",
          textAlign: "center",
          willChange: "transform, opacity",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "0.45rem 1.25rem",
            backgroundColor: "#f7f7f7",
            border: "2px solid #000000",
            boxShadow: "3px 3px 0 0 #000000",
            borderRadius: "30px",
            fontSize: "0.8rem",
            fontWeight: 900,
            color: "#000000",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: "1.5rem",
          }}
        >
          <Zap size={15} strokeWidth={2.75} />
          <span>AI-Powered Habit Tracking • Spatial 3D Engine</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.75rem, 5.5vw, 4.4rem)",
            fontWeight: 900,
            color: "#000000",
            lineHeight: 1.08,
            letterSpacing: "-1.8px",
            margin: "0 0 1.25rem 0",
          }}
        >
          Build Better Habits,
          <br />
          <span
            style={{
              display: "inline-block",
              background: "linear-gradient(90deg, #000000 0%, #555555 50%, #000000 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 5s linear infinite",
            }}
          >
            Transform Your Life.
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
            lineHeight: 1.65,
            color: "#555555",
            margin: "0 auto 2rem",
            maxWidth: "680px",
          }}
        >
          Track daily non-negotiables, build compounding streaks, and optimize your
          schedule with neural AI recommendations and 21-day neuroplasticity challenges.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <Link
            to="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "1rem 2.25rem",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "2.5px solid #000000",
              boxShadow: "5px 5px 0 0 #000000",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: 900,
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <span>Start Free Today</span>
            <ArrowRight size={18} strokeWidth={2.75} />
          </Link>

          <button
            onClick={() => scrollToSection("feature-vault")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "1rem 2rem",
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "2.5px solid #000000",
              boxShadow: "5px 5px 0 0 #000000",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: 800,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <span>Explore 3D Vault</span>
            <ChevronDown size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ─── 3D Interactive Device Viewport (Unfolds & Un-tilts on Scroll) ─── */}
      <div
        style={{
          perspective: "1400px",
          width: "100%",
          maxWidth: "1020px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          ref={mockupViewportRef}
          style={{
            transformStyle: "preserve-3d",
            willChange: "transform",
            borderRadius: "14px",
            backgroundColor: "#ffffff",
            border: "3px solid #000000",
            boxShadow: "14px 14px 0 0 #000000",
            overflow: "visible",
            position: "relative",
          }}
        >
          {/* Mockup Titlebar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.65rem 1.25rem",
              backgroundColor: "#f5f5f5",
              borderBottom: "2px solid #000000",
              borderTopLeftRadius: "11px",
              borderTopRightRadius: "11px",
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
                color: "#222222",
                backgroundColor: "#ffffff",
                padding: "0.2rem 1rem",
                borderRadius: "20px",
                border: "1px solid #000000",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ShieldCheck size={13} strokeWidth={2.5} color="#000000" />
              <span>app.habitai.io/dashboard</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#27c93f", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>LIVE NEURAL SYNC</span>
            </div>
          </div>

          {/* Real High-Res Dashboard Preview */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#000000",
              borderBottomLeftRadius: "11px",
              borderBottomRightRadius: "11px",
              maxHeight: "500px",
            }}
          >
            <img
              src={dashboardImg}
              alt="HabitAI Intelligent Command Center"
              loading="eager"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
              }}
            />
          </div>

          {/* ─── 3D FLOATING HUD BADGE 1: Top-Left Streak ─── */}
          <div
            ref={badgeStreakRef}
            style={{
              position: "absolute",
              top: "10%",
              left: "-3%",
              backgroundColor: "#ffffff",
              border: "2.5px solid #000000",
              boxShadow: "6px 6px 0 0 #000000",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              zIndex: 30,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={22} color="#ff9500" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#000000" }}>
                24-Day Streak 🔥
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555555" }}>
                Top 1% Consistent Globally
              </div>
            </div>
          </div>

          {/* ─── 3D FLOATING HUD BADGE 2: Top-Right AI Insight ─── */}
          <div
            ref={badgeAiRef}
            style={{
              position: "absolute",
              top: "18%",
              right: "-3%",
              backgroundColor: "#ffffff",
              border: "2.5px solid #000000",
              boxShadow: "6px 6px 0 0 #000000",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              zIndex: 30,
              maxWidth: "280px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Brain size={22} color="#00ffff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                AI Neural Coach
              </div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#222222", lineHeight: 1.3 }}>
                "Morning focus peak in 30 mins. Pomodoro queued."
              </div>
            </div>
          </div>

          {/* ─── 3D FLOATING HUD BADGE 3: Bottom-Left Completion ─── */}
          <div
            ref={badgeHabitsRef}
            style={{
              position: "absolute",
              bottom: "-5%",
              left: "5%",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "2.5px solid #ffffff",
              boxShadow: "6px 6px 0 0 rgba(0,0,0,0.6)",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              zIndex: 30,
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "#27c93f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={20} strokeWidth={3} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>
                Daily Habits: 100% Completed
              </div>
              <div style={{ fontSize: "0.72rem", color: "#cccccc" }}>
                +150 XP Earned • Level 14 Active
              </div>
            </div>
          </div>

          {/* ─── 3D FLOATING HUD BADGE 4: Bottom-Right Focus ─── */}
          <div
            ref={badgeFocusRef}
            style={{
              position: "absolute",
              bottom: "8%",
              right: "-2%",
              backgroundColor: "#ffffff",
              border: "2.5px solid #000000",
              boxShadow: "6px 6px 0 0 #000000",
              padding: "0.7rem 1.15rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              zIndex: 30,
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

        {/* ─── Bottom Stats Bar (Docked under device) ─── */}
        <div
          ref={statsBarRef}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "2.5rem",
            padding: "1.5rem 2rem",
            backgroundColor: "#ffffff",
            border: "3px solid #000000",
            boxShadow: "7px 7px 0 0 #000000",
            borderRadius: "12px",
            margin: "2rem auto 0",
            maxWidth: "760px",
          }}
        >
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#000000", lineHeight: 1.1 }}>
              10,000+
            </div>
            <div style={{ fontSize: "0.75rem", color: "#666666", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Active Trackers
            </div>
          </div>
          <div style={{ width: "2px", height: "42px", backgroundColor: "#000000" }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#000000", lineHeight: 1.1 }}>
              500,000+
            </div>
            <div style={{ fontSize: "0.75rem", color: "#666666", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Habits Logged
            </div>
          </div>
          <div style={{ width: "2px", height: "42px", backgroundColor: "#000000" }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#000000", lineHeight: 1.1 }}>
              98.4%
            </div>
            <div style={{ fontSize: "0.75rem", color: "#666666", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Streak Consistency
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
