import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Compass, CheckCircle2, Trophy, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Steps3DScroll() {
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

  const steps = [
    {
      num: "01",
      tag: "Phase 1: Foundation",
      icon: <Compass size={28} />,
      title: "Define Non-Negotiables",
      desc: "Select curated habits from high-performance templates or engineer custom routines tailored to your daily schedule and biological energy curves.",
    },
    {
      num: "02",
      tag: "Phase 2: Execution",
      icon: <CheckCircle2 size={28} />,
      title: "Execute & Lock Streaks",
      desc: "Check off habits with tactile satisfaction. Lock in uninterrupted deep-work sprints using the Pomodoro timer and log nutrition without friction.",
    },
    {
      num: "03",
      tag: "Phase 3: Evolution",
      icon: <Trophy size={28} />,
      title: "AI Compounding & Mastery",
      desc: "Our neural algorithms adapt your targets, forecast burnout before you slip, and guide you through 21-day challenges to permanent habit permanence.",
    },
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const cards = cardRefs.current;
    if (!cards || cards.length === 0) return;

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          {
            transformPerspective: 1200,
            rotateX: 35,
            rotateY: i % 2 === 0 ? -12 : 12,
            z: -180,
            y: 80,
            opacity: 0.3,
            scale: 0.88,
          },
          {
            rotateX: 0,
            rotateY: 0,
            z: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 82%",
              end: "top 45%",
              scrub: 0.6,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        maxWidth: "1240px",
        margin: "0 auto",
        padding: "6rem 1.5rem",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
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
            marginBottom: "0.85rem",
            borderRadius: "4px",
          }}
        >
          Kinetic Progression
        </div>
        <h2
          style={{
            fontSize: "clamp(2.2rem, 4vw, 2.8rem)",
            fontWeight: 900,
            color: "#000000",
            margin: "0 0 0.6rem 0",
            letterSpacing: "-1px",
          }}
        >
          The 3-Step Habit Architecture
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#555555",
            margin: "0 auto",
            maxWidth: "600px",
          }}
        >
          Transforming fleeting resolutions into automated, unbreakable standards.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2.5rem",
          perspective: "1400px",
        }}
      >
        {steps.map((st, i) => (
          <div
            key={i}
            ref={(el) => (cardRefs.current[i] = el)}
            style={{
              backgroundColor: "#ffffff",
              border: "3px solid #000000",
              boxShadow: "10px 10px 0 0 #000000",
              padding: "2.75rem 2.25rem",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
              transformStyle: "preserve-3d",
              willChange: "transform, opacity",
            }}
          >
            {/* Watermarked Number in Deep Background */}
            <div
              style={{
                position: "absolute",
                top: "-15px",
                right: "15px",
                fontSize: "6rem",
                fontWeight: 900,
                color: "#000000",
                opacity: 0.05,
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              {st.num}
            </div>

            {/* Header: Icon & Step Tag */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "10px",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "3px 3px 0 0 #555555",
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
                  padding: "0.3rem 0.75rem",
                  backgroundColor: "#f5f5f5",
                  border: "1.5px solid #000000",
                  borderRadius: "4px",
                }}
              >
                {st.tag}
              </span>
            </div>

            <h3
              style={{
                fontSize: "1.45rem",
                fontWeight: 900,
                color: "#000000",
                margin: "0 0 1rem 0",
                letterSpacing: "-0.5px",
              }}
            >
              {st.title}
            </h3>

            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "#555555",
                margin: 0,
                flexGrow: 1,
              }}
            >
              {st.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
