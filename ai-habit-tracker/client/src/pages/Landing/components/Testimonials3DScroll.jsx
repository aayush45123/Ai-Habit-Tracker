import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Testimonials3DScroll() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

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

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const cards = cardsRef.current;
    if (!cards || cards.length === 0) return;

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        const offset = i === 1 ? -30 : 30;
        gsap.fromTo(
          card,
          {
            transformPerspective: 1200,
            rotateX: 25,
            rotateY: offset * 0.4,
            z: -120,
            y: 60,
            opacity: 0.4,
          },
          {
            rotateX: 0,
            rotateY: 0,
            z: 0,
            y: 0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 50%",
              scrub: 0.5,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="testimonials"
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
          Wall of Consistency
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
          Built for High Performers
        </h2>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#555555",
            margin: "0 auto",
            maxWidth: "600px",
          }}
        >
          Join thousands of developers, founders, students, and physicians who
          rely on HabitAI every day.
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
        {reviews.map((rev, i) => (
          <div
            key={i}
            ref={(el) => (cardsRef.current[i] = el)}
            style={{
              backgroundColor: "#ffffff",
              border: "3px solid #000000",
              boxShadow: "10px 10px 0 0 #000000",
              padding: "2.5rem 2rem",
              borderRadius: "14px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transformStyle: "preserve-3d",
              willChange: "transform, opacity",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
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
                    fontWeight: 900,
                    backgroundColor: "#f5f5f5",
                    border: "1.5px solid #000000",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "4px",
                  }}
                >
                  {rev.streak}
                </span>
              </div>

              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.65,
                  color: "#222222",
                  fontStyle: "italic",
                  marginBottom: "2rem",
                }}
              >
                "{rev.quote}"
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                borderTop: "2px solid #f0f0f0",
                paddingTop: "1.25rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "0.9rem",
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
                  <ShieldCheck size={16} color="#27c93f" strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: "0.78rem", color: "#666666", fontWeight: 700 }}>
                  {rev.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
